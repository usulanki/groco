import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import { State, City } from "../../models/index";

const router = Router();

router.get("/states", asyncHandler(async (_req, res) => {
  const states = await State.findAll({ where: { status: true }, order: [["name", "ASC"]] });
  sendSuccess(res, states);
}));

router.get("/cities", asyncHandler(async (req, res) => {
  const where: Record<string, unknown> = { status: true };
  if (req.query["state_id"]) where["state_id"] = Number(req.query["state_id"]);
  const cities = await City.findAll({ where, order: [["name", "ASC"]] });
  sendSuccess(res, cities);
}));

export default router;
