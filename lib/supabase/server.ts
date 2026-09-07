import { neon } from '@neondatabase/serverless'

type Row = any
type QueryResult<T> = { data: T | null; error: Error | null }

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

function requireSql() {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured.')
  }

  return sql
}

function quoteIdent(value: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`)
  }

  return `"${value}"`
}

function selectColumns(columns: string) {
  if (columns.trim() === '*') return '*'

  return columns
    .split(',')
    .map((column) => quoteIdent(column.trim()))
    .join(', ')
}

class NeonTableQuery {
  private selectClause = '*'
  private filters: Array<{ column: string; value: unknown }> = []
  private orderBy: { column: string; ascending: boolean } | null = null
  private rowLimit: number | null = null
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private payload: Row | Row[] | null = null
  private returnRows = false
  private singleMode: 'single' | 'maybeSingle' | null = null
  private conflictColumns: string[] = []

  constructor(private table: string) {}

  select(columns = '*') {
    this.selectClause = selectColumns(columns)
    this.returnRows = true
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  limit(count: number) {
    this.rowLimit = count
    return this
  }

  single(): Promise<QueryResult<Row>> {
    this.singleMode = 'single'
    return this.execute<Row>()
  }

  maybeSingle(): Promise<QueryResult<Row>> {
    this.singleMode = 'maybeSingle'
    return this.execute<Row>()
  }

  insert(payload: Row | Row[]) {
    this.action = 'insert'
    this.payload = payload
    return this
  }

  update(payload: Row) {
    this.action = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  upsert(payload: Row | Row[], options?: { onConflict?: string }) {
    this.action = 'upsert'
    this.payload = payload
    this.conflictColumns = options?.onConflict
      ? options.onConflict.split(',').map((column) => column.trim())
      : ['id']
    return this
  }

  then<TResult1 = QueryResult<Row[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<Row[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected)
  }

  private whereClause(params: unknown[]) {
    if (this.filters.length === 0) return ''

    const clauses = this.filters.map(({ column, value }) => {
      params.push(value)
      return `${quoteIdent(column)} = $${params.length}`
    })

    return ` WHERE ${clauses.join(' AND ')}`
  }

  private async execute<T = Row[] | Row | null>(): Promise<QueryResult<T>> {
    try {
      const rows = await this.run()
      const data = this.singleMode ? (rows[0] ?? null) : rows

      if (this.singleMode === 'single' && rows.length === 0) {
        return { data: null, error: new Error('Row not found') }
      }

      return { data: data as T, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  private async run(): Promise<Row[]> {
    if (this.action === 'select') return this.runSelect()
    if (this.action === 'insert') return this.runInsert()
    if (this.action === 'update') return this.runUpdate()
    if (this.action === 'delete') return this.runDelete()
    return this.runUpsert()
  }

  private async runSelect() {
    const params: unknown[] = []
    let query = `SELECT ${this.selectClause} FROM ${quoteIdent(this.table)}`
    query += this.whereClause(params)

    if (this.orderBy) {
      query += ` ORDER BY ${quoteIdent(this.orderBy.column)} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`
    }

    if (this.rowLimit !== null) {
      params.push(this.rowLimit)
      query += ` LIMIT $${params.length}`
    }

    return requireSql().query(query, params) as Promise<Row[]>
  }

  private async runInsert() {
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
    const validRows = rows.filter((row): row is Row => !!row)
    if (validRows.length === 0) return []

    const columns = Object.keys(validRows[0])
    const params: unknown[] = []
    const valuesSql = validRows
      .map((row) => {
        const placeholders = columns.map((column) => {
          params.push(row[column])
          return `$${params.length}`
        })
        return `(${placeholders.join(', ')})`
      })
      .join(', ')

    const returning = this.returnRows ? ` RETURNING ${this.selectClause}` : ''
    const query = `INSERT INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${valuesSql}${returning}`

    return requireSql().query(query, params) as Promise<Row[]>
  }

  private async runUpdate() {
    const payload = this.payload as Row
    const params: unknown[] = []
    const assignments = Object.keys(payload).map((column) => {
      params.push(payload[column])
      return `${quoteIdent(column)} = $${params.length}`
    })
    const returning = this.returnRows ? ` RETURNING ${this.selectClause}` : ''
    const query = `UPDATE ${quoteIdent(this.table)} SET ${assignments.join(', ')}${this.whereClause(params)}${returning}`

    return requireSql().query(query, params) as Promise<Row[]>
  }

  private async runDelete() {
    const params: unknown[] = []
    const query = `DELETE FROM ${quoteIdent(this.table)}${this.whereClause(params)}`
    await requireSql().query(query, params)
    return []
  }

  private async runUpsert() {
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
    const validRows = rows.filter((row): row is Row => !!row)
    if (validRows.length === 0) return []

    const columns = Object.keys(validRows[0])
    const updateColumns = columns.filter((column) => !this.conflictColumns.includes(column))
    const params: unknown[] = []
    const valuesSql = validRows
      .map((row) => {
        const placeholders = columns.map((column) => {
          params.push(row[column])
          return `$${params.length}`
        })
        return `(${placeholders.join(', ')})`
      })
      .join(', ')

    const conflict = this.conflictColumns.map(quoteIdent).join(', ')
    const updateSql = updateColumns.length
      ? `DO UPDATE SET ${updateColumns.map((column) => `${quoteIdent(column)} = EXCLUDED.${quoteIdent(column)}`).join(', ')}`
      : 'DO NOTHING'
    const returning = this.returnRows ? ` RETURNING ${this.selectClause}` : ''
    const query = `INSERT INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${valuesSql} ON CONFLICT (${conflict}) ${updateSql}${returning}`

    return requireSql().query(query, params) as Promise<Row[]>
  }
}

export const supabaseAdmin = {
  from(table: string) {
    return new NeonTableQuery(table)
  },
}
