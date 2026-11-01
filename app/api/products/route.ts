import { asc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { authorizeAdminRequest } from "../../../lib/admin-auth";

const catalog = [
  { slug: "halo-desk-lamp", name: "Halo Desk Lamp", category: "Desk", description: "A dimmable pool of warm light, balanced on a slender powder-coated frame.", price: 89, compareAtPrice: 109, color: "#d9e7dc", accent: "#f26b4b", stock: 18, featured: true },
  { slug: "arc-wireless-speaker", name: "Arc Wireless Speaker", category: "Audio", description: "Room-filling sound in a tactile, compact form with twelve-hour battery life.", price: 129, compareAtPrice: null, color: "#d9d5c8", accent: "#1e2725", stock: 12, featured: true },
  { slug: "drift-mechanical-keyboard", name: "Drift Keyboard", category: "Desk", description: "Low-profile mechanical keys, soft acoustics, and effortless multi-device switching.", price: 149, compareAtPrice: 179, color: "#d9d8e8", accent: "#4b3f72", stock: 9, featured: true },
  { slug: "fold-aluminum-stand", name: "Fold Laptop Stand", category: "Desk", description: "A single sheet of recycled aluminum, folded into an ergonomic everyday stand.", price: 59, compareAtPrice: null, color: "#e8ded1", accent: "#b36b3e", stock: 25, featured: false },
  { slug: "pebble-charger", name: "Pebble Charger", category: "Everyday", description: "A weighted wireless charger that keeps your phone exactly where you leave it.", price: 79, compareAtPrice: 95, color: "#d5e3e8", accent: "#285765", stock: 21, featured: false },
  { slug: "canvas-catchall", name: "Canvas Catchall", category: "Everyday", description: "A structured canvas organizer for cables, pens, keys, and daily fragments.", price: 45, compareAtPrice: null, color: "#ead9c9", accent: "#9f4c2f", stock: 30, featured: false },
];

async function ensureCatalog() {
  const db = getDb();
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length === 0) await db.insert(products).values(catalog);
  return db;
}

export async function GET() {
  try {
    const db = await ensureCatalog();
    const rows = await db.select().from(products).orderBy(asc(products.id));
    return Response.json({ products: rows });
  } catch {
    return Response.json({ error: "The catalog is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, env);
  if (denied) return denied;
  try {
    const body = await request.json() as typeof catalog[number];
    if (!body.name || !body.slug || !body.category || body.price < 0) return Response.json({ error: "Invalid product data." }, { status: 400 });
    const [product] = await getDb().insert(products).values(body).returning();
    return Response.json({ product }, { status: 201 });
  } catch { return Response.json({ error: "Could not create product." }, { status: 409 }); }
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, env);
  if (denied) return denied;
  try {
    const body = await request.json() as Partial<typeof catalog[number]> & { id?: number };
    if (!body.id) return Response.json({ error: "Product ID is required." }, { status: 400 });
    const { id, ...changes } = body;
    const [product] = await getDb().update(products).set(changes).where(eq(products.id, id)).returning();
    return Response.json({ product });
  } catch { return Response.json({ error: "Could not update product." }, { status: 409 }); }
}

export async function DELETE(request: Request) {
  const denied = await authorizeAdminRequest(request, env);
  if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Product ID is required." }, { status: 400 });
  const [product] = await getDb().delete(products).where(eq(products.id, id)).returning();
  return Response.json({ product });
}
