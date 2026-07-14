interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  href?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-accent text-text-on-accent hover:bg-accent-hover shadow-[0_0_0_1px_rgba(212,168,83,0.2)] hover:shadow-[0_0_24px_rgba(212,168,83,0.25)]',
  secondary: 'bg-elevated text-text-primary hover:bg-elevated/80 border border-border',
  outline: 'border border-border text-text-secondary hover:border-text-tertiary hover:text-text-primary hover:bg-elevated/40',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-elevated/40',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-3',
}

export function Button({ variant = 'primary', children, onClick, className = '', href, disabled, type = 'button', size = 'md' }: ButtonProps) {
  const base = 'rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 text-center disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-not-allowed hover:-translate-y-0.5'
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}
