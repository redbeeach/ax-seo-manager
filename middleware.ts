// middleware.ts (프로젝트 루트, app 폴더 밖)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 로그인 없이 접근 가능해야 하는 경로들
const PUBLIC_PATHS = [
  '/login',
  '/api/gb5/sync', // 그누보드 write 훅이 호출
  '/api/public/meta', // 그누보드 head.sub.php가 호출
  '/preview', // 검색결과 미리보기는 공개로 둬도 무방하면 유지, 아니면 이 줄 삭제
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // 정적 파일, _next, favicon 등은 미들웨어 검사 제외
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}