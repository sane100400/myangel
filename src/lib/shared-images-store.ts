// 공유 이미지 저장소 — JSON 파일 기반 서버사이드 모듈
// content/shared-images.json에 메타데이터, content/shared/에 이미지 파일 저장

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// ── 설정값 ──
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_IMAGES = 1000;
const MAX_PER_IP_PER_DAY = 10;

const STORE_PATH = path.join(process.cwd(), "content", "shared-images.json");
const SHARED_DIR = path.join(process.cwd(), "content", "shared");

// ── 타입 ──
export interface SharedImageEntry {
  id: string;
  title: string;
  tags: string[];
  prompt: string;
  is_premium: false;
  created_at: string;
  ip_hash: string;
  file_size: number;
}

interface Store {
  images: SharedImageEntry[];
}

// ── Salt (일별 rotating) ──
let cachedSalt: { date: string; value: string } | null = null;

function getDailySalt(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (cachedSalt && cachedSalt.date === today) return cachedSalt.value;
  const value = crypto
    .createHash("sha256")
    .update(`myangel-salt-${today}-${process.env.NODE_ENV || "production"}`)
    .digest("hex");
  cachedSalt = { date: today, value };
  return value;
}

// ── IP 해싱 ──
export function hashIP(ip: string): string {
  const salt = getDailySalt();
  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

// ── Store 읽기/쓰기 ──
export async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return { images: [] };
  }
}

export async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tmp = `${STORE_PATH}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");
  await fs.rename(tmp, STORE_PATH);
}

// ── Rate limit 체크 ──
export function getRateLimitCount(store: Store, ipHash: string): number {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  return store.images.filter(
    (img) =>
      img.ip_hash === ipHash &&
      new Date(img.created_at).getTime() > oneDayAgo
  ).length;
}

// ── 이미지 추가 (quota 관리 포함) ──
export async function addImage(entry: SharedImageEntry): Promise<void> {
  const store = await readStore();

  // Quota: 최대 이미지 수 초과 시 오래된 것부터 삭제
  while (store.images.length >= MAX_IMAGES) {
    const oldest = store.images.shift();
    if (oldest) {
      const filePath = path.join(SHARED_DIR, `${oldest.id}.webp`);
      fs.unlink(filePath).catch(() => {});
    }
  }

  // Quota: 총 용량 초과 시 오래된 것부터 삭제
  let totalSize = store.images.reduce((sum, img) => sum + img.file_size, 0);
  while (totalSize + entry.file_size > MAX_TOTAL_SIZE && store.images.length > 0) {
    const oldest = store.images.shift();
    if (oldest) {
      totalSize -= oldest.file_size;
      const filePath = path.join(SHARED_DIR, `${oldest.id}.webp`);
      fs.unlink(filePath).catch(() => {});
    }
  }

  store.images.push(entry);
  await writeStore(store);
}

// ── 개별 이미지 조회 ──
export async function getImage(id: string): Promise<SharedImageEntry | null> {
  const store = await readStore();
  return store.images.find((img) => img.id === id) || null;
}

// ── 상수 export ──
export { MAX_PER_IP_PER_DAY, SHARED_DIR };
