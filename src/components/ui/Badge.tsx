interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent'
  className?: string
}

const variants = {
  primary: 'bg-elevated/70 text-text-secondary border border-border',
  accent: 'bg-accent-subtle text-accent border border-accent/20',
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${variants[variant]} ${className}`}>{children}</span>
}
