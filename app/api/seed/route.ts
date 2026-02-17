import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// Fixed owner key for kathmandu-cuts (dev/demo). Use in URL: /owner?key=KathmanduCutsPwnerKey234
const KATHMANDU_CUTS_OWNER_KEY = "KathmanduCutsPwnerKey234";

// --- BASIC SEED (mode=basic or default) ---
const SEED_SALONS = [
  {
    name: "Kathmandu Cuts",
    slug: "kathmandu-cuts",
    city: "Kathmandu",
    address: "New Road, Kathmandu",
    phone: "9800000000",
  },
  {
    name: "Lalitpur Glow Studio",
    slug: "lalitpur-glow",
    city: "Lalitpur",
    address: "Patan Dhoka, Lalitpur",
    phone: "9811111111",
  },
];

const SEED_SERVICES_BY_SLUG: Record<
  string,
  { name: string; price: number; duration_min: number; sort_order: number }[]
> = {
  "kathmandu-cuts": [
    { name: "Haircut", price: 500, duration_min: 30, sort_order: 0 },
    { name: "Beard Trim", price: 300, duration_min: 20, sort_order: 1 },
    { name: "Hair Wash", price: 200, duration_min: 15, sort_order: 2 },
  ],
  "lalitpur-glow": [
    { name: "Facial", price: 1200, duration_min: 45, sort_order: 0 },
    { name: "Manicure", price: 800, duration_min: 40, sort_order: 1 },
    { name: "Pedicure", price: 900, duration_min: 45, sort_order: 2 },
  ],
};

// --- FULL SEED DATA ---
const FULL_SALONS = [
  { name: "Kathmandu Cuts", slug: "kathmandu-cuts", city: "Kathmandu", address: "New Road, Kathmandu", phone: "9801234567" },
  { name: "Lalitpur Glow Studio", slug: "lalitpur-glow", city: "Lalitpur", address: "Patan Dhoka, Lalitpur", phone: "9812345678" },
  { name: "Bhaktapur Beauty Hub", slug: "bhaktapur-beauty", city: "Bhaktapur", address: "Taumadhi Square, Bhaktapur", phone: "9823456789" },
  { name: "Pokhara Spa & Salon", slug: "pokhara-spa", city: "Pokhara", address: "Lakeside, Pokhara", phone: "9834567890" },
  { name: "Thamel Style Studio", slug: "thamel-style", city: "Kathmandu", address: "Thamel, Kathmandu", phone: "9845678901" },
  { name: "Patan Hair Studio", slug: "patan-hair", city: "Lalitpur", address: "Pulchowk, Lalitpur", phone: "9856789012" },
  { name: "Boudha Relax Spa", slug: "boudha-relax", city: "Kathmandu", address: "Boudhanath, Kathmandu", phone: "9867890123" },
  { name: "Chitwan Glamour", slug: "chitwan-glamour", city: "Chitwan", address: "Narayangarh, Chitwan", phone: "9878901234" },
  { name: "Dharan Elegance", slug: "dharan-elegance", city: "Dharan", address: "Bhanu Chowk, Dharan", phone: "9889012345" },
  { name: "Biratnagar Cuts", slug: "biratnagar-cuts", city: "Biratnagar", address: "RNAC Chowk, Biratnagar", phone: "9890123456" },
];

const COMMON_SERVICES = [
  { name: "Haircut", price: 400, duration_min: 25 },
  { name: "Beard Trim", price: 250, duration_min: 15 },
  { name: "Hair Wash", price: 150, duration_min: 15 },
  { name: "Hair Color", price: 1500, duration_min: 60 },
  { name: "Facial", price: 1200, duration_min: 45 },
  { name: "Manicure", price: 600, duration_min: 35 },
  { name: "Pedicure", price: 800, duration_min: 45 },
  { name: "Massage", price: 1500, duration_min: 60 },
  { name: "Waxing", price: 500, duration_min: 30 },
  { name: "Threading", price: 200, duration_min: 20 },
  { name: "Hair Spa", price: 1800, duration_min: 75 },
  { name: "Bridal Makeup", price: 5000, duration_min: 120 },
  { name: "Kids Haircut", price: 300, duration_min: 20 },
  { name: "Head Massage", price: 600, duration_min: 30 },
  { name: "Body Scrub", price: 2000, duration_min: 90 },
];

