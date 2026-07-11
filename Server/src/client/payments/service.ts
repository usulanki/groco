import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Cart, Order, OrderItem, Payment, Product, ProductPrice, ProductOutlet } from "../../models/index";

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ─── Create Order + Stripe PaymentIntent ─────────────────────────────────────

export const createPaymentIntent = async (
  userId: string,
  data: { addressId?: number }
) => {
  // 1. Fetch cart items with prices
  const cartItems = await Cart.findAll({
    where: { user_id: Number(userId), is_removed: false },
    include: [
      {
        model: Product,
        attributes: ["id", "store_id"],
        include: [
          { model: ProductPrice, as: "prices", where: { is_deleted: false }, required: false },
        ],
      },
    ],
  });

  if (cartItems.length === 0) {
    throw Object.assign(new Error("Cart is empty"), { statusCode: 400 });
  }

  // 2. Calculate total and get store info from first product
  let subtotal = 0;
  const firstProduct = (cartItems[0] as any).Product;
  const storeId: number = firstProduct?.store_id ?? 1;

  // Get a valid outlet for this store
  const productOutlet = await ProductOutlet.findOne({
    where: { product_id: firstProduct?.id },
  });
  const outletId: number = (productOutlet as any)?.outlet_id ?? 1;

  for (const item of cartItems) {
    const product = (item as any).Product;
    const price = product?.prices?.[0];
    const unitPrice = price ? Number(price.final_price ?? price.price) : 0;
    subtotal += unitPrice * item.quantity;
  }

  // 3. Create Order
  const orderNo = `ORD-${Date.now()}`;
  const order = await Order.create({
    user_id:      Number(userId),
    address_id:   data.addressId ?? null,
    store_id:     storeId,
    outlet_id:    outletId,
    order_no:     orderNo,
    order_amount: subtotal,
    total:        subtotal,
    payment_mode: "online",
    order_status: "order_placed",
    source:       "WEBSITE",
  } as any);

  // 4. Create OrderItems
  await Promise.all(
    cartItems.map((item) => {
      const product   = (item as any).Product;
      const price     = product?.prices?.[0];
      const unitPrice = price ? Number(price.final_price ?? price.price) : 0;
      return OrderItem.create({
        order_id:   order.id,
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity:   item.quantity,
        price:      unitPrice,
        total:      unitPrice * item.quantity,
      });
    })
  );

  // 5. Create pending Payment record
  const payment = await Payment.create({
    order_id: order.id,
    method:   "card",
    status:   "pending",
  });

  // 6. Create Stripe PaymentIntent (amount in smallest currency unit — paise for INR)
  const paymentIntent = await stripe.paymentIntents.create({
    amount:   Math.round(subtotal * 100),
    currency: "inr",
    metadata: {
      orderId:   String(order.id),
      paymentId: String(payment.id),
      userId,
    },
  });

  // 7. Clear cart
  await Cart.update(
    { is_removed: true },
    { where: { user_id: Number(userId), is_removed: false } }
  );

  return { orderId: order.id, clientSecret: paymentIntent.client_secret };
};

// ─── Confirm payment after Stripe client-side success ────────────────────────

export const confirmPayment = async (
  userId: string,
  data: { orderId: number; stripePaymentIntentId: string }
) => {
  // Verify with Stripe that the PaymentIntent actually succeeded
  const intent = await stripe.paymentIntents.retrieve(data.stripePaymentIntentId);
  if (intent.status !== "succeeded") {
    throw Object.assign(new Error("Payment not confirmed by Stripe"), { statusCode: 400 });
  }

  const order = await Order.findOne({
    where: { id: data.orderId, user_id: Number(userId) },
  });
  if (!order) throw Object.assign(new Error("Order not found"), { statusCode: 404 });

  const payment = await Payment.findOne({ where: { order_id: order.id } });
  if (!payment) throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });

  await payment.update({ status: "success" });
  await order.update({ payment_reference: data.stripePaymentIntentId });

  return { orderId: order.id, status: "order_placed" };
};

// ─── Create Order + Razorpay Order ───────────────────────────────────────────

export const createRazorpayOrder = async (
  userId: string,
  data: { addressId?: number }
) => {
  const cartItems = await Cart.findAll({
    where: { user_id: Number(userId), is_removed: false },
    include: [
      {
        model: Product,
        attributes: ["id", "store_id"],
        include: [
          { model: ProductPrice, as: "prices", where: { is_deleted: false }, required: false },
        ],
      },
    ],
  });

  if (cartItems.length === 0) {
    throw Object.assign(new Error("Cart is empty"), { statusCode: 400 });
  }

  let subtotal = 0;
  const firstProduct = (cartItems[0] as any).Product;
  const storeId: number  = firstProduct?.store_id ?? 1;
  const productOutlet = await ProductOutlet.findOne({ where: { product_id: firstProduct?.id } });
  const outletId: number = (productOutlet as any)?.outlet_id ?? 1;

  for (const item of cartItems) {
    const product   = (item as any).Product;
    const price     = product?.prices?.[0];
    const unitPrice = price ? Number(price.final_price ?? price.price) : 0;
    subtotal += unitPrice * item.quantity;
  }

  const orderNo = `ORD-${Date.now()}`;
  const order   = await Order.create({
    user_id:      Number(userId),
    address_id:   data.addressId ?? null,
    store_id:     storeId,
    outlet_id:    outletId,
    order_no:     orderNo,
    order_amount: subtotal,
    total:        subtotal,
    payment_mode: "online",
    order_status: "order_placed",
    source:       "WEBSITE",
  } as any);

  await Promise.all(
    cartItems.map((item) => {
      const product   = (item as any).Product;
      const price     = product?.prices?.[0];
      const unitPrice = price ? Number(price.final_price ?? price.price) : 0;
      return OrderItem.create({
        order_id:   order.id,
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity:   item.quantity,
        price:      unitPrice,
        total:      unitPrice * item.quantity,
      });
    })
  );

  await Payment.create({ order_id: order.id, method: "card", status: "pending" });

  const rzpOrder = await razorpay.orders.create({
    amount:   Math.round(subtotal * 100),
    currency: "INR",
    receipt:  `order_${order.id}`,
  });

  await Cart.update(
    { is_removed: true },
    { where: { user_id: Number(userId), is_removed: false } }
  );

  return {
    orderId:        order.id,
    razorpayOrderId: rzpOrder.id,
    amount:         rzpOrder.amount,
    keyId:          process.env.RAZORPAY_KEY_ID,
  };
};

// ─── Verify Razorpay payment signature ───────────────────────────────────────

export const verifyRazorpayPayment = async (
  userId: string,
  data: {
    orderId: number;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
    .digest("hex");

  if (expected !== data.razorpay_signature) {
    throw Object.assign(new Error("Invalid payment signature"), { statusCode: 400 });
  }

  const order = await Order.findOne({ where: { id: data.orderId, user_id: Number(userId) } });
  if (!order) throw Object.assign(new Error("Order not found"), { statusCode: 404 });

  const payment = await Payment.findOne({ where: { order_id: order.id } });
  if (!payment) throw Object.assign(new Error("Payment record not found"), { statusCode: 404 });

  await order.update({ payment_reference: data.razorpay_payment_id });
  await payment.update({ status: "success" });

  return { orderId: order.id, status: "order_placed" };
};
