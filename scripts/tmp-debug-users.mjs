import fs from "fs"
import path from "path"
import pg from "pg"
const BASE = "http://localhost:3000"
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
const parseCookies = (hs) => {
  const m = new Map()
  for (const h of hs ?? []) {
    const [p] = h.split(";")
    const i = p.indexOf("=")
    if (i > -1) m.set(p.slice(0, i).trim(), p.slice(i + 1).trim())
  }
  return m
}
const login = async (email, password) => {
  const c = new Map()
  const r0 = await fetch(BASE + "/api/auth/csrf", { redirect: "manual" })
  for (const [k, v] of parseCookies(r0.headers.getSetCookie())) c.set(k, v)
  const csrf = (await r0.json()).csrfToken
  const ch = [...c.entries()].map(([k, v]) => k + "=" + v).join("; ")
  const r = await fetch(BASE + "/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: ch },
    body: new URLSearchParams({ csrfToken: csrf, email, password, redirect: "false" }),
    redirect: "manual",
  })
  for (const [k, v] of parseCookies(r.headers.getSetCookie())) c.set(k, v)
  const s = await fetch(BASE + "/api/auth/session", { headers: { cookie: ch } })
  return { session: await s.json(), cookies: c }
}
const adm = await login("admin@retailcore.dev", "Rc!iMIw7qQI$PzsvDQ")
const res = await fetch(BASE + "/admin/users", {
  redirect: "manual",
  headers: { cookie: [...adm.cookies.entries()].map(([k, v]) => k + "=" + v).join("; ") },
})
const html = await res.text()
for (const needle of ['"bound"', '"bound":', 'id":', 'actionId']) {
  let i = -1
  const hits = []
  while ((i = html.indexOf(needle, i + 1)) !== -1 && hits.length < 4) hits.push(i)
  console.log(needle, "=>", hits.join(", "))
}
for (const i of [html.indexOf('"bound"'), html.indexOf('$ACTION'), html.indexOf("multipart"), html.indexOf("action\"")]) {
  if (i > -1) { console.log(`--- @ ${i} ---`); console.log(html.slice(i - 100, i + 200)) }
}
await pool.end()
