import { buildCrawlTargetUrl } from '@/lib/gb5/url'

type CrawlSource = {
  title?: string | null
  page_slug?: string | null
  gb5_bo_table?: string | null
  gb5_wr_id?: string | number | null
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractTitle(html: string): string | null {
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  if (ogTitle?.[1]) return ogTitle[1].trim()

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return title ? stripTags(title[1]).trim() : null
}

export function extractBodyInner(html: string): string {
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (article?.[1]) return article[1]

  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (main?.[1]) return main[1]

  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return body ? body[1] : html
}

export async function fetchLivePageContent(source: CrawlSource) {
  const url = buildCrawlTargetUrl(source)
  if (!url) {
    throw new Error('실제 페이지 URL을 만들 수 없습니다. GB5 게시글 정보 또는 고정 페이지 슬러그를 입력해주세요.')
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`실제 페이지 응답 오류 (HTTP ${res.status} ${res.statusText})`)
  }

  const html = await res.text()
  const title = extractTitle(html) || source.title || '제목 없음'
  const body = extractBodyInner(html)

  return {
    url,
    title,
    body,
    text: stripTags(body),
  }
}
