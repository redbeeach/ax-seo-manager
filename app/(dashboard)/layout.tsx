'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const navItems = [
  { label: '대시보드', href: '/dashboard' },
  { label: '콘텐츠 목록', href: '/contents' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* 사이드바 */}
      <aside className="w-60 flex-shrink-0 border-r border-line px-5 py-6">
        <p className="mb-8 text-[15px] font-bold text-ink">AX SEO Manager</p>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-surface-muted text-ink'
                    : 'text-ink-secondary hover:bg-surface-muted'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 메인 영역 */}
      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-line px-8 py-3">
          <button
            onClick={handleLogout}
            className="rounded border border-line px-3 py-1.5 text-[13px] font-medium text-ink-secondary hover:bg-surface-muted"
          >
            로그아웃
          </button>
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}