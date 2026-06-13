import { Address, City, State } from "../../models/index";

export const getAddresses = async (userId: string) => {
  return Address.findAll({
    where: { user_id: Number(userId), status: true },
    include: [
      { model: City, attributes: ["id", "name"] },
      { model: State, attributes: ["id", "name"] },
    ],
    order: [["created_ts", "DESC"]],
  });
};

export const createAddress = async (
  userId: string,
  data: {
    address1: string;
    address2?: string;
    city_id: number;
    state_id: number;
    pincode: string;
  }
) => {
  return Address.create({
    user_id: Number(userId),
    address1: data.address1,
    address2: data.address2 ?? null,
    city_id: data.city_id,
    state_id: data.state_id,
    pincode: data.pincode,
  });
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const address = await Address.findOne({
    where: { id: Number(addressId), user_id: Number(userId) },
  });
  if (!address) return null;
  await address.update({ status: false });
  return address;
};
