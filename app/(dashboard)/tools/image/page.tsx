'use client'

import { useState, useRef, useCallback } from 'react'

interface ResultItem {
  name: string
  origName: string
  origSize: number
  newSize: number
  dataUrl: string
  w: number
  h: number
}

const IMG_SITES = [
  { badge: '이미지', name: 'imagecompressor', desc: '이미지 축소', url: 'https://imagecompressor.com/ko/' },
  { badge: '이미지', name: 'favicon-generator', desc: '파비콘 생성', url: 'https://www.favicon-generator.org/' },
  { badge: '속도', name: 'PageSpeed Insights', desc: '구글 공식 속도 측정 도구. LCP·FID·CLS 점수 확인. 모바일/PC 별도 측정', url: 'https://pagespeed.web.dev' },
  { badge: '속도', name: 'GTmetrix', desc: '폭포수 차트로 리소스 로딩 순서 시각화. 어느 파일이 병목인지 한눈에', url: 'https://gtmetrix.com' },
  { badge: '종합', name: 'web.dev Measure', desc: '구글 Lighthouse 기반 종합 진단. 성능·접근성·SEO·PWA 4가지 점수', url: 'https://web.dev/measure' },
  { badge: 'SEO', name: '리치 리절트 테스트', desc: 'JSON-LD 스키마 검증. 오류 없이 초록색으로 나와야 구글 리치 스니펫 표시', url: 'https://search.google.com/test/rich-results' },
  { badge: 'SEO', name: '모바일 친화성 테스트', desc: '구글 공식 모바일 친화성 검사. "사용 가능" 결과가 나와야 모바일 검색 유리', url: 'https://search.google.com/test/mobile-friendly' },
  { badge: '이미지', name: 'Squoosh', desc: '구글 만든 이미지 압축 도구. WebP·AVIF 변환, 원본 대비 비교 뷰 제공', url: 'https://squoosh.app' },
  { badge: '이미지', name: 'TinyPNG / TinyJPG', desc: 'PNG·JPG 스마트 압축. 화질 거의 유지하면서 용량 70%까지 절감', url: 'https://tinypng.com' },
  { badge: '속도', name: 'DebugBear', desc: 'Core Web Vitals 실측 데이터 + 개선 우선순위 제시. 크롬 사용자 실제 데이터 반영', url: 'https://www.debugbear.com/test/website-speed' },
  { badge: '속도', name: 'WebPageTest', desc: '글로벌 여러 위치에서 속도 측정. 동영상으로 로딩 과정 재현 가능', url: 'https://www.webpagetest.org' },
  { badge: '코드', name: 'CSS Minifier', desc: 'CSS 파일 공백·주석 제거 minify. 파일 크기 20~30% 절감', url: 'https://cssminifier.com' },
  { badge: '코드', name: 'JavaScript Minifier', desc: 'JS 파일 minify. 변수명 단축 + 공백 제거로 파일 크기 대폭 절감', url: 'https://javascript-minifier.com' },
  { badge: 'SEO', name: 'Facebook OG 디버거', desc: 'OG 태그 미리보기. 카카오톡·SNS 공유 시 이미지·제목 정상 표시 여부 확인', url: 'https://developers.facebook.com/tools/debug' },
  { badge: 'SEO', name: 'Schema.org 검증기', desc: 'Schema.org 검증기 — 문법 오류 체크', url: 'https://validator.schema.org' },
  { badge: 'SEO', name: 'Sitemaps 생성기', desc: 'URL 입력 시 sitemap.xml 자동 생성. Search Console 등록용', url: 'https://www.xml-sitemaps.com/' },
  { badge: '영상', name: '영상 WebM 변환기', desc: 'MP4 → WebM 변환. 웹 최적화 영상 포맷으로 용량 절감', url: 'https://cloudconvert.com/mp4-to-webm' },
]

