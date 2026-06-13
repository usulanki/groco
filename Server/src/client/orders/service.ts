import { Order, OrderItem, Cart, Product } from "../../models/index";

export const getOrders = async (userId: string) => {
  return Order.findAll({
    where: { user_id: Number(userId) },
    include: [{ model: OrderItem, include: [{ model: Product, attributes: ["id", "name"] }] }],
    order: [["created_ts", "DESC"]],
  });
};

export const getOrderById = async (userId: string, orderId: string) => {
  return Order.findOne({
    where: { id: Number(orderId), user_id: Number(userId) },
    include: [{ model: OrderItem, include: [{ model: Product, attributes: ["id", "name"] }] }],
  });
};

export const createOrder = async (userId: string) => {
  const items = await Cart.findAll({
    where: { user_id: Number(userId), is_removed: false },
    include: [Product],
  });
  if (items.length === 0) throw new Error("Cart is empty");

  const total = items.reduce((sum, item) => {
    const product = item.get("Product") as Product;
    return sum + item.quantity * Number(product.price);
  }, 0);

  const order = await Order.create({ user_id: Number(userId), total });
  await Promise.all(
    items.map((item) => {
      const product = item.get("Product") as Product;
      return OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(product.price),
        total: item.quantity * Number(product.price),
      });
    })
  );

  await Cart.update({ is_removed: true }, { where: { user_id: Number(userId), is_removed: false } });
  return order;
};
