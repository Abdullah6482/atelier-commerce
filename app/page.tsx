"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, Minus, Package, Plus, Search, ShoppingBag, Sparkles, Truck, UserRound, X } from "lucide-react";
import { ProductArt } from "../components/product-art";

type Product = { id: number; slug: string; name: string; category: string; description: string; price: number; compareAtPrice: number | null; color: string; accent: string; stock: number; featured: boolean };
type CartItem = { product: Product; quantity: number };
type Order = { id: number; orderNumber: string; total: number; status: string; createdAt: string };
type Checkout = { customerName: string; email: string; address: string; city: string; country: string };

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const defaultCheckout: Checkout = { customerName: "", email: "", address: "", city: "", country: "Pakistan" };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState(defaultCheckout);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Order | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("luma-cart");
    if (saved) try { setCart(JSON.parse(saved)); } catch { localStorage.removeItem("luma-cart"); }
    fetch("/api/products").then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }).then((data) => setProducts(data.products)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (!loading) localStorage.setItem("luma-cart", JSON.stringify(cart)); }, [cart, loading]);

  const filtered = useMemo(() => products.filter((product) => (category === "All" || product.category === category) && (!query || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase()))), [products, category, query]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 150 ? 0 : 12;

  function add(product: Product, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      return existing ? current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) } : item) : [...current, { product, quantity }];
    });
    setSelected(null); setCartOpen(true);
  }
  function setQuantity(id: number, quantity: number) { setCart((current) => current.map((item) => item.product.id === id ? { ...item, quantity } : item).filter((item) => item.quantity > 0)); }

  async function submitOrder(event: FormEvent) {
    event.preventDefault(); setProcessing(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...checkout, items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess(data.order); setCart([]); setCheckout(defaultCheckout); setCheckoutOpen(false); setCartOpen(false);
      const refreshed = await fetch("/api/products").then((res) => res.json()); setProducts(refreshed.products ?? products);
    } catch (err) { setError(err instanceof Error ? err.message : "Checkout failed."); }
    finally { setProcessing(false); }
  }

  async function openOrders() {
    setOrdersOpen(true); setError("");
    const response = await fetch("/api/orders"); const data = await response.json();
    if (response.ok) setOrders(data.orders); else setError(data.error);
  }

  return <main className="min-h-screen bg-[#f4f1ea] text-[#181816]">
    <div className="bg-[#181816] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[.18em] text-white">Free worldwide delivery on orders over $150</div>
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f4f1ea]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-8">
        <a href="#top" className="text-[21px] font-black tracking-[-.06em]">LUMA<span className="text-[#f25f3a]">●</span></a>
        <div className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[.13em] md:flex"><a href="#shop" className="hover:text-[#f25f3a]">Shop</a><a href="#story" className="hover:text-[#f25f3a]">Our objects</a><button onClick={openOrders} className="uppercase tracking-[.13em] hover:text-[#f25f3a]">Orders</button></div>
        <div className="flex items-center gap-2"><button onClick={openOrders} aria-label="Account and orders" className="grid h-10 w-10 place-items-center rounded-full hover:bg-black/5"><UserRound size={19}/></button><button onClick={()=>setCartOpen(true)} className="flex h-10 items-center gap-2 rounded-full bg-[#181816] px-4 text-sm font-semibold text-white"><ShoppingBag size={17}/><span>{itemCount}</span></button></div>
      </nav>
    </header>

    <section id="top" className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-16 pt-7 md:px-8 lg:grid-cols-[1.04fr_.96fr] lg:pb-24 lg:pt-10">
      <div className="flex min-h-[520px] flex-col justify-between rounded-[34px] bg-[#f25f3a] p-7 text-[#171714] md:min-h-[620px] md:p-12">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em]"><Sparkles size={16}/>New collection · 2026</div>
        <div><h1 className="max-w-3xl text-[clamp(4rem,8vw,8.4rem)] font-black leading-[.8] tracking-[-.075em]">Objects for<br/>clearer days.</h1><p className="mt-8 max-w-lg text-base leading-7 md:text-lg">Quiet tools for focused work, better listening, and a less cluttered everyday.</p><a href="#shop" className="mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-[#181816] px-6 text-sm font-bold text-white transition hover:gap-5">Explore the collection <ArrowRight size={17}/></a></div>
      </div>
      <div className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-[#cbd9cc] md:min-h-[620px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,#fff9,transparent_26%)]"/>
        <div className="absolute left-[8%] top-[8%] text-[11px] font-bold uppercase tracking-[.16em]">Form 01 / Halo</div>
        <div className="absolute left-1/2 top-[17%] h-[20%] w-[35%] -translate-x-1/2 rounded-t-[999px] rounded-b-[28px] bg-[#f25f3a] shadow-[0_25px_80px_#f25f3a99]"/><div className="absolute left-1/2 top-[36%] h-[39%] w-[4%] -translate-x-1/2 rounded-full bg-[#22221f]"/><div className="absolute bottom-[13%] left-1/2 h-[8%] w-[36%] -translate-x-1/2 rounded-[50%] bg-[#22221f] shadow-2xl"/>
        <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between"><div><p className="text-sm font-bold">Halo Desk Lamp</p><p className="mt-1 text-xs text-black/55">Warm light, precisely placed.</p></div><span className="rounded-full bg-white/70 px-4 py-2 text-sm font-bold backdrop-blur">$89</span></div>
      </div>
    </section>

    <section id="shop" className="mx-auto max-w-[1440px] px-5 pb-24 md:px-8">
      <div className="flex flex-col gap-6 border-y border-black/15 py-7 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f25f3a]">The collection</p><h2 className="mt-2 text-4xl font-black tracking-[-.045em] md:text-5xl">Useful. Beautiful. Kept.</h2></div><div className="flex flex-col gap-3 sm:flex-row"><label className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search objects" className="h-11 w-full rounded-full border border-black/15 bg-white/55 pl-10 pr-4 text-sm outline-none focus:border-black sm:w-56"/></label><div className="flex gap-2 overflow-x-auto no-scrollbar">{["All","Desk","Audio","Everyday"].map((item)=><button key={item} onClick={()=>setCategory(item)} className={`h-11 whitespace-nowrap rounded-full px-5 text-xs font-bold uppercase tracking-wider transition ${category===item?"bg-[#181816] text-white":"border border-black/15 hover:bg-white/60"}`}>{item}</button>)}</div></div></div>

      {error && <div className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
      <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{loading ? Array.from({length:6}).map((_,i)=><div key={i}><div className="aspect-[4/5] animate-pulse rounded-[26px] bg-black/10"/><div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-black/10"/></div>) : filtered.map((product)=><article key={product.id} className="group"><button onClick={()=>setSelected(product)} className="block w-full text-left"><div className="relative overflow-hidden"><ProductArt {...product}/><div className="absolute bottom-4 right-4 translate-y-3 rounded-full bg-white px-4 py-2 text-xs font-bold opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">Quick view</div>{product.compareAtPrice && <span className="absolute left-4 top-4 rounded-full bg-[#181816] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">Save {money.format(product.compareAtPrice-product.price)}</span>}</div><div className="mt-4 flex items-start justify-between gap-3"><div><h3 className="font-bold tracking-tight">{product.name}</h3><p className="mt-1 text-xs text-black/50">{product.category} · {product.stock} available</p></div><div className="text-right text-sm font-bold">{money.format(product.price)}{product.compareAtPrice && <span className="ml-2 text-xs font-normal text-black/35 line-through">{money.format(product.compareAtPrice)}</span>}</div></div></button><button onClick={()=>add(product)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/20 text-xs font-bold uppercase tracking-wider transition hover:bg-[#181816] hover:text-white"><Plus size={15}/>Add to bag</button></article>)}</div>
      {!loading && filtered.length===0 && <div className="py-24 text-center"><Search className="mx-auto text-black/25" size={38}/><h3 className="mt-5 text-xl font-bold">No objects found</h3><p className="mt-2 text-sm text-black/50">Try another search or category.</p></div>}
    </section>

    <section id="story" className="bg-[#181816] text-white"><div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 md:px-8 lg:grid-cols-2 lg:py-28"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f25f3a]">Why Luma</p><h2 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.055em] md:text-7xl">Less noise.<br/>More intention.</h2></div><div className="grid gap-8 sm:grid-cols-3 lg:pt-20"><Story icon={<Sparkles/>} title="Considered" text="Every object earns its place through clarity, tactility, and usefulness."/><Story icon={<Truck/>} title="Delivered" text="Carbon-aware shipping, with free delivery when your bag reaches $150."/><Story icon={<Package/>} title="Made to stay" text="Durable materials, repair-minded construction, and honest warranties."/></div></div></section>

    <footer className="bg-[#ebe6dc] px-5 py-12 md:px-8"><div className="mx-auto flex max-w-[1440px] flex-col gap-6 border-t border-black/15 pt-8 md:flex-row md:items-center md:justify-between"><div className="text-2xl font-black tracking-[-.06em]">LUMA<span className="text-[#f25f3a]">●</span></div><p className="text-xs text-black/45">A full-stack commerce experience · Built with care in 2026</p><div className="flex gap-6 text-xs font-bold uppercase tracking-wider"><a href="#shop">Shop</a><button onClick={openOrders}>Orders</button></div></div></footer>

    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] bg-[#f4f1ea] p-4 shadow-2xl md:grid-cols-2"><ProductArt {...selected}/><div className="flex flex-col p-5 md:p-9"><button onClick={()=>setSelected(null)} className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-black/15"><X size={18}/></button><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[#f25f3a]">{selected.category}</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">{selected.name}</h2><p className="mt-5 text-base leading-7 text-black/60">{selected.description}</p><div className="mt-8 text-2xl font-black">{money.format(selected.price)}</div><div className="mt-auto pt-10"><div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-700"><Check size={15}/>In stock and ready to ship</div><button onClick={()=>add(selected)} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#181816] px-6 py-4 text-sm font-bold text-white">Add to bag <ShoppingBag size={17}/></button></div></div></div></div>}

    {cartOpen && <><div onClick={()=>setCartOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"/><aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#f4f1ea] shadow-2xl"><div className="flex items-center justify-between border-b border-black/10 p-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f25f3a]">Your selection</p><h2 className="mt-1 text-2xl font-black tracking-tight">Shopping bag · {itemCount}</h2></div><button onClick={()=>setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-black/15"><X size={18}/></button></div><div className="flex-1 space-y-4 overflow-y-auto p-6">{cart.length===0?<div className="grid h-full place-items-center text-center"><div><ShoppingBag className="mx-auto text-black/20" size={48}/><h3 className="mt-5 text-xl font-bold">Your bag is beautifully empty</h3><p className="mt-2 text-sm text-black/50">Discover an object worth keeping.</p><button onClick={()=>setCartOpen(false)} className="mt-5 text-sm font-bold underline">Continue shopping</button></div></div>:cart.map((item)=><div key={item.product.id} className="flex gap-4 rounded-2xl bg-white/65 p-3"><ProductArt {...item.product} compact/><div className="min-w-0 flex-1 py-1"><div className="flex justify-between gap-2"><h3 className="text-sm font-bold">{item.product.name}</h3><span className="text-sm font-bold">{money.format(item.product.price*item.quantity)}</span></div><p className="mt-1 text-xs text-black/45">{item.product.category}</p><div className="mt-4 inline-flex items-center rounded-full border border-black/15"><button onClick={()=>setQuantity(item.product.id,item.quantity-1)} className="p-2"><Minus size={13}/></button><span className="min-w-7 text-center text-xs font-bold">{item.quantity}</span><button onClick={()=>setQuantity(item.product.id,item.quantity+1)} disabled={item.quantity>=item.product.stock} className="p-2 disabled:opacity-30"><Plus size={13}/></button></div></div></div>)}</div>{cart.length>0&&<div className="border-t border-black/10 p-6"><div className="flex justify-between text-sm"><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div><div className="mt-2 flex justify-between text-sm"><span>Delivery</span><strong>{shipping===0?"Complimentary":money.format(shipping)}</strong></div><div className="mt-5 flex justify-between border-t border-black/10 pt-5 text-lg"><strong>Total</strong><strong>{money.format(subtotal+shipping)}</strong></div><button onClick={()=>{setCheckoutOpen(true);setCartOpen(false)}} className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#f25f3a] py-4 text-sm font-black">Continue to checkout <ArrowRight size={17}/></button><p className="mt-3 text-center text-[10px] uppercase tracking-wider text-black/40">Secure demo checkout · No payment collected</p></div>}</aside></>}

    {checkoutOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"><div className="my-6 w-full max-w-2xl rounded-[30px] bg-[#f4f1ea] p-6 shadow-2xl md:p-9"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f25f3a]">Final step</p><h2 className="mt-2 text-3xl font-black tracking-tight">Delivery details</h2></div><button onClick={()=>setCheckoutOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-black/15"><X size={18}/></button></div><form onSubmit={submitOrder} className="mt-8 grid gap-4 sm:grid-cols-2"><Field label="Full name"><input required className="shop-field" value={checkout.customerName} onChange={(e)=>setCheckout({...checkout,customerName:e.target.value})}/></Field><Field label="Email"><input required type="email" className="shop-field" value={checkout.email} onChange={(e)=>setCheckout({...checkout,email:e.target.value})}/></Field><div className="sm:col-span-2"><Field label="Street address"><input required className="shop-field" value={checkout.address} onChange={(e)=>setCheckout({...checkout,address:e.target.value})}/></Field></div><Field label="City"><input required className="shop-field" value={checkout.city} onChange={(e)=>setCheckout({...checkout,city:e.target.value})}/></Field><Field label="Country"><input required className="shop-field" value={checkout.country} onChange={(e)=>setCheckout({...checkout,country:e.target.value})}/></Field>{error&&<div className="sm:col-span-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="sm:col-span-2 mt-3 flex items-center justify-between border-t border-black/10 pt-6"><div><p className="text-xs text-black/45">Order total</p><p className="text-2xl font-black">{money.format(subtotal+shipping)}</p></div><button disabled={processing} className="rounded-full bg-[#181816] px-7 py-4 text-sm font-bold text-white disabled:opacity-50">{processing?"Placing order...":"Place demo order"}</button></div></form></div></div>}

    {success && <div className="fixed inset-0 z-50 grid place-items-center bg-[#f4f1ea] p-5"><div className="max-w-lg text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#f25f3a]"><Check size={36}/></div><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[#f25f3a]">Order confirmed</p><h2 className="mt-3 text-5xl font-black tracking-[-.06em]">A fine choice.</h2><p className="mt-5 leading-7 text-black/55">Your order <strong className="text-black">{success.orderNumber}</strong> has been saved. This is a demonstration checkout—no payment was processed.</p><button onClick={()=>setSuccess(null)} className="mt-8 rounded-full bg-[#181816] px-7 py-4 text-sm font-bold text-white">Return to the collection</button></div></div>}

    {ordersOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(e)=>{if(e.currentTarget===e.target)setOrdersOpen(false)}}><div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-[#f4f1ea] p-6 md:p-9"><div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#f25f3a]">Your account</p><h2 className="mt-2 text-3xl font-black">Order history</h2></div><button onClick={()=>setOrdersOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-black/15"><X size={18}/></button></div><div className="mt-8 space-y-3">{orders.length===0?<div className="rounded-2xl border border-dashed border-black/20 p-10 text-center"><Package className="mx-auto text-black/25" size={36}/><h3 className="mt-4 font-bold">No orders yet</h3><p className="mt-2 text-sm text-black/50">When you place an order, it will appear here.</p></div>:orders.map((order)=><div key={order.id} className="flex items-center justify-between rounded-2xl bg-white/65 p-5"><div><p className="font-mono text-xs font-bold">{order.orderNumber}</p><p className="mt-1 text-xs text-black/45">{new Date(order.createdAt.replace(" ","T")+"Z").toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold">{money.format(order.total)}</p><p className="mt-1 text-xs text-emerald-700">{order.status}</p></div></div>)}</div></div></div>}
  </main>;
}

function Story({icon,title,text}:{icon:ReactNode;title:string;text:string}) { return <div><div className="text-[#f25f3a]">{icon}</div><h3 className="mt-4 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/45">{text}</p></div>; }
function Field({label,children}:{label:string;children:ReactNode}) { return <label className="block"><span className="mb-2 block text-xs font-bold">{label}</span>{children}</label>; }
