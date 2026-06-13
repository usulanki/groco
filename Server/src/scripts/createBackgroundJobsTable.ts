/**
 * Migration: create background_jobs table.
 *
 * Run: npx ts-node src/scripts/createBackgroundJobsTable.ts
 */

import sequelize from "../config/database";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS background_jobs (
        id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        job_code       VARCHAR(25)   NOT NULL,
        type           VARCHAR(50)   NOT NULL,
        status         ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
        total_rows     INT UNSIGNED  NOT NULL DEFAULT 0,
        processed_rows INT UNSIGNED  NOT NULL DEFAULT 0,
        failed_rows    INT UNSIGNED  NOT NULL DEFAULT 0,
        error_message  TEXT          NULL,
        meta           JSON          NULL,
        admin_id       INT UNSIGNED  NOT NULL,
        started_at     DATETIME      NULL,
        ended_at       DATETIME      NULL,
        created_ts     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_ts     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_job_code (job_code),
        CONSTRAINT fk_bj_admin FOREIGN KEY (admin_id) REFERENCES admins (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log("Table background_jobs: ready");
    await sequelize.close();
  } catch (err: any) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
