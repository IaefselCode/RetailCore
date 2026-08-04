import { createHash } from "crypto"
import fs from "fs"
import path from "path"
import pg from "pg"

const BASE = "http://localhost:3000"
const ADMIN_PASS = "Rc!iMIw7qQI$PzsvDQ"
const EMP_PASS = "Rc!I_EFKcZr$V61eyw"

const env = fs.readFileSync(
  path.join("D:\\PROGRAMMING\\WEBSITES\\Multi-Store-Sales-Management-System", "point-of-sales", ".env"),
  "utf8"
)
const DATABASE_URL = env
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL"))
  .split("=")
  .slice(1)
  .join("=")
  .trim()
  .replace(/^"|"$/g, "")

const pool = new pg.Pool({ connectionString: DATABASE_URL })

await pool.query(`DELETE FROM "AuthLog" WHERE email = 'ratelimit-probe@retailcore.dev'`)
await pool.query(`DELETE FROM "AuthLog" WHERE email = 'employee@retailcore.dev'`)
await pool.query(`DELETE FROM "PasswordResetToken" WHERE email IN ('employee@retailcore.dev', 'admin@retailcore.dev')`)

function parseCookies(setCookieHeaders) {
  const map = new Map()
  for (const h of setCookieHeaders ?? []) {
    const [pair] = h.split(";")
    const idx = pair.indexOf("=")
    if (idx > -1) map.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim())
  }
  return map
}

function cookieHeader(cookies) {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ")
}

async function getCsrf(cookies) {
  const res = await fetch(`${BASE}/api/auth/csrf`, { redirect: "manual" })
  for (const [k, v] of parseCookies(res.headers.getSetCookie())) cookies.set(k, v)
  return (await res.json()).csrfToken
}

async function login(email, password) {
  const cookies = new Map()
  const csrf = await getCsrf(cookies)
  const body = new URLSearchParams({ csrfToken: csrf, email, password, redirect: "false" })
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookieHeader(cookies) },
    body,
    redirect: "manual",
  })
  for (const [k, v] of parseCookies(res.headers.getSetCookie())) cookies.set(k, v)

  const sr = await fetch(`${BASE}/api/auth/session`, { headers: { cookie: cookieHeader(cookies) } })
  return { session: await sr.json(), cookies, loc: res.headers.get("location") }
}

