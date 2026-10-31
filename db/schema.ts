import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  color: text("color").notNull(),
  accent: text("accent").notNull(),
  stock: integer("stock").notNull().default(0),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  subtotal: real("subtotal").notNull(),
  shipping: real("shipping").notNull(),
  total: real("total").notNull(),
  status: text("status").notNull().default("Confirmed"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});
