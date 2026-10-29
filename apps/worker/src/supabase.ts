// Minimal Supabase client using plain fetch (PostgREST + Auth), so the Worker
// needs no extra packages. Uses the service-role key: it bypasses Row Level
// Security, so every endpoint that uses it must do its own permission checks.

export type Env = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  GEMINI_API_KEY: string
  GEMINI_MODEL: string
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  WORKER_URL: string
  WEB_URL: string
  GITHUB_WEBHOOK_SECRET: string
  GITHUB_TOKEN?: string // optional: raises GitHub's API rate limit
}

export type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function headers(env: Env, extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
    ...extra,
  }
  // Legacy service_role keys are JWTs and go in Authorization too. The newer
  // "sb_secret_..." keys are not JWTs and are sent only as the apikey header.
  if (!env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_')) {
    h.Authorization = `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  }
  return h
}

/** Values in filters are always URL-encoded and prefixed with eq. */
function eq(filters: Record<string, string>): string {
  return Object.entries(filters)
    .map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`)
    .join('&')
}

async function fail(res: Response, what: string): Promise<never> {
  const text = await res.text().catch(() => '')
  throw new Error(`Supabase ${what} failed (${res.status}): ${text.slice(0, 300)}`)
}

/** Returns the rows matching all filters. */
export async function select(env: Env, table: string, columns: string, filters: Record<string, string>): Promise<Row[]> {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}&${eq(filters)}`
  const res = await fetch(url, { headers: headers(env) })
  if (!res.ok) return fail(res, `select ${table}`)
  return (await res.json()) as Row[]
}

export async function selectOne(env: Env, table: string, columns: string, filters: Record<string, string>): Promise<Row | null> {
  const rows = await select(env, table, columns, filters)
  return rows[0] ?? null
}

export async function insert(env: Env, table: string, row: Row): Promise<Row> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers(env, { Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  })
  if (!res.ok) return fail(res, `insert ${table}`)
  const rows = (await res.json()) as Row[]
  return rows[0]
}

/** Updates rows matching the filters and returns the updated rows. */
export async function update(env: Env, table: string, filters: Record<string, string>, values: Row): Promise<Row[]> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${eq(filters)}`, {
    method: 'PATCH',
    headers: headers(env, { Prefer: 'return=representation' }),
    body: JSON.stringify(values),
  })
  if (!res.ok) return fail(res, `update ${table}`)
  return (await res.json()) as Row[]
}

export async function remove(env: Env, table: string, filters: Record<string, string>): Promise<number> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${eq(filters)}`, {
    method: 'DELETE',
    headers: headers(env, { Prefer: 'return=representation' }),
  })
  if (!res.ok) return fail(res, `delete ${table}`)
  return ((await res.json()) as Row[]).length
}

/** Checks a user's login token with Supabase Auth. Returns the user id, or null. */
export async function getUserId(env: Env, authorization: string | undefined): Promise<string | null> {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) return null
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const user = (await res.json()) as { id?: string }
  return user.id ?? null
}
