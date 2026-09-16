import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { htmlToText } from '@/lib/gb5/crawl'

export const dynamic = 'force-dynamic'

type Gb5ImportBody = {
  bo_tables?: unknown
  page_slugs?: unknown
  limit?: unknown
  dry_run?: unknown
}

type Gb5ExportPost = {
  bo_table?: unknown
  wr_id?: unknown
  title?: unknown
  subject?: unknown
  content?: unknown
  body?: unknown
  wr_subject?: unknown
  wr_content?: unknown
}

type Gb5ExportPage = {
  slug?: unknown
  page_slug?: unknown
  title?: unknown
  content?: unknown
  body?: unknown
  canonical_url?: unknown
}

type ImportResult = {
  type: 'post' | 'page'
  key: string
  title: string
  action: 'created' | 'updated' | 'skipped' | 'error'
  id?: string
  error?: string
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function normalizeText(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean)
  }

  return normalizeText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeLimit(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_LIMIT
  return Math.min(Math.floor(numeric), MAX_LIMIT)
}

function buildEndpoint() {
  if (process.env.GB5_IMPORT_ENDPOINT) return process.env.GB5_IMPORT_ENDPOINT

  const baseUrl = process.env.NEXT_PUBLIC_GB5_URL?.replace(/\/+$/, '')
  if (!baseUrl) return ''

  return `${baseUrl}/ax-seo-export.php`
}

function configuredDefaults() {
  return {
    boTables: normalizeList(process.env.GB5_IMPORT_BO_TABLES),
    pageSlugs: normalizeList(process.env.GB5_IMPORT_PAGE_SLUGS),
  }
}

function rowId(row: Record<string, unknown> | null) {
  return typeof row?.id === 'string' ? row.id : undefined
}

async function importPost(post: Gb5ExportPost, dryRun: boolean): Promise<ImportResult> {
  const boTable = normalizeText(post.bo_table)
  const wrId = normalizeText(post.wr_id)
  const title = normalizeText(post.title || post.subject || post.wr_subject)
  const body = htmlToText(normalizeText(post.content || post.body || post.wr_content))
  const key = boTable && wrId ? `${boTable}:${wrId}` : 'unknown'

  if (!boTable || !wrId || !title || !body) {
    return { type: 'post', key, title, action: 'skipped', error: 'bo_table, wr_id, title, body are required.' }
  }

  if (dryRun) {
    return { type: 'post', key, title, action: 'skipped' }
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('contents')
    .select('id')
    .eq('gb5_bo_table', boTable)
    .eq('gb5_wr_id', wrId)
    .maybeSingle()

  if (lookupError) {
    return { type: 'post', key, title, action: 'error', error: lookupError.message }
  }

  const payload = {
    title,
    body,
    content_source_mode: 'live',
    gb5_bo_table: boTable,
    gb5_wr_id: wrId,
    page_slug: null,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabaseAdmin.from('contents').update(payload).eq('id', existing.id)
    if (error) return { type: 'post', key, title, action: 'error', error: error.message }
    return { type: 'post', key, title, action: 'updated', id: rowId(existing) }
  }

  const { data: created, error } = await supabaseAdmin
    .from('contents')
    .insert({ ...payload, manual_title: null, manual_body: null })
    .select('id')
    .single()

  if (error) return { type: 'post', key, title, action: 'error', error: error.message }
  return { type: 'post', key, title, action: 'created', id: rowId(created) }
}

async function importPage(page: Gb5ExportPage, dryRun: boolean): Promise<ImportResult> {
  const slug = normalizeText(page.page_slug || page.slug).replace(/^\/+/, '').replace(/\.php$/i, '')
  const title = normalizeText(page.title)
  const body = htmlToText(normalizeText(page.content || page.body))
  const canonicalUrl = normalizeText(page.canonical_url) || null
  const key = slug || 'unknown'

  if (!slug || !title || !body) {
    return { type: 'page', key, title, action: 'skipped', error: 'slug, title, body are required.' }
  }

  if (dryRun) {
    return { type: 'page', key, title, action: 'skipped' }
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('contents')
    .select('id')
    .eq('page_slug', slug)
    .maybeSingle()

  if (lookupError) {
    return { type: 'page', key, title, action: 'error', error: lookupError.message }
  }

  const payload = {
    title,
    body,
    content_source_mode: 'live',
    page_slug: slug,
    gb5_bo_table: null,
    gb5_wr_id: null,
    canonical_url: canonicalUrl,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabaseAdmin.from('contents').update(payload).eq('id', existing.id)
    if (error) return { type: 'page', key, title, action: 'error', error: error.message }
    return { type: 'page', key, title, action: 'updated', id: rowId(existing) }
  }

  const { data: created, error } = await supabaseAdmin
    .from('contents')
    .insert({ ...payload, manual_title: null, manual_body: null })
    .select('id')
    .single()

  if (error) return { type: 'page', key, title, action: 'error', error: error.message }
  return { type: 'page', key, title, action: 'created', id: rowId(created) }
}

export async function GET() {
  const defaults = configuredDefaults()

  return NextResponse.json({
    ok: true,
    endpoint: '/api/gb5/import',
    method: 'POST',
    configured: {
      importEndpoint: Boolean(buildEndpoint()),
      secret: Boolean(process.env.GB5_IMPORT_SECRET || process.env.GB5_SYNC_SECRET),
      defaultBoTables: defaults.boTables,
      defaultPageSlugs: defaults.pageSlugs,
    },
    expectedGb5Response: {
      posts: [{ bo_table: 'notice', wr_id: '1', title: 'Title', content: 'HTML or text' }],
      pages: [{ slug: 'about', title: 'Title', content: 'HTML or text', canonical_url: 'https://example.com/sub/about.php' }],
    },
  })
}

export async function POST(request: NextRequest) {
  const endpoint = buildEndpoint()
  if (!endpoint) {
    return NextResponse.json(
      { error: 'GB5_IMPORT_ENDPOINT or NEXT_PUBLIC_GB5_URL is not configured.' },
      { status: 500 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Gb5ImportBody
  const defaults = configuredDefaults()
  const boTables = normalizeList(body.bo_tables)
  const pageSlugs = normalizeList(body.page_slugs)
  const limit = normalizeLimit(body.limit)
  const dryRun = body.dry_run === true
  const secret = process.env.GB5_IMPORT_SECRET || process.env.GB5_SYNC_SECRET || ''

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-gb5-secret': secret } : {}),
      },
      body: JSON.stringify({
        bo_tables: boTables.length ? boTables : defaults.boTables,
        page_slugs: pageSlugs.length ? pageSlugs : defaults.pageSlugs,
        limit,
      }),
      cache: 'no-store',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'GB5 import endpoint could not be reached.',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    )
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return NextResponse.json(
      { error: `GB5 import endpoint failed. HTTP ${res.status}`, detail },
      { status: 502 }
    )
  }

  const data = await res.json()
  const posts = Array.isArray(data.posts) ? (data.posts as Gb5ExportPost[]) : []
  const pages = Array.isArray(data.pages) ? (data.pages as Gb5ExportPage[]) : []
  const results: ImportResult[] = []

  for (const post of posts) {
    results.push(await importPost(post, dryRun))
  }

  for (const page of pages) {
    results.push(await importPage(page, dryRun))
  }

  const summary = results.reduce(
    (acc, result) => {
      acc[result.action] += 1
      return acc
    },
    { created: 0, updated: 0, skipped: 0, error: 0 }
  )

  return NextResponse.json({
    ok: summary.error === 0,
    dry_run: dryRun,
    fetched: { posts: posts.length, pages: pages.length },
    summary,
    results,
  })
}