const REVIEW_TEMPLATES: { text: string; sentiment: string; keywords: string[] }[] = [
  { text: "Great haircut! Very satisfied with the service.", sentiment: "positive", keywords: ["haircut", "service", "satisfied"] },
  { text: "Friendly staff, clean place. Will come again!", sentiment: "positive", keywords: ["staff", "clean", "friendly"] },
  { text: "Fast and professional. Highly recommend.", sentiment: "positive", keywords: ["fast", "professional", "recommend"] },
  { text: "Best salon in town. Love the ambiance.", sentiment: "positive", keywords: ["best", "ambiance", "salon"] },
  { text: "Good value for money. Nice experience.", sentiment: "positive", keywords: ["value", "money", "experience"] },
  { text: "Staff was okay. Service was average.", sentiment: "neutral", keywords: ["staff", "service", "average"] },
  { text: "It was fine. Nothing special.", sentiment: "neutral", keywords: ["fine", "average"] },
  { text: "Decent place. Could be better.", sentiment: "neutral", keywords: ["decent", "better"] },
  { text: "Waited too long. Service was okay.", sentiment: "neutral", keywords: ["waited", "service"] },
  { text: "Not happy with the result. Expected better.", sentiment: "negative", keywords: ["result", "expected", "better"] },
  { text: "Too expensive for what you get.", sentiment: "negative", keywords: ["expensive", "price"] },
  { text: "Staff was rude. Won't return.", sentiment: "negative", keywords: ["rude", "staff"] },
  { text: "Disappointing experience. Not recommended.", sentiment: "negative", keywords: ["disappointing", "recommended"] },
  { text: "Very friendly staff, clean place, fast service!", sentiment: "positive", keywords: ["friendly", "clean", "fast", "staff"] },
  { text: "Amazing facial! Skin feels so soft now.", sentiment: "positive", keywords: ["facial", "skin", "soft"] },
];

const CUSTOMER_NAMES = [
  "Ram Sharma", "Sita Devi", "Krishna Thapa", "Anita Gurung", "Bibek Rai",
  "Puja Maharjan", "Santosh Tamang", "Mina Limbu", "Raj Kumar", "Sunita Shrestha",
  "Nabin Adhikari", "Asha Karki", "Bikash Poudel", "Sangita Basnet", "Dipak Joshi",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seed % arr.length)];
}

function generateOwnerKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let key = "";
  for (let i = 0; i < 24; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function randomInt(min: number, max: number, seed: number): number {
  return min + Math.floor((seed * (max - min + 1)) % (max - min + 1));
}

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  const headerSecret = (await headers()).get("x-seed-secret");

  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "basic";

  if (mode === "basic") {
    return runBasicSeed();
  }

  if (mode === "full") {
    return runFullSeed();
  }

  return NextResponse.json({ error: "Invalid mode. Use mode=basic or mode=full" }, { status: 400 });
}

async function runBasicSeed() {
  const summary: { salons: number; services: number; errors?: string[] } = { salons: 0, services: 0 };
  const errors: string[] = [];

  const salonsToUpsert = SEED_SALONS.map((s) => ({
    ...s,
    owner_key: s.slug === "kathmandu-cuts" ? KATHMANDU_CUTS_OWNER_KEY : generateOwnerKey(),
  }));
  const { data: salonsData, error: salonsError } = await supabaseAdmin
    .from("salons")
    .upsert(salonsToUpsert, { onConflict: "slug" })
    .select("id, slug, owner_key");

  if (salonsError) {
    return NextResponse.json({ ...summary, errors: [salonsError.message] }, { status: 500 });
  }

  summary.salons = salonsData?.length ?? 0;
  if (!salonsData?.length) return NextResponse.json(summary);

  const salonsWithKeys = (salonsData ?? []).map((s) => ({
    id: s.id,
    slug: s.slug,
    owner_key: (s as { owner_key?: string }).owner_key ?? null,
  }));

  const servicesToInsert: { salon_id: string; name: string; price: number; duration_min: number; sort_order: number }[] = [];
  for (const salon of salonsData) {
    const services = SEED_SERVICES_BY_SLUG[salon.slug];
    if (services) {
      for (const svc of services) {
        servicesToInsert.push({
          salon_id: salon.id,
          name: svc.name,
          price: svc.price,
          duration_min: svc.duration_min,
          sort_order: svc.sort_order,
        });
      }
    }
  }

  for (const salon of salonsData) {
    await supabaseAdmin.from("services").delete().eq("salon_id", salon.id);
  }

  const { data: servicesData, error: servicesError } = await supabaseAdmin
    .from("services")
    .insert(servicesToInsert)
    .select("id");

  if (servicesError) {
    return NextResponse.json({ ...summary, errors: [servicesError.message] }, { status: 500 });
  }

  summary.services = servicesData?.length ?? 0;
  return NextResponse.json({ ...summary, salons: salonsWithKeys });
}

