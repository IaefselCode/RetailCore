import fs from "fs"
import path from "path"
import pg from "pg"

const BASE = "http://localhost:3000"
const ADMIN_PASS = "Rc!iMIw7qQI$PzsvDQ"
const EMP_PASS = "Rc!I_EFKcZr$V61eyw"
const NEW_PASS = "Admin#Reset2026!"

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
await pool.query(`DELETE FROM "AuthLog" WHERE email = 'employee@retailcore.dev'`)

const results = []
function check(name, ok, extra = "") {
  results.push({ name, ok })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  [${extra}]` : ""}`)
}

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
  return { session: await sr.json(), cookies }
}

async function fetchPage(pathname, cookies) {
  const res = await fetch(`${BASE}${pathname}`, {
    redirect: "manual",
    headers: cookies?.size ? { cookie: cookieHeader(cookies) } : {},
  })
  return { status: res.status, loc: res.headers.get("location"), text: await res.text() }
}

const decode = (s) => s.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&")

function extractForms(html) {
  const forms = []
  const formRe = /<form[\s\S]*?<\/form>/g
  for (const fm of html.matchAll(formRe)) {
    const markup = fm[0]
    const hidden = {}
    for (const m of markup.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g)) {
      const name = m[1]
      if (!name.startsWith("$ACTION_")) hidden[name] = decode(m[2] ?? "")
    }
    const ref = /name="\$ACTION_REF_1"/.test(markup) ? "$ACTION_REF_1" : null
    const meta = markup.match(/\$ACTION_1:0" value="([^"]+)"/)
    const state = markup.match(/\$ACTION_1:1" value="([^"]+)"/)
    const key = markup.match(/\$ACTION_KEY" value="([^"]+)"/)
    const fields = []
    if (ref && meta && state && key) {
      fields.push(
        ["$ACTION_REF_1", ""],
        ["$ACTION_1:0", decode(meta[1])],
        ["$ACTION_1:1", decode(state[1])],
        ["$ACTION_KEY", decode(key[1])]
      )
    }
    for (const [k, v] of Object.entries(hidden)) fields.push([k, v])
    forms.push(fields)
  }
  return forms
}

async function invoke(pageUrl, fields, values, cookies) {
  const fd = new FormData()
  for (const [k, v] of fields) fd.append(k, v)
  for (const [k, v] of values) fd.append(k, v)
  const res = await fetch(`${BASE}${pageUrl}`, {
    method: "POST",
    redirect: "manual",
    headers: cookies?.size ? { cookie: cookieHeader(cookies) } : {},
    body: fd,
  })
  return { status: res.status, text: await res.text() }
}

// ---------- 1. unauthenticated gating ----------
const anonTargets = ["/admin/dashboard", "/admin/users", "/admin/audit", "/admin/sales", "/employee/dashboard"]
for (const t of anonTargets) {
  const r = await fetchPage(t, new Map())
  check(`anon blocked: ${t}`, r.status === 307 && r.loc === "/login", `${r.status} -> ${r.loc}`)
}

// ---------- 2. wrong-role gating ----------
const emp = await login("employee@retailcore.dev", EMP_PASS)
check("employee login", emp.session?.user?.email === "employee@retailcore.dev")
for (const t of ["/admin/dashboard", "/admin/users", "/admin/audit"]) {
  const r = await fetchPage(t, emp.cookies)
  check(`employee blocked: ${t}`, r.status === 307 && r.loc === "/login", `${r.status} -> ${r.loc}`)
}

const adm = await login("admin@retailcore.dev", ADMIN_PASS)
check("admin login", adm.session?.user?.email === "admin@retailcore.dev")
{
  const r = await fetchPage("/employee/dashboard", adm.cookies)
  check("admin blocked: /employee/dashboard", r.status === 307 && r.loc === "/login", `${r.status} -> ${r.loc}`)
}

// ---------- 3. authenticated access ----------
for (const [t, needle] of [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/users", "User Accounts"],
  ["/admin/audit", "Audit"],
]) {
  const r = await fetchPage(t, adm.cookies)
  check(`admin access: ${t}`, r.status === 200 && r.text.includes(needle), `status=${r.status}`)
}

// ---------- 4. admin resetPassword server action ----------
const { rows: targets } = await pool.query(
  `SELECT id, email, "passwordHash" FROM "User" WHERE email = 'employee@retailcore.dev'`
)
const empId = targets[0].id
const empHash = targets[0].passwordHash

const usersPage = await fetchPage("/admin/users", adm.cookies)
const forms = extractForms(usersPage.text)
const empForm = forms.find((f) => f.some(([k, v]) => k === "id" && v === empId))
check("users page has employee reset form", !!empForm)

const beforeLogs = (
  await pool.query(`SELECT COUNT(*)::int AS n FROM "AuthLog" WHERE event = 'admin_password_reset'`)
).rows[0].n

if (empForm) {
  const r = await invoke("/admin/users", empForm, [["password", NEW_PASS]], adm.cookies)
  check("admin reset action executes", r.status === 200, `status=${r.status}`)
}

const afterLogs = (
  await pool.query(`SELECT COUNT(*)::int AS n FROM "AuthLog" WHERE event = 'admin_password_reset'`)
).rows[0].n
check("admin_password_reset audit row", afterLogs === beforeLogs + 1, `${beforeLogs} -> ${afterLogs}`)

const newLogin = await login("employee@retailcore.dev", NEW_PASS)
check("new password works", newLogin.session?.user?.email === "employee@retailcore.dev")
const oldLogin = await login("employee@retailcore.dev", EMP_PASS)
check("old password rejected", oldLogin.session === null)

// ---------- restore canonical ----------
await pool.query(`DELETE FROM "AuthLog" WHERE email = 'employee@retailcore.dev'`)
await pool.query(`UPDATE "User" SET "passwordHash" = $1 WHERE email = 'employee@retailcore.dev'`, [empHash])
await pool.end()

const failed = results.filter((r) => !r.ok)
console.log(failed.length ? `\n${failed.length} FAILED` : "\nALL PASSED")
process.exit(failed.length ? 1 : 0)
