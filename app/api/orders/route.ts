import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { orderItems, orders, products } from "../../../db/schema";

function identity(request: Request) {
  return {
    userId: request.headers.get("oai-authenticated-user-id") ?? "local-demo-user",
    email: request.headers.get("oai-authenticated-user-email") ?? "shopper@luma.local",
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = identity(request);
    const rows = await getDb().select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    return Response.json({ orders: rows });
  } catch { return Response.json({ error: "Could not load order history." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { customerName?: string; email?: string; address?: string; city?: string; country?: string; items?: Array<{ productId: number; quantity: number }> };
    if (!body.customerName?.trim() || !body.email?.includes("@") || !body.address?.trim() || !body.city?.trim() || !body.country?.trim() || !body.items?.length) return Response.json({ error: "Complete all checkout details." }, { status: 400 });
    const db = getDb();
    const productRows = await db.select().from(products);
    const byId = new Map(productRows.map((product) => [product.id, product]));
    let subtotal = 0;
    const normalized = [];
    for (const item of body.items) {
      const product = byId.get(item.productId);
      const quantity = Math.max(1, Math.min(8, Math.floor(item.quantity)));
      if (!product || product.stock < quantity) return Response.json({ error: `${product?.name ?? "A product"} is unavailable in that quantity.` }, { status: 409 });
      subtotal += product.price * quantity;
      normalized.push({ product, quantity });
    }
    const shipping = subtotal >= 150 ? 0 : 12;
    const { userId } = identity(request);
    const orderNumber = `LM-${Date.now().toString().slice(-8)}`;
    const [order] = await db.insert(orders).values({ orderNumber, userId, email: body.email.trim().toLowerCase(), customerName: body.customerName.trim(), address: body.address.trim(), city: body.city.trim(), country: body.country.trim(), subtotal, shipping, total: subtotal + shipping }).returning();
    await db.insert(orderItems).values(normalized.map(({ product, quantity }) => ({ orderId: order.id, productId: product.id, productName: product.name, quantity, unitPrice: product.price })));
    for (const { product, quantity } of normalized) await db.update(products).set({ stock: product.stock - quantity }).where(eq(products.id, product.id));
    return Response.json({ order }, { status: 201 });
  } catch { return Response.json({ error: "Checkout could not be completed." }, { status: 500 }); }
}
