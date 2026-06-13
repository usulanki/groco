/**
 * dump-database.ts
 * Exports the current database to a self-contained SQL file:
 *   1. CREATE SCHEMA IF NOT EXISTS (from .env DB_NAME)
 *   2. CREATE TABLE statements for every table
 *   3. INSERT statements for every row
 *
 * Usage: npx tsx src/scripts/dump-database.ts
 * Output: karto-dump.sql (project root)
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const DB_HOST = process.env.DB_HOST!;
const DB_PORT = parseInt(process.env.DB_PORT ?? "3306", 10);
const DB_NAME = process.env.DB_NAME!;
const DB_USER = process.env.DB_USER!;
const DB_PASSWORD = process.env.DB_PASSWORD!;
const OUTPUT_FILE = path.resolve(process.cwd(), "karto-dump.sql");

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  }
  if (Buffer.isBuffer(val)) return `0x${val.toString("hex")}`;
  // Escape string: backslash, single quote, NUL, newline, carriage return, ctrl-Z
  const str = String(val)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\0/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\x1a/g, "\\Z");
  return `'${str}'`;
}

(async () => {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
    dateStrings: true,
  });

  try {
    console.log(`Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

    const lines: string[] = [];

    lines.push("-- karto-dump.sql");
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push(`-- Source: ${DB_HOST}/${DB_NAME}`);
    lines.push("");
    lines.push("SET NAMES utf8mb4;");
    lines.push("SET CHARACTER SET utf8mb4;");
    lines.push("SET FOREIGN_KEY_CHECKS = 0;");
    lines.push("");
    lines.push(`CREATE SCHEMA IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    lines.push(`USE \`${DB_NAME}\`;`);
    lines.push("");

    // Get ordered list of tables
    const [tableRows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",
      [DB_NAME]
    );
    const tables = tableRows.map((r) => r.table_name as string);
    console.log(`Found ${tables.length} tables.`);

    for (const table of tables) {
      console.log(`  Dumping schema: ${table}`);

      // DROP + CREATE TABLE
      const [[createRow]] = await conn.query<mysql.RowDataPacket[]>(
        `SHOW CREATE TABLE \`${table}\``
      );
      const createSql = (createRow["Create Table"] as string)
        // remove AUTO_INCREMENT=N so the dump is portable
        .replace(/\s+AUTO_INCREMENT=\d+/gi, "");

      lines.push(`-- Table: ${table}`);
      lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
      lines.push(`${createSql};`);
      lines.push("");
    }

    // Now dump data table by table
    for (const table of tables) {
      const [rows] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT * FROM \`${table}\``
      );

      if (rows.length === 0) continue;

      console.log(`  Dumping data:   ${table} (${rows.length} rows)`);
      lines.push(`-- Data for table: ${table}`);
      lines.push(`LOCK TABLES \`${table}\` WRITE;`);

      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const cols = Object.keys(batch[0])
          .map((c) => `\`${c}\``)
          .join(", ");
        const valuesList = batch
          .map((row) => `(${Object.values(row).map(escapeValue).join(", ")})`)
          .join(",\n  ");
        lines.push(`INSERT INTO \`${table}\` (${cols}) VALUES`);
        lines.push(`  ${valuesList};`);
      }

      lines.push(`UNLOCK TABLES;`);
      lines.push("");
    }

    lines.push("SET FOREIGN_KEY_CHECKS = 1;");
    lines.push("");

    fs.writeFileSync(OUTPUT_FILE, lines.join("\n"), "utf8");
    console.log(`\nDump written to: ${OUTPUT_FILE}`);
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error("Dump failed:", err);
  process.exit(1);
});
