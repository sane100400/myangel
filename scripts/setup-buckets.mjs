import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url) {
  console.error("NEXT_PUBLIC_SUPABASE_URL not set");
  process.exit(1);
}
if (!key) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const buckets = [
  {
    id: "shared-images",
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
  },
  {
    id: "user-generations",
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
  },
];

for (const b of buckets) {
  const { data: existing } = await sb.storage.getBucket(b.id);
  if (existing) {
    console.log(`bucket "${b.id}" exists, updating settings...`);
    const { error } = await sb.storage.updateBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
      allowedMimeTypes: b.allowedMimeTypes,
    });
    console.log(`  ${error ? "ERR: " + error.message : "OK"}`);
  } else {
    const { error } = await sb.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
      allowedMimeTypes: b.allowedMimeTypes,
    });
    console.log(`bucket "${b.id}" created: ${error ? "ERR: " + error.message : "OK"}`);
  }
}

const { data: list } = await sb.storage.listBuckets();
console.log("\nfinal buckets:", list?.map((b) => `${b.name} (public=${b.public})`));
