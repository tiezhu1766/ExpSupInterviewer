interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = true }: CardProps) {
  const base = 'bg-surface border border-border-subtle rounded-2xl p-6 backdrop-blur-sm'
  const hoverCls = hover ? 'hover:border-border hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300' : ''

  return <div className={`${base} ${hoverCls} ${className}`}>{children}</div>
}