async function getFormAction(pageUrl) {
  const res = await fetch(`${BASE}${pageUrl}`, { redirect: "manual" })
  const html = await res.text()

  const decode = (s) => s.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&")

  const ref = html.match(/name="\$ACTION_REF_1"/) ? "$ACTION_REF_1" : null
  const meta = html.match(/\$ACTION_1:0" value="([^"]+)"/)
  const state = html.match(/\$ACTION_1:1" value="([^"]+)"/)
  const key = html.match(/\$ACTION_KEY" value="([^"]+)"/)
  if (!ref || !meta || !state || !key) throw new Error(`no form action found on ${pageUrl}`)

  const fields = [
    ["$ACTION_REF_1", ""],
    ["$ACTION_1:0", decode(meta[1])],
    ["$ACTION_1:1", decode(state[1])],
    ["$ACTION_KEY", decode(key[1])],
  ]

  const formMarkup = html.slice(html.indexOf("<form"), html.indexOf("</form>") + 7)
  for (const m of formMarkup.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g)) {
    const name = m[1]
    if (name.startsWith("$ACTION_")) continue
    fields.push([name, decode(m[2] ?? "")])
  }

  return {
    actionId: JSON.parse(decode(meta[1])).id,
    fields,
  }
}

async function invokeAction(pageUrl, form) {
  const fd = new FormData()
  for (const [k, v] of form.fields) fd.append(k, v)
  for (const [k, v] of form.values) fd.append(k, v)

  const res = await fetch(`${BASE}${pageUrl}`, {
    method: "POST",
    body: fd,
  })
  const text = await res.text()
  return { status: res.status, text }
}

async function db(sql, params = []) {
  const r = await pool.query(sql, params)
  return r.rows
}

let failures = 0
function check(name, cond, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  [${extra}]` : ""}`)
  if (!cond) failures++
}

// 1. Canonical accounts still work
const admin = await login("admin@retailcore.dev", ADMIN_PASS)
check("admin login", admin.session?.user?.role === "ADMIN", JSON.stringify(admin.session?.user))

const emp = await login("employee@retailcore.dev", EMP_PASS)
check("employee login", emp.session?.user?.role === "EMPLOYEE")

const bad = await login("admin@retailcore.dev", "wrong-password")
check("wrong password rejected", bad.session === null)

// 2. Rate limiting: 10 allowed per email, 11th blocked, only 10 failure logs
{
  const email = "ratelimit-probe@retailcore.dev"
  for (let i = 0; i < 11; i++) {
    await login(email, "whatever123")
  }
  await new Promise((r) => setTimeout(r, 1500))
  const rows = await db(
    `SELECT COUNT(*)::int AS n FROM "AuthLog" WHERE email = $1 AND event = 'login_failure'`,
    [email]
  )
  check("rate limit: 10 failures logged, 11th blocked", rows[0].n === 10, `logged=${rows[0].n}`)
}

// 3. Forgot password: generic response, no enumeration, token + log rows created
{
  const form = await getFormAction("/forgot-password")

  const r1 = await invokeAction("/forgot-password", {
    ...form,
    values: [["email", "employee@retailcore.dev"]],
  })
  check("forgot: generic success message", r1.text.includes("reset link has been sent"), `status=${r1.status}`)

  const tokens = await db(
    `SELECT COUNT(*)::int AS n FROM "PasswordResetToken" WHERE email = 'employee@retailcore.dev' AND "usedAt" IS NULL`
  )
  check("forgot: token row created", tokens[0].n === 1, `tokens=${tokens[0].n}`)

  const r2 = await invokeAction("/forgot-password", {
    ...form,
    values: [["email", "nonexistent@retailcore.dev"]],
  })
  check("forgot: unknown email same generic message (no enumeration)", r2.text.includes("reset link has been sent"))

  const logs = await db(
    `SELECT COUNT(*)::int AS n FROM "AuthLog" WHERE email = 'employee@retailcore.dev' AND event = 'password_reset_request'`
  )
  check("forgot: request logged", logs[0].n === 1, `logs=${logs[0].n}`)
}

// 4. Full reset flow with a known token inserted directly (simulates emailed link)
{
  const token = "e2e-reset-token-123"
  const tokenHash = createHash("sha256").update(token).digest("hex")
  await db(
    `INSERT INTO "PasswordResetToken" (id, email, "tokenHash", "expiresAt", "createdAt")
     VALUES (gen_random_uuid(), 'employee@retailcore.dev', $1, now() + interval '1 hour', now())`,
    [tokenHash]
  )

  const form = await getFormAction(`/reset-password?token=${token}`)
  const r = await invokeAction(`/reset-password?token=${token}`, {
    ...form,
    values: [["password", "New#Pass2026!"]],
  })
  check("reset: password updated message", r.text.includes("Password updated"), `status=${r.status}`)

  const loginNew = await login("employee@retailcore.dev", "New#Pass2026!")
  check("reset: new password works", loginNew.session?.user?.email === "employee@retailcore.dev")

  const loginOld = await login("employee@retailcore.dev", EMP_PASS)
  check("reset: old password rejected", loginOld.session === null)

  const form2 = await getFormAction(`/reset-password?token=${token}`)
  const r2 = await invokeAction(`/reset-password?token=${token}`, {
    ...form2,
    values: [["password", "Another#Pass1"]],
  })
  check("reset: token cannot be reused", r2.text.includes("invalid or expired"))

  const logs = await db(
    `SELECT COUNT(*)::int AS n FROM "AuthLog" WHERE email = 'employee@retailcore.dev' AND event = 'password_reset_complete'`
  )
  check("reset: completion logged", logs[0].n === 1, `logs=${logs[0].n}`)
}

// 5. Weak password rejected by policy
{
  const token = "e2e-weak-token-456"
  const tokenHash = createHash("sha256").update(token).digest("hex")
  await db(
    `INSERT INTO "PasswordResetToken" (id, email, "tokenHash", "expiresAt", "createdAt")
     VALUES (gen_random_uuid(), 'admin@retailcore.dev', $1, now() + interval '1 hour', now())`,
    [tokenHash]
  )
  const form = await getFormAction(`/reset-password?token=${token}`)
  const r = await invokeAction(`/reset-password?token=${token}`, {
    ...form,
    values: [["password", "weakpass"]],
  })
  check("reset: weak password rejected", r.text.includes("uppercase, lowercase"), `status=${r.status}`)
}

// 6. Audit trail exists for login events
{
  const rows = await db(
    `SELECT event, COUNT(*)::int AS n FROM "AuthLog" GROUP BY event ORDER BY event`
  )
  const summary = rows.map((r) => `${r.event}=${r.n}`).join(", ")
  check("audit: events recorded", rows.length >= 4, summary)
}

await pool.end()
console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
