import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.log(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — storage stays unconfigured.",
  )
  console.log("Set both keys in .env, then re-run: node --env-file=.env scripts/setup-storage.mjs")
  process.exit(0)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { error: createErr } = await supabase.storage.createBucket("images", {
  public: true,
  fileSizeLimit: 10 * 1024 * 1024,
})

if (createErr) {
  if (String(createErr.message).toLowerCase().includes("already exists")) {
    const { error: updErr } = await supabase.storage.updateBucket("images", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    })
    if (updErr) throw updErr
  } else {
    throw createErr
  }
}

const { data: bucket, error: getErr } = await supabase.storage.getBucket("images")
if (getErr) throw getErr

console.log("Storage ready:", JSON.stringify(bucket))
