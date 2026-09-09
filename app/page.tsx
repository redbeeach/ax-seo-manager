import Link from "next/link";

const aiFeatures = [
  {
    label: "SEO",
    title: "검색 결과용 문구 자동 생성",
    description:
      "AI가 게시글 내용을 읽고 SEO Title, Meta Description, OG Title, OG Description을 제안합니다.",
  },
  {
    label: "AEO",
    title: "AI 답변 엔진 최적화",
    description:
      "ChatGPT, Perplexity 같은 답변형 검색이 인용하기 좋은 FAQ와 핵심 답변을 만듭니다.",
  },
  {
    label: "GEO",
    title: "생성형 AI 검색 대비",
    description:
      "GEO 요약과 JSON-LD 구조화 데이터로 AI가 콘텐츠 맥락을 이해하기 쉽게 정리합니다.",
  },
];

const scoreItems = [
  "SEO 점수",
  "AEO 점수",
  "GEO 점수",
  "Content 점수",
  "AI Citation 점수",
  "E-E-A-T 점수",
  "Readability 점수",
];

const steps = [
  {
    number: "01",
    title: "홈페이지 관리자에게 먼저 요청하세요.",
    description:
      "AX SEO Manager는 운영 중인 홈페이지 안쪽에 연동 코드가 들어가야 작동합니다.",
  },
  {
    number: "02",
    title: "현재는 그누보드5만 가능합니다.",
    description:
      "그누보드5 게시판 글 작성, 수정 흐름과 연결해 콘텐츠를 자동으로 가져옵니다.",
  },
  {
    number: "03",
    title: "AI가 검색 최적화 초안을 만듭니다.",
    description:
      "관리자는 생성된 SEO/AEO/GEO 문구를 확인하고 필요한 부분만 다듬어 반영합니다.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-[#171717]">
      <section className="relative overflow-hidden bg-[#101820] text-white">
        <div className="absolute inset-0 opacity-35">
          <div className="h-full w-full bg-[linear-gradient(120deg,rgba(45,212,191,.34),transparent_34%),linear-gradient(310deg,rgba(244,114,182,.22),transparent_38%),radial-gradient(circle_at_78%_22%,rgba(250,204,21,.26),transparent_28%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col px-6 py-7 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="text-base font-semibold tracking-normal">
              AX SEO Manager
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/manual.html"
                className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/85 transition hover:border-white/60 hover:bg-white/10 sm:inline-flex"
              >
                매뉴얼
              </Link>
              <Link
                href="/contents"
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:border-white/70 hover:bg-white/10"
              >
                관리자 화면
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.02fr_.98fr]">
            <div>
              <p className="mb-5 text-sm font-semibold text-[#5eead4]">
                그누보드5 전용 AI 검색 최적화 플랫폼
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-normal sm:text-6xl lg:text-7xl">
                게시글을 AI가 읽고, 검색에 보이기 좋은 문구로 바꿉니다.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/78">
                AX SEO Manager는 그누보드5 게시판 글을 자동으로 가져와 SEO,
                AEO, GEO 최적화 초안을 생성하고 점수로 진단합니다. 실제 연동은
                홈페이지 관리자에게 먼저 요청해야 하며, 현재는 그누보드5만
                가능합니다.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contents"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#facc15] px-6 text-sm font-semibold text-[#111827] transition hover:bg-[#fde047]"
                >
                  관리자 화면 보기
                </Link>
                <a
                  href="#guide"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:border-white/70 hover:bg-white/10"
                >
                  연동 안내 보기
                </a>
              </div>
            </div>

            <div className="relative min-h-[430px] rounded-[8px] border border-white/12 bg-white/8 p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs text-white/48">AI optimization</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    SEO / AEO / GEO / JSON-LD
                  </p>
                </div>
                <span className="rounded-full bg-[#34d399] px-3 py-1 text-xs font-semibold text-[#052e16]">
                  관리자 확인 후 반영
                </span>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[8px] bg-[#f8fafc] p-4 text-[#111827]">
                  <p className="text-xs font-semibold text-[#0f766e]">
                    AI 최적화 실행
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    제목, 설명, FAQ, 구조화 데이터 자동 생성
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                    관리자는 초안을 확인하고 실제 게시글에 반영할 문구만
                    선택하면 됩니다.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {aiFeatures.map((feature) => (
                    <div
                      key={feature.label}
                      className="rounded-[8px] bg-white/12 p-4"
                    >
                      <p className="text-2xl font-semibold text-[#5eead4]">
                        {feature.label}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/65">
                        {feature.title}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[8px] border border-white/12 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">
                      AI 검색 최적화 점수
                    </p>
                    <p className="text-xs text-white/48">overall 92</p>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[92%] rounded-full bg-[#facc15]" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/60 sm:grid-cols-3">
                    <span>SEO 90</span>
                    <span>AEO 100</span>
                    <span>GEO 95</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dfded7] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold text-[#0f766e]">
            AI가 만드는 최적화 초안
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal">
            검색엔진, 답변형 AI, 생성형 AI 검색까지 한 번에 대비합니다.
          </h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {aiFeatures.map((feature) => (
              <article
                key={feature.label}
                className="rounded-[8px] border border-[#dfded7] bg-[#fbfbf8] p-6"
              >
                <p className="text-sm font-semibold text-[#0f766e]">
                  {feature.label}
                </p>
                <h3 className="mt-6 text-xl font-semibold leading-7">
                  {feature.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#57534e]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="guide" className="border-b border-[#dfded7] bg-[#f7f7f2]">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold text-[#0f766e]">연동 전 확인</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal">
            사용자는 요청만 하면 됩니다. 실제 연결은 홈페이지 관리자가
            진행합니다.
          </h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[8px] border border-[#dfded7] bg-white p-6"
              >
                <p className="text-sm font-semibold text-[#0f766e]">
                  {step.number}
                </p>
                <h3 className="mt-6 text-xl font-semibold leading-7">
                  {step.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#57534e]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#101820] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold text-[#facc15]">
              7가지 기준으로 진단
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal">
              AI가 만든 문구를 점수와 개선 항목으로 다시 확인합니다.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {scoreItems.map((item) => (
              <div
                key={item}
                className="rounded-[8px] border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-white/80"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold text-[#be123c]">
              그누보드5만 지원
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal">
              워드프레스, 카페24 쇼핑몰, 자체 CMS는 아직 지원하지 않습니다.
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-[#4b5563]">
            <p>
              이 페이지는 방문자가 직접 설치하는 서비스가 아닙니다. 운영 중인
              그누보드5 홈페이지의 관리자 또는 개발 담당자가 연동 코드를 넣어야
              게시판 글이 자동으로 AX SEO Manager에 등록됩니다.
            </p>
            <p>
              연동이 끝나면 관리자는 새 글을 확인하고, AI가 생성한 검색 결과용
              문구와 답변형 검색용 구조화 데이터를 다듬어 실제 게시글에 반영할
              수 있습니다.
            </p>
            <Link
              href="/manual.html"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#101820] px-6 text-sm font-semibold text-white transition hover:bg-[#25313d]"
            >
              기능 매뉴얼 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
