'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : signInError.message
      )
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto mt-10 max-w-sm bg-surface px-2">
      <p className="mb-2.5 text-sm font-medium text-accent">AX SEO Manager</p>
      <h1 className="mb-7 text-[28px] font-bold tracking-tight text-ink">로그인</h1>

      <div className="mb-6 border-t border-line" />

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-10 w-full rounded border border-line px-3 text-[15px] text-ink outline-none focus:border-accent"
            autoComplete="email"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-10 w-full rounded border border-line px-3 text-[15px] text-ink outline-none focus:border-accent"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="mb-4 text-sm font-medium text-score-bad">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded bg-accent text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-ink-hint">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
          회원가입
        </Link>
      </p>
    </div>
  )
}