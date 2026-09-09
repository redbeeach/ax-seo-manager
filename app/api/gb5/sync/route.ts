import { NextRequest, NextResponse } from 'next/server'
import { databaseProvider, supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Gb5SyncBody = {
  bo_table?: unknown
  wr_id?: unknown
  title?: unknown
  content?: unknown
}

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Access-Control-Allow-Origin': '*',
      ...(init?.headers || {}),
    },
  })
}

function normalizeText(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

export async function GET() {
  return json({
    ok: true,
    endpoint: '/api/gb5/sync',
    method: 'POST',
    requiredHeaders: ['content-type: application/json', 'x-gb5-secret'],
    configured: {
      secret: Boolean(process.env.GB5_SYNC_SECRET),
      provider: databaseProvider,
      database: Boolean(
        process.env.DATABASE_URL ||
          (process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.SUPABASE_SERVICE_ROLE_KEY)
      ),
    },
  })
}

export async function POST(req: NextRequest) {
  if (!process.env.GB5_SYNC_SECRET) {
    console.error('[gb5/sync] GB5_SYNC_SECRET is not configured.')
    return json({ error: 'GB5_SYNC_SECRET is not configured.' }, { status: 500 })
  }

  const secret = req.headers.get('x-gb5-secret')

  if (secret !== process.env.GB5_SYNC_SECRET) {
    return json({ error: 'Authentication failed.' }, { status: 401 })
  }

  let body: Gb5SyncBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const boTable = normalizeText(body.bo_table)
  const wrId = normalizeText(body.wr_id)
  const title = normalizeText(body.title)
  const content = normalizeText(body.content)

  if (!boTable || !wrId || !title) {
    return json(
      { error: 'bo_table, wr_id, and title are required.' },
      { status: 400 }
    )
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('contents')
    .select('id, seo_title')
    .eq('gb5_bo_table', boTable)
    .eq('gb5_wr_id', wrId)
    .maybeSingle()

  if (lookupError) {
    console.error('[gb5/sync] lookup failed:', lookupError.message)
    return json({ error: lookupError.message }, { status: 500 })
  }

  if (existing?.seo_title) {
    return json({
      skipped: true,
      reason: 'Content already has an optimized SEO title.',
      id: existing.id,
    })
  }

  if (existing) {
    const { error } = await supabaseAdmin
      .from('contents')
      .update({ title, body: content })
      .eq('id', existing.id)

    if (error) {
      console.error('[gb5/sync] update failed:', error.message)
      return json({ error: error.message }, { status: 500 })
    }

    return json({ updated: true, id: existing.id })
  }

  const { data: created, error } = await supabaseAdmin
    .from('contents')
    .insert({
      title,
      body: content,
      gb5_bo_table: boTable,
      gb5_wr_id: wrId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[gb5/sync] insert failed:', error.message)
    return json({ error: error.message }, { status: 500 })
  }

  if (!created) {
    console.error('[gb5/sync] insert returned no row.')
    return json({ error: 'Insert returned no row.' }, { status: 500 })
  }

  return json({ created: true, id: created.id }, { status: 201 })
}
