/**
 * Common background import processor.
 *
 * Usage:
 *   1. Call `createImportJob(type, totalRows, adminId, meta)` after validating the file.
 *      Returns the new BackgroundJob instance (status: pending).
 *   2. Call `runImportJob(job.id, rows, rowProcessor)` — runs asynchronously via
 *      setImmediate so the HTTP response is returned first.
 *
 * RowProcessor must return:
 *   { success: true;  action: 'inserted' | 'updated' }
 *   { success: false; error: string }
 *
 * On completion the job record is updated with:
 *   - status, processed_rows, failed_rows, ended_at
 *   - remarks: { inserted, updated, errors: [{ row, error }] }
 *
 * NOTE: Intentionally simple (in-process). When moving to a queue (BullMQ, SQS, etc.)
 * only this file and its callers need updating.
 */

import BackgroundJob, { type JobRemarks } from "../../models/backgroundJob.model";

export type RowResult =
  | { success: true;  action: "inserted" | "updated" }
  | { success: false; error: string };

export type RowProcessor<T> = (row: T) => Promise<RowResult>;

// ── Generate a human-readable job code: JOB-YYYYMMDD-NNNNN ──────────────────

function buildJobCode(id: number): string {
  const now  = new Date();
  const date =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  return `JOB-${date}-${String(id).padStart(5, "0")}`;
}

// ── Step 1: create the pending job record ─────────────────────────────────────

export async function createImportJob(
  type: string,
  totalRows: number,
  adminId: number,
  meta?: Record<string, unknown>
): Promise<BackgroundJob> {
  const job = await BackgroundJob.create({
    job_code:   `JOB-PENDING-${Date.now()}`,   // temporary — overwritten below
    type,
    total_rows: totalRows,
    admin_id:   adminId,
    meta:       meta ?? null,
  });
  await job.update({ job_code: buildJobCode(job.id) });
  return job;
}

// ── Step 2: fire-and-forget processor ────────────────────────────────────────

export function runImportJob<T>(
  jobId: number,
  rows: T[],
  processor: RowProcessor<T>
): void {
  setImmediate(async () => {
    try {
      await BackgroundJob.update(
        { status: "processing", started_at: new Date() },
        { where: { id: jobId } }
      );

      let processed = 0;
      let inserted  = 0;
      let updated   = 0;
      let failed    = 0;
      const errors: JobRemarks["errors"] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const result = await processor(rows[i]!);
          if (result.success) {
            processed++;
            if (result.action === "inserted") inserted++;
            else                               updated++;
          } else {
            failed++;
            errors.push({ row: i + 2, error: result.error }); // +2 → 1-based + skip header row
          }
        } catch (err: any) {
          failed++;
          errors.push({ row: i + 2, error: err?.message ?? "Unknown error" });
        }

        // Flush progress every 10 rows
        if ((processed + failed) % 10 === 0) {
          await BackgroundJob.update(
            { processed_rows: processed, failed_rows: failed },
            { where: { id: jobId } }
          );
        }
      }

      const remarks: JobRemarks = { inserted, updated, errors };

      await BackgroundJob.update(
        {
          status:         failed === rows.length ? "failed" : "completed",
          processed_rows: processed,
          failed_rows:    failed,
          remarks,
          ended_at:       new Date(),
        },
        { where: { id: jobId } }
      );
    } catch (err: any) {
      await BackgroundJob.update(
        { status: "failed", error_message: err?.message ?? "Unknown error", ended_at: new Date() },
        { where: { id: jobId } }
      ).catch(() => {});
    }
  });
}
