// Discover (커뮤니티 공유) — Postgres + Supabase Storage 기반.
// 이전 JSON 파일 기반 저장소를 대체해 RLS·동시성·확장성 문제를 해결한다.
import crypto from "crypto";
import { getAdminClient } from "./supabase/admin";

export const SHARED_BUCKET = "shared-images";
export const MAX_PER_USER_PER_DAY = 10;

export interface DiscoverImage {
  id: string;
  user_id: string | null;
  storage_path: string;
  thumb_path: string | null;
  title: string;
  tags: string[];
  prompt: string;
  user_name: string | null;
  user_avatar: string | null;
  ip_hash: string | null;
  file_size: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

// ── Salt: 일별 + .env에서 base 시드 (서버 재시작 시 hash 안정성) ──
function getDailySalt(): string {
  const base = process.env.IP_HASH_SECRET || "myangel-default-salt";
  const today = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash("sha256")
    .update(`${base}:${today}`)
    .digest("hex");
}

export function hashIP(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(`${getDailySalt()}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

interface ListOptions {
  userFilter?: string | null;
  tag?: string | null;
  query?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  sort?: "latest" | "oldest" | "title";
  limit?: number;
  offset?: number;
}

export async function listImages(
  opts: ListOptions = {}
): Promise<DiscoverImage[]> {
  const supabase = getAdminClient();
  const limit = Math.min(200, Math.max(1, opts.limit ?? 100));
  const offset = Math.max(0, opts.offset ?? 0);
  let q = supabase
    .from("discover_images")
    .select("*");
  if (opts.userFilter) {
    q = q.eq("user_id", opts.userFilter);
  }
  if (opts.tag) {
    q = q.contains("tags", [opts.tag]);
  }
  if (opts.query) {
    const escaped = opts.query.replace(/[%_]/g, "\\$&");
    q = q.or(`title.ilike.%${escaped}%,prompt.ilike.%${escaped}%`);
  }
  if (opts.dateFrom) {
    q = q.gte("created_at", `${opts.dateFrom}T00:00:00.000Z`);
  }
  if (opts.dateTo) {
    q = q.lte("created_at", `${opts.dateTo}T23:59:59.999Z`);
  }
  if (opts.sort === "oldest") {
    q = q.order("created_at", { ascending: true });
  } else if (opts.sort === "title") {
    q = q.order("title", { ascending: true }).order("created_at", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error) throw new Error(`discover list failed: ${error.message}`);
  return (data ?? []) as DiscoverImage[];
}

export async function getImage(id: string): Promise<DiscoverImage | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("discover_images")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`discover get failed: ${error.message}`);
  return (data as DiscoverImage | null) ?? null;
}

export async function getRateLimitCount(
  ipHash: string,
  userId: string
): Promise<number> {
  const supabase = getAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("discover_images")
    .select("id", { count: "exact", head: true })
    .or(`ip_hash.eq.${ipHash},user_id.eq.${userId}`)
    .gte("created_at", since);
  if (error) return 0;
  return count ?? 0;
}

export interface CreateImageInput {
  user_id: string;
  storage_path: string;
  thumb_path?: string | null;
  title: string;
  tags: string[];
  prompt: string;
  user_name: string | null;
  user_avatar: string | null;
  ip_hash: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
}

export async function createImage(
  input: CreateImageInput
): Promise<DiscoverImage> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("discover_images")
    .insert({
      user_id: input.user_id,
      storage_path: input.storage_path,
      thumb_path: input.thumb_path ?? null,
      title: input.title,
      tags: input.tags,
      prompt: input.prompt,
      user_name: input.user_name,
      user_avatar: input.user_avatar,
      ip_hash: input.ip_hash,
      file_size: input.file_size,
      width: input.width ?? null,
      height: input.height ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`discover insert failed: ${error.message}`);
  return data as DiscoverImage;
}

export async function deleteImageById(
  id: string,
  userId: string
): Promise<{ ok: true; storage_path: string; thumb_path: string | null } | { ok: false; error: string }> {
  const supabase = getAdminClient();
  const { data: existing, error: getErr } = await supabase
    .from("discover_images")
    .select("user_id, storage_path, thumb_path")
    .eq("id", id)
    .maybeSingle();
  if (getErr) return { ok: false, error: getErr.message };
  if (!existing) return { ok: false, error: "이미지를 찾을 수 없어요" };
  if (existing.user_id !== userId) return { ok: false, error: "권한이 없어요" };
  const { error: delErr } = await supabase
    .from("discover_images")
    .delete()
    .eq("id", id);
  if (delErr) return { ok: false, error: delErr.message };
  return {
    ok: true,
    storage_path: existing.storage_path as string,
    thumb_path: (existing.thumb_path as string | null) ?? null,
  };
}

export async function updateImageTitle(
  id: string,
  userId: string,
  title: string
): Promise<{ ok: true; title: string } | { ok: false; error: string }> {
  const supabase = getAdminClient();
  const { data: existing } = await supabase
    .from("discover_images")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "이미지를 찾을 수 없어요" };
  if (existing.user_id !== userId) return { ok: false, error: "권한이 없어요" };
  const { data, error } = await supabase
    .from("discover_images")
    .update({ title })
    .eq("id", id)
    .select("title")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, title: data.title as string };
}

export function publicUrl(storagePath: string): string {
  const supabase = getAdminClient();
  const { data } = supabase.storage.from(SHARED_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadImage(
  storagePath: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase.storage
    .from(SHARED_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
}

export async function deleteFromStorage(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = getAdminClient();
  await supabase.storage.from(SHARED_BUCKET).remove(paths);
}
