import ContentForm from '@/components/ContentForm'

export default function NewContentPage() {
  return (
    <div className="mx-auto max-w-3xl bg-surface px-8 py-10">
      <p className="mb-2.5 text-sm font-medium text-accent">콘텐츠 / 새 글</p>
      <h1 className="mb-7 text-[32px] font-bold tracking-tight text-ink">
        새 콘텐츠 작성
      </h1>

      <div className="mb-7 border-t border-line" />

      <ContentForm mode="new" />
    </div>
  )
}
