'use client'

import { useState, useRef } from 'react'

interface TooltipProps {
  text: string
  children: React.ReactNode
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-1.5 w-56 rounded-lg border border-line bg-surface px-3 py-2 text-[12px] leading-relaxed text-ink-secondary shadow-md"
          style={{ minWidth: '180px' }}
        >
          {text}
          {/* 말풍선 꼬리 */}
          <span
            className="absolute -bottom-1.5 left-3 h-2.5 w-2.5 rotate-45 border-b border-r border-line bg-surface"
            aria-hidden
          />
        </span>
      )}
    </span>
  )
}