async function runFullSeed() {
  const counts = { salons: 0, services: 0, bookings: 0, reviews: 0, feedback_ai: 0, sales: 0, sales_items: 0 };
  const errors: string[] = [];

  // 1. Upsert salons (with owner_key)
  const fullSalonsWithKeys = FULL_SALONS.map((s) => ({
    ...s,
    owner_key: s.slug === "kathmandu-cuts" ? KATHMANDU_CUTS_OWNER_KEY : generateOwnerKey(),
  }));
  const { data: salonsData, error: salonsError } = await supabaseAdmin
    .from("salons")
    .upsert(fullSalonsWithKeys, { onConflict: "slug" })
    .select("id, slug, owner_key");

  if (salonsError) {
    return NextResponse.json({ ...counts, errors: [salonsError.message] }, { status: 500 });
  }
  counts.salons = salonsData?.length ?? 0;
  if (!salonsData?.length) return NextResponse.json(counts);

  // 2. Delete existing services and insert new ones (8-15 per salon)
  for (const salon of salonsData) {
    await supabaseAdmin.from("services").delete().eq("salon_id", salon.id);
  }

  const servicesBySalon: Record<string, { id: string; name: string; price: number }[]> = {};
  for (const salon of salonsData) {
    const numServices = 8 + Math.floor(Math.random() * 8);
    const shuffled = [...COMMON_SERVICES].sort(() => Math.random() - 0.5).slice(0, numServices);
    const toInsert = shuffled.map((s, i) => ({
      salon_id: salon.id,
      name: s.name,
      price: s.price + Math.floor(Math.random() * 200) - 100,
      duration_min: s.duration_min,
      sort_order: i,
    }));
    const { data: svcData, error: svcErr } = await supabaseAdmin
      .from("services")
      .insert(toInsert)
      .select("id, name, price, duration_min");
    if (svcErr) errors.push(svcErr.message);
    else {
      counts.services += svcData?.length ?? 0;
      servicesBySalon[salon.id] = svcData ?? [];
    }
  }

  // 3. Bookings (20-50, future dates) with end_time
  const now = new Date();
  const bookingsToInsert: {
    salon_id: string;
    service_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    notes: string | null;
    start_time: string;
    end_time: string;
    status: string;
  }[] = [];

  for (let i = 0; i < 35; i++) {
    const salon = salonsData[Math.floor(Math.random() * salonsData.length)];
    const services = servicesBySalon[salon.id];
    if (!services?.length) continue;
    const svc = services[Math.floor(Math.random() * services.length)];
    const durationMin = "duration_min" in svc ? (svc as { duration_min?: number }).duration_min : 30;
    const duration = durationMin ?? 30;
    const daysAhead = 1 + Math.floor(Math.random() * 30);
    const hour = 9 + Math.floor(Math.random() * 9);
    const start = new Date(now);
    start.setDate(start.getDate() + daysAhead);
    start.setHours(hour, Math.random() > 0.5 ? 0 : 30, 0, 0);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    bookingsToInsert.push({
      salon_id: salon.id,
      service_id: svc.id,
      customer_name: pick(CUSTOMER_NAMES, i * 7),
      customer_phone: `98${String(10000000 + i).slice(-8)}`,
      customer_email: i % 3 === 0 ? `user${i}@example.com` : null,
      notes: i % 5 === 0 ? "Please call before arrival" : null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: ["pending", "confirmed", "confirmed", "completed", "cancelled", "no_show"][i % 6],
    });
  }

  const { error: bookErr } = await supabaseAdmin.from("bookings").insert(bookingsToInsert);
  if (bookErr) errors.push(bookErr.message);
  else counts.bookings = bookingsToInsert.length;

  // 4. Reviews + feedback_ai (30-100)
  const reviewsToInsert: { salon_id: string; feedback: string; rating?: number }[] = [];
  const templatesUsed: { sentiment: string; keywords: string[] }[] = [];
  for (let i = 0; i < 65; i++) {
    const salon = salonsData[Math.floor(Math.random() * salonsData.length)];
    const t = pick(REVIEW_TEMPLATES, i * 11);
    const rating = 1 + (i % 5); // 1-5
    reviewsToInsert.push({ salon_id: salon.id, feedback: t.text, rating });
    templatesUsed.push({ sentiment: t.sentiment, keywords: t.keywords });
  }

  const { data: reviewsData, error: revErr } = await supabaseAdmin
    .from("reviews")
    .insert(reviewsToInsert)
    .select("id");
  if (revErr) errors.push(revErr.message);
  else counts.reviews = reviewsData?.length ?? 0;

  if (reviewsData?.length) {
    const feedbackAiToInsert = reviewsData.map((r, i) => {
      const t = templatesUsed[i] ?? templatesUsed[0];
      return {
        review_id: r.id,
        sentiment: t.sentiment,
        confidence: 0.7 + Math.random() * 0.3,
        polarity: t.sentiment === "positive" ? 0.5 + Math.random() * 0.5 : t.sentiment === "negative" ? -0.5 - Math.random() * 0.5 : 0,
        subjectivity: 0.3 + Math.random() * 0.5,
        keywords: t.keywords,
      };
    });
    const { error: aiErr } = await supabaseAdmin.from("feedback_ai").insert(feedbackAiToInsert);
    if (aiErr) errors.push(aiErr.message);
    else counts.feedback_ai = feedbackAiToInsert.length;
  }

  // 5. Sales + sales_items (10-30, OCR-like)
  const salesToInsert: { salon_id: string; total: number; raw_text: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const salon = salonsData[Math.floor(Math.random() * salonsData.length)];
    const services = servicesBySalon[salon.id];
    if (!services?.length) continue;
    const numItems = 1 + Math.floor(Math.random() * 4);
    const selected = services.sort(() => Math.random() - 0.5).slice(0, numItems);
    const total = selected.reduce((s, x) => s + x.price, 0);
    const rawText = selected.map((s) => `${s.name} ${s.price}`).join("\n") + `\nTotal: ${total}`;
    salesToInsert.push({ salon_id: salon.id, total, raw_text: rawText });
  }

  const { data: salesData, error: salesErr } = await supabaseAdmin
    .from("sales")
    .insert(salesToInsert.map((s) => ({ salon_id: s.salon_id, total: s.total, raw_text: s.raw_text })))
    .select("id");
  if (salesErr) errors.push(salesErr.message);
  else counts.sales = salesData?.length ?? 0;

  if (salesData?.length) {
    const itemsToInsert: { sale_id: string; name: string; price: number }[] = [];
    for (let i = 0; i < salesData.length; i++) {
      const sale = salesData[i];
      const saleInfo = salesToInsert[i];
      if (!saleInfo) continue;
      const lines = saleInfo.raw_text.split("\n").filter((l) => !l.startsWith("Total"));
      for (const line of lines) {
        const match = line.match(/(.+?)\s+(\d+)$/);
        if (match) {
          itemsToInsert.push({ sale_id: sale.id, name: match[1].trim(), price: parseInt(match[2], 10) });
        }
      }
    }
    if (itemsToInsert.length) {
      const { error: itemsErr } = await supabaseAdmin.from("sales_items").insert(itemsToInsert);
      if (itemsErr) errors.push(itemsErr.message);
      else counts.sales_items = itemsToInsert.length;
    }
  }

  const ownerKeys = (salonsData ?? []).map((s) => ({ slug: s.slug, owner_key: (s as { owner_key?: string }).owner_key }));

  return NextResponse.json({
    ...counts,
    message: "Full seed completed",
    owner_keys: ownerKeys,
    errors: errors.length ? errors : undefined,
  });
}
