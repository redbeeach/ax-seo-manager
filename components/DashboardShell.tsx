'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { label: '대시보드', href: '/dashboard' },
  { label: '콘텐츠 목록', href: '/contents' },
  { label: '그누보드 연동', href: '/integrations/gb5' },
  { label: '이미지 최적화', href: '/tools/image' },
  { label: 'GEO 진단', href: '/geo' },
]

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase/client')
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-white/95 px-4 py-5 backdrop-blur-xl">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-emerald-400 text-[12px] font-black text-black">
            AX
          </span>
          <span className="text-[15px] font-extrabold uppercase tracking-normal text-ink">
            AX SEO Manager
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2.5 text-[13px] font-bold transition ${
                  active
                    ? 'bg-ink text-white'
                    : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-line pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-full bg-surface-muted px-3 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-black text-ink shadow-sm">
              윤
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">윤홈비 · Free</p>
              <p className="truncate text-[11px] text-ink-hint">관리자 계정</p>
            </div>
            <span className="text-[13px] text-ink-hint">⌄</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="/manual.html"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line bg-white px-3 py-2 text-center text-[12px] font-bold text-ink-secondary transition hover:border-ink hover:text-ink"
            >
              매뉴얼
            </a>
            <button
              onClick={handleLogout}
              className="rounded-full bg-ink px-3 py-2 text-[12px] font-bold text-white transition hover:bg-zinc-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
