interface InputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  disabled?: boolean
  rows?: number
  type?: string
  required?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function Input({ value, onChange, placeholder, className = '', multiline, disabled, rows = 1, type = 'text', required, onKeyDown }: InputProps) {
  const base = 'bg-input border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition w-full disabled:opacity-50 disabled:cursor-not-allowed'

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        required={required}
        className={`${base} min-h-[120px] resize-y ${className}`}
      />
    )
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`${base} ${className}`}
    />
  )
}