const SEO_SITES = [
  { badge: '구글 공식 · 속도', name: 'PageSpeed Insights', desc: 'Core Web Vitals(LCP·FID·CLS) 0~100점 수치화. 모바일/PC 별도 점수. 납품 보고서 캡처용으로 가장 신뢰도 높음', url: 'https://pagespeed.web.dev' },
  { badge: '구글 공식 · 필수', name: 'Google Search Console', desc: '키워드 순위·CTR·노출수·색인 현황 확인. 본인 사이트 전용. 트래픽 증가율·평균 순위 수치 보고서 근거 자료', url: 'https://search.google.com/search-console' },
  { badge: '구글 공식 · SEO', name: 'Rich Results Test', desc: 'JSON-LD 구조화 데이터 적용 여부 확인. 초록색 통과 시 리치 스니펫 노출 가능. 납품 완료 증거 캡처용', url: 'https://search.google.com/test/rich-results' },
  { badge: '구글 공식 · SEO', name: 'Mobile Friendly Test', desc: '모바일 친화성 판정. "모바일 친화적" 통과 캡처 한 장으로 광고주에게 즉시 증명 가능', url: 'https://search.google.com/test/mobile-friendly' },
  { badge: '구글 공식 · 종합', name: 'web.dev Measure', desc: 'Lighthouse 기반 성능·접근성·SEO·PWA 4가지 점수 동시 확인. SEO 점수 항목별 개선 가이드 제공', url: 'https://web.dev/measure' },
  { badge: '네이버 공식', name: '네이버 서치어드바이저', desc: '네이버 기준 SEO 진단. 사이트맵 등록·크롤링 현황·수집 오류 확인. 국내 B2C 사이트 필수', url: 'https://searchadvisor.naver.com' },
  { badge: '네이버', name: '네이버 데이터랩', desc: '네이버 검색어 트렌드 비교. 타겟 키워드 시즌별 검색량 파악. 콘텐츠 발행 타이밍 전략 수립용', url: 'https://datalab.naver.com' },
  { badge: '키워드 · 국내 특화', name: '블랙키위', desc: '네이버 키워드 월간 검색량·경쟁도·콘텐츠 발행량 분석. 국내 SEO 키워드 도구 중 가장 실용적. 무료 기본 사용 가능', url: 'https://blackkiwi.net' },
  { badge: '속도 · 상세', name: 'GTmetrix', desc: 'PageSpeed보다 상세한 로딩 분석. 어떤 리소스가 느린지 폭포수 차트로 시각화. 무료 계정으로 기본 사용 가능', url: 'https://gtmetrix.com' },
  { badge: '종합 진단 · 일부 무료', name: 'Semrush Site Audit', desc: 'SEO 종합 점수·기술 오류·경쟁사 비교. 하루 10회 무료 조회. 광고주 제안서용 경쟁사 분석 자료에 유용', url: 'https://ko.semrush.com/siteaudit/' },
  { badge: '백링크 · 일부 무료', name: 'Ahrefs 무료 도구', desc: '백링크 상위 100개 무료 확인·키워드 생성기·깨진 링크 체크. 경쟁사 백링크 현황 파악용', url: 'https://ahrefs.com/free-seo-tools' },
  { badge: '키워드 · 일부 무료', name: 'Ubersuggest', desc: '경쟁사 트래픽·상위 키워드·백링크 무료 조회. 초보자 친화적. 제안서용 간단 경쟁사 비교 자료로 충분', url: 'https://neilpatel.com/ubersuggest' },
  { badge: '크롬 확장 · 무료', name: 'MozBar', desc: '브라우저에서 바로 DA(도메인 권위) 점수 확인. 검색 결과에서 경쟁사 점수 즉시 비교 가능. 크롬 확장 설치', url: 'https://moz.com/products/pro/seo-toolbar' },
  { badge: 'SEO · 무료', name: 'Schema.org 검증기', desc: '구조화 데이터 문법 오류 체크. Rich Results Test와 함께 사용하면 스키마 완성도 이중 확인 가능', url: 'https://validator.schema.org' },
  { badge: '속도 · 실측', name: 'DebugBear', desc: 'Core Web Vitals 실제 크롬 사용자 데이터 기반 측정. 개선 우선순위 자동 제시. 실측 vs 추정 비교 가능', url: 'https://www.debugbear.com/test/website-speed' },
]

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1024 / 1024).toFixed(2) + 'MB'
}

