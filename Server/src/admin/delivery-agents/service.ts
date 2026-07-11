import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import DeliveryAgent from "../../models/deliveryAgent.model";
import type { AppError } from "../../shared/middleware/error.middleware";

function notFound(): AppError {
  return Object.assign(new Error("Delivery partner not found"), { statusCode: 404 }) as AppError;
}

function conflict(msg: string): AppError {
  return Object.assign(new Error(msg), { statusCode: 409 }) as AppError;
}

function safeJson(agent: DeliveryAgent) {
  const obj = agent.toJSON() as Record<string, any>;
  delete obj.password;
  return obj;
}

async function assertUniqueMobile(mobile: string, excludeId?: number) {
  const where: Record<string, any> = { mobile, is_deleted: false };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await DeliveryAgent.findOne({ where }))
    throw conflict("A delivery partner with this mobile number already exists.");
}

async function assertUniqueEmail(email: string, excludeId?: number) {
  const where: Record<string, any> = { email, is_deleted: false };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await DeliveryAgent.findOne({ where }))
    throw conflict("A delivery partner with this email address already exists.");
}

export const listAgents = async (params: {
  page: number;
  limit: number;
  search?: string;
  status?: boolean;
}) => {
  const { page, limit, search, status } = params;
  const where: Record<string, any> = { is_deleted: false };
  if (status !== undefined) where.status = status;
  if (search) {
    where[Op.or as any] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name:  { [Op.like]: `%${search}%` } },
      { email:      { [Op.like]: `%${search}%` } },
      { mobile:     { [Op.like]: `%${search}%` } },
      { city:       { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await DeliveryAgent.findAndCountAll({
    where,
    order: [["created_ts", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    rows: rows.map(safeJson),
    count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

export const createAgent = async (data: {
  first_name: string;
  last_name: string;
  email?: string;
  mobile: string;
  password: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  document_type?: string;
  document_no?: string;
  contact_person?: string;
  contact_person_number?: string;
  store_id?: number | null;
  outlet_id?: number | null;
}) => {
  if (!data.first_name?.trim()) throw Object.assign(new Error("First name is required"), { statusCode: 400 }) as AppError;
  if (!data.last_name?.trim())  throw Object.assign(new Error("Last name is required"),  { statusCode: 400 }) as AppError;
  if (!data.mobile?.trim())     throw Object.assign(new Error("Mobile is required"),     { statusCode: 400 }) as AppError;
  if (!data.password?.trim())   throw Object.assign(new Error("Password is required"),   { statusCode: 400 }) as AppError;

  await assertUniqueMobile(data.mobile.trim());
  if (data.email?.trim()) await assertUniqueEmail(data.email.trim());

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const agent = await DeliveryAgent.create({
    first_name:            data.first_name.trim(),
    last_name:             data.last_name.trim(),
    email:                 data.email?.trim()                 || null,
    mobile:                data.mobile.trim(),
    password:              hashedPassword,
    address1:              data.address1?.trim()              || null,
    address2:              data.address2?.trim()              || null,
    city:                  data.city?.trim()                  || null,
    state:                 data.state?.trim()                 || null,
    pincode:               data.pincode?.trim()               || null,
    document_type:         (data.document_type as any)        || null,
    document_no:           data.document_no?.trim()           || null,
    contact_person:        data.contact_person?.trim()        || null,
    contact_person_number: data.contact_person_number?.trim() || null,
    store_id:              data.store_id  ?? null,
    outlet_id:             data.outlet_id ?? null,
  });

  return safeJson(agent);
};

export const updateAgent = async (
  id: number,
  data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    password: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    pincode: string;
    document_type: string;
    document_no: string;
    contact_person: string;
    contact_person_number: string;
    store_id: number | null;
    outlet_id: number | null;
  }>
) => {
  const agent = await DeliveryAgent.findOne({ where: { id, is_deleted: false } });
  if (!agent) throw notFound();

  if (data.mobile !== undefined) await assertUniqueMobile(data.mobile.trim(), id);
  if (data.email?.trim())        await assertUniqueEmail(data.email.trim(), id);

  const fields: Record<string, any> = {};
  if (data.first_name            !== undefined) fields.first_name            = data.first_name.trim();
  if (data.last_name             !== undefined) fields.last_name             = data.last_name.trim();
  if (data.email                 !== undefined) fields.email                 = data.email?.trim() || null;
  if (data.mobile                !== undefined) fields.mobile                = data.mobile.trim();
  if (data.password?.trim())                   fields.password              = await bcrypt.hash(data.password.trim(), 10);
  if (data.address1              !== undefined) fields.address1              = data.address1?.trim()              || null;
  if (data.address2              !== undefined) fields.address2              = data.address2?.trim()              || null;
  if (data.city                  !== undefined) fields.city                  = data.city?.trim()                  || null;
  if (data.state                 !== undefined) fields.state                 = data.state?.trim()                 || null;
  if (data.pincode               !== undefined) fields.pincode               = data.pincode?.trim()               || null;
  if (data.document_type         !== undefined) fields.document_type         = data.document_type                 || null;
  if (data.document_no           !== undefined) fields.document_no           = data.document_no?.trim()           || null;
  if (data.contact_person        !== undefined) fields.contact_person        = data.contact_person?.trim()        || null;
  if (data.contact_person_number !== undefined) fields.contact_person_number = data.contact_person_number?.trim() || null;
  if (data.store_id              !== undefined) fields.store_id              = data.store_id  ?? null;
  if (data.outlet_id             !== undefined) fields.outlet_id             = data.outlet_id ?? null;

  await agent.update(fields);
  return safeJson(agent);
};

export const deleteAgent = async (id: number) => {
  const agent = await DeliveryAgent.findOne({ where: { id, is_deleted: false } });
  if (!agent) throw notFound();
  await agent.update({ is_deleted: true, deleted_at: new Date() });
};

export const toggleAgentStatus = async (id: number) => {
  const agent = await DeliveryAgent.findOne({ where: { id, is_deleted: false } });
  if (!agent) throw notFound();
  await agent.update({ status: !agent.status });
  return safeJson(agent);
};
