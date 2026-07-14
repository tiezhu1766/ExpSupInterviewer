import { useTheme } from '../theme/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { key: 'light', Icon: Sun },
    { key: 'dark', Icon: Moon },
    { key: 'system', Icon: Monitor },
  ] as const;

  return (
    <div className="flex items-center gap-1 rounded-xl bg-elevated p-1 border border-subtle">
      {options.map(({ key, Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          aria-label={key}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
            theme === key
              ? 'bg-accent text-on-accent shadow-sm'
              : 'text-tertiary hover:text-secondary'
          }`}
        >
          <Icon size={15} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
