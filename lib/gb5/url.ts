interface UrlSource {
  canonical_url?: string | null
  page_slug?: string | null
  gb5_bo_table?: string | null
  gb5_wr_id?: string | number | null
}

const DEFAULT_GB5_SUBPAGE_PATH = '/sub'

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizePath(value: string | undefined, fallback: string) {
  const path = value?.trim() || fallback
  return path.startsWith('/') ? stripTrailingSlash(path) : `/${stripTrailingSlash(path)}`
}

export function getGb5BaseUrl() {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_GB5_URL || '')
}

export function getGb5SubpagePath() {
  return normalizePath(process.env.NEXT_PUBLIC_GB5_SUBPAGE_PATH, DEFAULT_GB5_SUBPAGE_PATH)
}

export function getGb5Hostname() {
  try {
    return new URL(getGb5BaseUrl()).hostname
  } catch {
    return ''
  }
}

export function buildGb5PostUrl(boTable: string, wrId: string | number) {
  const baseUrl = getGb5BaseUrl()
  return baseUrl ? `${baseUrl}/bbs/board.php?bo_table=${boTable}&wr_id=${wrId}` : ''
}

export function buildGb5PageUrl(pageSlug: string) {
  const baseUrl = getGb5BaseUrl()
  return baseUrl ? `${baseUrl}${getGb5SubpagePath()}/${pageSlug}.php` : ''
}

export function buildGb5ExportUrl() {
  const baseUrl = getGb5BaseUrl()
  return baseUrl ? `${baseUrl}/ax-seo-export.php` : ''
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false

    // localhost / 127.0.0.1 / 사설 IP는 실제 라이브 페이지가 아니므로 canonical로 인정하지 않음
    const hostname = parsed.hostname.toLowerCase()
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    const isPrivateIp = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(hostname)
    if (isLocalhost || isPrivateIp) return false

    return true
  } catch {
    return false
  }
}

/**
 * 콘텐츠 레코드로부터 실제 라이브 페이지 URL을 우선순위대로 결정한다.
 * 1. canonical_url 직접 지정 (단, http/https 형식이 아니면 무시하고 다음 순위로 넘어감)
 * 2. page_slug 기반 고정 페이지
 * 3. gb5_bo_table + gb5_wr_id 기반 게시판 글
 * 위 셋 다 없으면 null
 *
 * ⚠️ 메타태그 <link rel="canonical"> 생성 등 "SEO 표준 URL"이 필요할 때만 사용.
 * 크롤링(실제 페이지 검사)에는 절대 쓰지 말 것 — buildCrawlTargetUrl을 사용한다.
 */
export function buildLiveUrl(content: UrlSource): string | null {
  if (content.canonical_url && isValidHttpUrl(content.canonical_url)) {
    return content.canonical_url
  }

  if (content.page_slug) {
    return buildGb5PageUrl(content.page_slug)
  }

  if (content.gb5_bo_table && content.gb5_wr_id) {
    return buildGb5PostUrl(content.gb5_bo_table, content.gb5_wr_id)
  }

  return null
}

/**
 * 크롤링(실제 GB5 페이지 검사)용 URL을 결정한다.
 * canonical_url은 사용자가 임의로 입력한 값이라 신뢰할 수 없으므로 절대 사용하지 않고,
 * 항상 page_slug 또는 gb5_bo_table+wr_id 기반의 "진짜 GB5 원본 주소"만 사용한다.
 */
export function buildCrawlTargetUrl(content: UrlSource): string | null {
  if (content.page_slug) {
    return buildGb5PageUrl(content.page_slug)
  }

  if (content.gb5_bo_table && content.gb5_wr_id) {
    return buildGb5PostUrl(content.gb5_bo_table, content.gb5_wr_id)
  }

  return null
}
