import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { uploadSingle } from "../../shared/utils/uploadHelper";
import type { AppError } from "../../shared/middleware/error.middleware";
import * as service from "./service";

export const upload = (req: Request, res: Response, next: NextFunction): void => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      const appErr: AppError = Object.assign(
        new Error(err.message || "Upload failed"),
        { statusCode: 400 }
      );
      return next(appErr);
    }
    if (!req.file) {
      return next(Object.assign(new Error("No file provided"), { statusCode: 400 }));
    }
    try {
      const media = await service.createMedia({
        filename: req.file.filename,
        original_name: req.file.originalname,
        path: `/uploads/media/${req.file.filename}`,
        mime_type: req.file.mimetype,
        size: req.file.size,
        store_id: req.admin!.store_id,
      });
      sendSuccess(res, media, "File uploaded", 201);
    } catch (e) {
      next(e);
    }
  });
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const media = await service.listMedia(req.admin!.store_id);
  sendSuccess(res, media);
});