type Tab = 'convert' | 'sites' | 'seo-sites'

export default function ImageToolPage() {
  const [tab, setTab] = useState<Tab>('convert')
  const [results, setResults] = useState<ResultItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [format, setFormat] = useState('webp')
  const [quality, setQuality] = useState(82)
  const [maxWidth, setMaxWidth] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (!images.length) return

    setProcessing(true)
    setResults([])
    setProgress(0)

    const processed: ResultItem[] = []
    let done = 0

    images.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let w = img.naturalWidth
          let h = img.naturalHeight
          if (maxWidth > 0 && w > maxWidth) {
            h = Math.round((h * maxWidth) / w)
            w = maxWidth
          }
          canvas.width = w
          canvas.height = h
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)

          const mime = `image/${format}`
          const dataUrl = canvas.toDataURL(mime, quality / 100)
          const ext = format === 'jpeg' ? 'jpg' : format
          const newName = file.name.replace(/\.[^.]+$/, '') + '.' + ext
          const newSize = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)

          processed.push({ name: newName, origName: file.name, origSize: file.size, newSize, dataUrl, w, h })
          done++
          const pct = Math.round((done / images.length) * 100)
          setProgress(pct)
          setProgressText(`${done} / ${images.length} 변환 중...`)

          if (done === images.length) {
            setProcessing(false)
            setResults([...processed])
          }
        }
        img.src = e.target!.result as string
      }
      reader.readAsDataURL(file)
    })
  }, [format, quality, maxWidth])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    processFiles(Array.from(e.dataTransfer.files))
  }

  const downloadOne = (r: ResultItem) => {
    const a = document.createElement('a')
    a.href = r.dataUrl
    a.download = r.name
    a.click()
  }

  const downloadAll = () => {
    results.forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = r.dataUrl
        a.download = r.name
        a.click()
      }, i * 200)
    })
  }

  const totalOrig = results.reduce((s, r) => s + r.origSize, 0)
  const totalNew = results.reduce((s, r) => s + r.newSize, 0)
  const totalSaved = totalOrig > 0 ? Math.round((1 - totalNew / totalOrig) * 100) : 0

  return (
    <div className="mx-auto w-full max-w-[1100px] px-8 py-10">
      <p className="mb-1 text-[18px] font-bold text-ink">이미지 최적화 도구</p>
      <p className="mb-6 text-[13px] text-ink-hint">WebP 변환 · 이미지 압축 · 최적화 참고 사이트</p>

      {/* 탭 */}
      <div className="mb-6 flex gap-0 border-b border-line">
        {(['convert', 'sites', 'seo-sites'] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = { convert: 'WebP 변환 · 압축', sites: '최적화 참고 사이트', 'seo-sites': 'SEO 점수 확인' }
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-5 py-2.5 text-[13px] font-bold transition-all ${
                tab === t ? 'border-ink text-ink' : 'border-transparent text-ink-hint hover:text-ink'
              }`}
            >
              {labels[t]}
            </button>
          )
        })}
      </div>

      {/* WebP 변환 */}
      {tab === 'convert' && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mb-4 cursor-pointer rounded-xl border-2 border-dashed py-12 text-center transition-all ${
              isDragOver ? 'border-accent bg-blue-50' : 'border-line bg-surface hover:border-accent'
            }`}
          >
            <p className="mb-2 text-[32px]">🖼️</p>
            <p className="mb-1 text-[15px] font-bold text-ink">이미지를 드래그하거나 클릭해서 선택</p>
            <p className="mb-4 text-[13px] text-ink-hint">JPG, PNG, GIF, BMP 지원 · 여러 장 동시 처리 가능</p>
            <span className="rounded-lg bg-ink px-5 py-2 text-[13px] font-bold text-white">파일 선택</span>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => processFiles(Array.from(e.target.files ?? []))} />

          <div className="mb-6 flex flex-wrap items-center gap-5 rounded-xl border border-line bg-surface-muted px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-ink-secondary">출력 형식</span>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-lg border border-line px-2 py-1 text-[12px] text-ink outline-none">
                <option value="webp">WebP (권장)</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-ink-secondary">품질</span>
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-24" />
              <span className="text-[12px] font-bold text-ink">{quality}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-ink-secondary">최대 너비</span>
              <select value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value))} className="rounded-lg border border-line px-2 py-1 text-[12px] text-ink outline-none">
                <option value={0}>원본 크기</option>
                <option value={1920}>1920px</option>
                <option value={1280}>1280px</option>
                <option value={960}>960px</option>
                <option value={640}>640px</option>
                <option value={480}>480px</option>
              </select>
            </div>
          </div>

          {processing && (
            <div className="py-6 text-center text-[13px] text-ink-hint">
              <p className="mb-2">{progressText}</p>
              <div className="mx-auto h-1 w-64 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[14px] font-bold text-ink">
                  변환 결과 <span className="ml-1 text-[13px] font-normal text-ink-hint">{results.length}장</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={() => { setResults([]); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="rounded-lg border border-line px-4 py-2 text-[13px] font-bold text-ink-secondary hover:bg-surface-muted">
                    ✕ 초기화
                  </button>
                  <button onClick={downloadAll} className="rounded-lg bg-score-good px-4 py-2 text-[13px] font-bold text-white hover:opacity-90">
                    ⬇ 전체 다운로드
                  </button>
                </div>
              </div>
              <p className="mb-4 text-[13px] font-bold" style={{ color: totalSaved >= 0 ? '#15803D' : '#B91C1C' }}>
                전체: {fmtSize(totalOrig)} → {fmtSize(totalNew)} ({totalSaved >= 0 ? '-' : '+'}{Math.abs(totalSaved)}% {totalSaved >= 0 ? '절감' : '증가'})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {results.map((r, i) => {
                  const saved = r.origSize > 0 ? Math.round((1 - r.newSize / r.origSize) * 100) : 0
                  return (
                    <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
                      <img src={r.dataUrl} alt="" className="h-36 w-full object-cover" />
                      <div className="p-3">
                        <p className="mb-1 truncate text-[12px] font-bold text-ink" title={r.name}>{r.name}</p>
                        <div className="mb-1 flex items-center gap-1.5 text-[11px]">
                          <span className="text-ink-hint line-through">{fmtSize(r.origSize)}</span>
                          <span className="text-ink-hint">→</span>
                          <span className="font-bold text-score-good">{fmtSize(r.newSize)}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${saved >= 0 ? 'bg-green-50 text-score-good' : 'bg-red-50 text-score-bad'}`}>
                            {saved >= 0 ? '-' : '+'}{Math.abs(saved)}%
                          </span>
                        </div>
                        <p className="mb-2 text-[11px] text-ink-hint">{r.w} × {r.h}px</p>
                        <button onClick={() => downloadOne(r)} className="w-full rounded-lg bg-ink py-1.5 text-[12px] font-bold text-white hover:opacity-80">
                          ⬇ 다운로드
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 최적화 참고 사이트 - 17개 */}
      {tab === 'sites' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IMG_SITES.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
              className="block rounded-xl border border-line bg-surface p-4 transition-all hover:border-accent">
              <span className="mb-2 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-ink-secondary">{s.badge}</span>
              <p className="mb-1 text-[14px] font-bold text-ink">{s.name}</p>
              <p className="mb-1 text-[12px] leading-relaxed text-ink-hint">{s.desc}</p>
              <span className="text-[11px] text-accent">{s.url.replace('https://', '')}</span>
            </a>
          ))}
        </div>
      )}

      {/* SEO 점수 확인 사이트 - 15개 */}
      {tab === 'seo-sites' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEO_SITES.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
              className="block rounded-xl border border-line bg-surface p-4 transition-all hover:border-accent">
              <span className="mb-2 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-ink-secondary">{s.badge}</span>
              <p className="mb-1 text-[14px] font-bold text-ink">{s.name}</p>
              <p className="mb-1 text-[12px] leading-relaxed text-ink-hint">{s.desc}</p>
              <span className="text-[11px] text-accent">{s.url.replace('https://', '')}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}