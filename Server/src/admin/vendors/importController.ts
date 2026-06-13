import type { Request, Response } from "express";
import * as XLSX from "xlsx";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess, sendError } from "../../shared/utils/apiResponse";
import { createImportJob, runImportJob } from "../../shared/utils/importProcessor";
import { Vendor } from "../../models/index";

const REQUIRED_HEADERS = ["company_name", "owner_name", "owner_phone"];

interface VendorRow {
  company_name: string;
  owner_name: string;
  owner_phone: string;
  owner_email?: string;
  owner_address?: string;
  gst_no?: string;
  storeId: number | null;
}

export const importVendors = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return sendError(res, "No file uploaded.", 400);

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  } catch {
    return sendError(res, "Unable to read the file. Please upload a valid Excel file.", 400);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return sendError(res, "The Excel file has no sheets.", 400);

  const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]!, { defval: "" });
  if (raw.length === 0) return sendError(res, "The file has no data rows.", 400);

  // Normalize headers to lowercase_snake_case
  const rows_raw = raw.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k.toLowerCase().trim().replace(/\s+/g, "_"), String(v).trim()])
    )
  );

  const missing = REQUIRED_HEADERS.filter((h) => !(h in rows_raw[0]!));
  if (missing.length > 0) {
    return sendError(res, `Missing required columns: ${missing.join(", ")}. Please use the provided template.`, 400);
  }

  const storeId = req.admin!.store_id;

  const rows: VendorRow[] = rows_raw.map((r) => {
    const row: VendorRow = {
      company_name: r["company_name"] ?? "",
      owner_name:   r["owner_name"]   ?? "",
      owner_phone:  r["owner_phone"]  ?? "",
      storeId,
    };
    if (r["owner_email"])   row.owner_email   = r["owner_email"];
    if (r["owner_address"]) row.owner_address = r["owner_address"];
    if (r["gst_no"])        row.gst_no        = r["gst_no"];
    return row;
  });

  const job = await createImportJob("vendor_import", rows.length, req.admin!.id, {
    filename: req.file.originalname,
    store_id: storeId,
  });

  // Upsert logic: match on owner_phone — update if exists, insert if not
  runImportJob<VendorRow>(job.id, rows, async (row) => {
    if (!row.company_name || !row.owner_name || !row.owner_phone) {
      return { success: false, error: "Missing required fields (company_name, owner_name, owner_phone)" };
    }

    const existing = await Vendor.findOne({
      where: { owner_phone: row.owner_phone, is_deleted: false },
    });

    if (existing) {
      await existing.update({
        company_name:  row.company_name,
        owner_name:    row.owner_name,
        ...(row.owner_email   !== undefined && { owner_email:   row.owner_email   }),
        ...(row.owner_address !== undefined && { owner_address: row.owner_address }),
        ...(row.gst_no        !== undefined && { gst_no:        row.gst_no        }),
      });
      return { success: true, action: "updated" };
    }

    await Vendor.create({
      store_id:      row.storeId,
      company_name:  row.company_name,
      owner_name:    row.owner_name,
      owner_phone:   row.owner_phone,
      owner_email:   row.owner_email   ?? null,
      owner_address: row.owner_address ?? null,
      gst_no:        row.gst_no        ?? null,
    });
    return { success: true, action: "inserted" };
  });

  sendSuccess(res, { job_code: job.job_code }, "Import started. Track progress in Jobs.", 202);
});
