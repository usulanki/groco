import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { sendSuccess } from "../../shared/utils/apiResponse";
import * as service from "./service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page   = Number(req.query.page)  || 1;
  const limit  = Number(req.query.limit) || 20;
  const params: Parameters<typeof service.listAgents>[0] = { page, limit };
  if (typeof req.query.search === "string" && req.query.search) params.search = req.query.search;
  if (req.query.status !== undefined) params.status = req.query.status === "true";
  const result = await service.listAgents(params);
  sendSuccess(res, result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const agent = await service.createAgent(req.body);
  sendSuccess(res, agent, "Delivery partner added", 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id    = Number(req.params.id);
  const agent = await service.updateAgent(id, req.body);
  sendSuccess(res, agent, "Delivery partner updated");
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await service.deleteAgent(id);
  sendSuccess(res, null, "Delivery partner deleted");
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const id    = Number(req.params.id);
  const agent = await service.toggleAgentStatus(id);
  sendSuccess(res, agent, "Status updated");
});
