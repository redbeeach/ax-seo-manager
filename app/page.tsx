import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "홈페이지 관리자에게 먼저 요청하세요.",
    description:
      "AX SEO Manager는 운영 중인 홈페이지 안쪽에 작은 연동 코드를 심어야 작동합니다.",
  },
  {
    number: "02",
    title: "현재는 그누보드5만 가능합니다.",
    description:
      "게시판 글 작성, 수정 흐름과 연결해 콘텐츠를 읽고 SEO 관리 화면에 자동으로 모읍니다.",
  },
  {
    number: "03",
    title: "관리자는 이곳에서 문구를 다듬습니다.",
    description:
      "제목, 설명, OG 태그, FAQ, JSON-LD까지 한곳에서 확인하고 반영할 수 있습니다.",
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
            <Link
              href="/contents"
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:border-white/70 hover:bg-white/10"
            >
              관리자 화면
            </Link>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.02fr_.98fr]">
            <div>
              <p className="mb-5 text-sm font-semibold text-[#5eead4]">
                그누보드5 전용 SEO 연동 관리 도구
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-normal sm:text-6xl lg:text-7xl">
                홈페이지 관리자에게 먼저 연동을 부탁하세요.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/78">
                AX SEO Manager는 그누보드5 게시판 글을 자동으로 가져와
                검색엔진과 AI 답변에 쓰일 제목, 설명, 구조화 데이터를 관리하는
                페이지입니다. 현재 연동은 그누보드5에서만 가능합니다.
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

            <div className="relative min-h-[390px] rounded-[8px] border border-white/12 bg-white/8 p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs text-white/48">Live sync</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    gb5 / board.php / write_update.php
                  </p>
                </div>
                <span className="rounded-full bg-[#34d399] px-3 py-1 text-xs font-semibold text-[#052e16]">
                  연결 대기
                </span>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[8px] bg-[#f8fafc] p-4 text-[#111827]">
                  <p className="text-xs font-semibold text-[#0f766e]">
                    새 게시글 감지
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    그누보드5 게시판 글 자동 등록
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                    게시글 제목과 본문을 가져와 SEO 관리 목록에 저장합니다.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[8px] bg-white/12 p-4">
                    <p className="text-2xl font-semibold text-[#5eead4]">SEO</p>
                    <p className="mt-2 text-xs leading-5 text-white/65">
                      title, meta description
                    </p>
                  </div>
                  <div className="rounded-[8px] bg-white/12 p-4">
                    <p className="text-2xl font-semibold text-[#facc15]">AEO</p>
                    <p className="mt-2 text-xs leading-5 text-white/65">
                      FAQ, answer summary
                    </p>
                  </div>
                  <div className="rounded-[8px] bg-white/12 p-4">
                    <p className="text-2xl font-semibold text-[#fb7185]">GEO</p>
                    <p className="mt-2 text-xs leading-5 text-white/65">
                      JSON-LD, AI citation
                    </p>
                  </div>
                </div>

                <div className="rounded-[8px] border border-white/12 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">
                      관리자 확인 후 반영
                    </p>
                    <p className="text-xs text-white/48">manual approval</p>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-3/4 rounded-full bg-[#5eead4]" />
                  </div>
                </div>
              </div>
            </div>
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
              연동이 끝나면 관리자는 새 글을 확인하고, 검색 결과용 문구와 AI
              답변용 구조화 데이터를 다듬어 실제 게시글에 반영할 수 있습니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
