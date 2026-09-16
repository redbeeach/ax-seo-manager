'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems: { label: string; href: string; external?: boolean }[] = [
  { label: '대시보드', href: '/dashboard' },
  { label: '콘텐츠 목록', href: '/contents' },
  { label: '그누보드 연동', href: '/integrations/gb5' },
  { label: '이미지 최적화', href: '/tools/image' },
]

export default function DashboardLayout({
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
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1720px] items-center justify-between gap-6 px-6">
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-emerald-400 text-[12px] font-black text-black">
                AX
              </span>
              <span className="text-[16px] font-extrabold uppercase tracking-normal text-ink">
                AX SEO Manager
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-[12px] font-bold uppercase transition ${
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
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <a
              href="/manual.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-line bg-white px-4 py-2 text-[12px] font-bold uppercase text-ink-secondary transition hover:border-ink hover:text-ink sm:inline-flex"
            >
              사용 매뉴얼
            </a>
            <button
              onClick={handleLogout}
              className="rounded-full bg-ink px-5 py-2.5 text-[12px] font-bold uppercase text-white transition hover:bg-zinc-700"
            >
              로그아웃
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold ${
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
      </header>

      <main>{children}</main>
    </div>
  )
}
