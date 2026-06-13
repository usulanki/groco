import { DataTypes, Model, type Optional } from "sequelize";
import sequelize from "../config/database";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface JobRemarks {
  inserted: number;
  updated: number;
  errors: { row: number; error: string }[];
}

interface BackgroundJobAttributes {
  id: number;
  job_code: string;
  type: string;
  status: JobStatus;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  error_message: string | null;
  meta: Record<string, unknown> | null;
  remarks: JobRemarks | null;
  admin_id: number;
  started_at: Date | null;
  ended_at: Date | null;
  created_ts?: Date;
  updated_ts?: Date;
}

type BackgroundJobCreationAttributes = Optional<
  BackgroundJobAttributes,
  "id" | "status" | "total_rows" | "processed_rows" | "failed_rows" | "error_message" | "meta" | "remarks" | "started_at" | "ended_at"
>;

class BackgroundJob
  extends Model<BackgroundJobAttributes, BackgroundJobCreationAttributes>
  implements BackgroundJobAttributes
{
  declare id: number;
  declare job_code: string;
  declare type: string;
  declare status: JobStatus;
  declare total_rows: number;
  declare processed_rows: number;
  declare failed_rows: number;
  declare error_message: string | null;
  declare meta: Record<string, unknown> | null;
  declare remarks: JobRemarks | null;
  declare admin_id: number;
  declare started_at: Date | null;
  declare ended_at: Date | null;
  declare created_ts: Date;
  declare updated_ts: Date;
}

BackgroundJob.init(
  {
    id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    job_code:       { type: DataTypes.STRING(25),  allowNull: false, unique: true },
    type:           { type: DataTypes.STRING(50),  allowNull: false },
    status:         { type: DataTypes.ENUM("pending", "processing", "completed", "failed"), allowNull: false, defaultValue: "pending" },
    total_rows:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    processed_rows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    failed_rows:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    error_message:  { type: DataTypes.TEXT,        allowNull: true, defaultValue: null },
    meta:           { type: DataTypes.JSON,        allowNull: true, defaultValue: null },
    remarks:        { type: DataTypes.JSON,        allowNull: true, defaultValue: null },
    admin_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: "admins", key: "id" } },
    started_at:     { type: DataTypes.DATE,        allowNull: true, defaultValue: null },
    ended_at:       { type: DataTypes.DATE,        allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    tableName: "background_jobs",
    createdAt: "created_ts",
    updatedAt: "updated_ts",
  }
);

export default BackgroundJob;
