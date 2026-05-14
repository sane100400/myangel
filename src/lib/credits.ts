import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { logger } from "./logger";

export type Quality = "1K" | "2K" | "4K";
export const QUALITIES: Quality[] = ["1K", "2K", "4K"];
export const MAX_COUNT = 4;

type QualityCost = Record<Quality, number>;

const FALLBACK_GENERATE_COST: QualityCost = { "1K": 1, "2K": 3, "4K": 6 };
const FALLBACK_EDIT_COST: QualityCost = { "1K": 2, "2K": 4, "4K": 7 };
const log = logger.child({ module: "credits" });

let pricingCache: { ts: number; data: Record<string, unknown> } | null = null;
const PRICING_TTL_MS = 30_000;

async function loadPricing(): Promise<Record<string, unknown>> {
  if (pricingCache && Date.now() - pricingCache.ts < PRICING_TTL_MS) {
    return pricingCache.data;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("pricing_config").select("key,value");
  if (error || !data) {
    // Don't poison the cache with empty data on transient failure;
    // fall back to hardcoded defaults this call. Next call will retry.
    log.warn("loadPricing failed; using fallbacks", { msg: error?.message });
    return {};
  }
  const map: Record<string, unknown> = {};
  for (const row of data) {
    map[row.key as string] = (row as { value: unknown }).value;
  }
  pricingCache = { ts: Date.now(), data: map };
  return map;
}

function asQualityCost(raw: unknown, fallback: QualityCost): QualityCost {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  return {
    "1K": typeof obj["1K"] === "number" ? (obj["1K"] as number) : fallback["1K"],
    "2K": typeof obj["2K"] === "number" ? (obj["2K"] as number) : fallback["2K"],
    "4K": typeof obj["4K"] === "number" ? (obj["4K"] as number) : fallback["4K"],
  };
}

export async function getGenerateCost(quality: Quality, count: number): Promise<number> {
  const pricing = await loadPricing();
  const table = asQualityCost(pricing.generate_quality_cost, FALLBACK_GENERATE_COST);
  return table[quality] * Math.max(1, Math.min(MAX_COUNT, count));
}

export async function getEditCost(quality: Quality, count: number): Promise<number> {
  const pricing = await loadPricing();
  const table = asQualityCost(pricing.edit_base_cost, FALLBACK_EDIT_COST);
  return table[quality] * Math.max(1, Math.min(MAX_COUNT, count));
}

export async function getBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.balance ?? 0;
}

export async function deductCredits(args: {
  userId: string;
  cost: number;
  reason: string;
  meta?: Record<string, unknown>;
  idempotencyKey?: string | null;
}): Promise<{ ok: true; ledgerId: string } | { ok: false; reason: "insufficient" | "error" }> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: args.userId,
    p_cost: args.cost,
    p_reason: args.reason,
    p_meta: args.meta ?? {},
    p_idempotency_key: args.idempotencyKey ?? null,
  });
  if (error) {
    log.error("deduct_credits error", { msg: error.message, userId: args.userId });
    return { ok: false, reason: "error" };
  }
  if (!data) return { ok: false, reason: "insufficient" };
  return { ok: true, ledgerId: data as string };
}

export async function refundCredits(ledgerId: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.rpc("refund_credits", { p_ledger_id: ledgerId });
  if (error) {
    log.error("refund_credits error", { msg: error.message, ledgerId });
    return false;
  }
  return Boolean(data);
}
