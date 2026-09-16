import Gb5ImportPanel from '@/components/Gb5ImportPanel'

export const dynamic = 'force-dynamic'

export default function Gb5IntegrationPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] bg-surface px-8 py-10">
      <div className="mb-6">
        <p className="mb-2.5 text-sm font-medium text-accent">Integration</p>
        <h1 className="text-[32px] font-bold tracking-tight text-ink">그누보드 연동</h1>
      </div>

      <Gb5ImportPanel />

      <section className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="text-[18px] font-black text-ink">필요한 그누보드 응답 형식</h2>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          그누보드 쪽 export API는 `posts`와 `pages` 배열을 JSON으로 반환하면 됩니다.
          AX는 `bo_table + wr_id` 또는 `page_slug` 기준으로 중복 없이 생성/갱신합니다.
        </p>
        <pre className="mt-4 overflow-auto rounded bg-ink p-4 text-xs leading-5 text-white">
{`{
  "posts": [
    {
      "bo_table": "notice",
      "wr_id": "1",
      "title": "게시글 제목",
      "content": "게시글 본문 HTML 또는 텍스트"
    }
  ],
  "pages": [
    {
      "slug": "about",
      "title": "회사소개",
      "content": "서브페이지 본문 HTML 또는 텍스트",
      "canonical_url": "https://example.com/sub/about.php"
    }
  ]
}`}
        </pre>
      </section>
    </div>
  )
}
