import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { Cpu } from 'lucide-react';

const links = [
  { to: '/', key: 'nav.home' },
  { to: '/prepare', key: 'nav.prepare' },
  { to: '/interview', key: 'nav.interview' },
  { to: '/report', key: 'nav.report' },
  { to: '/replay', key: 'nav.replay' },
  { to: '/settings', key: 'nav.settings' },
];

export function MainLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg pb-12">
      <nav className="sticky top-4 z-40 mx-4 md:mx-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-border-subtle bg-surface/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-8 shrink-0">
              <NavLink to="/" className="flex items-center gap-2 text-text-primary shrink-0 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle text-accent ring-1 ring-accent/20 group-hover:ring-accent/40 transition">
                  <Cpu size={18} strokeWidth={2} />
                </div>
                <span className="text-base md:text-lg font-bold font-heading tracking-tight">ExpSup</span>
              </NavLink>
              <div className="hidden md:flex gap-1">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-accent bg-accent-subtle'
                          : 'text-text-tertiary hover:text-text-secondary hover:bg-elevated/60'
                      }`
                    }
                  >
                    {t(l.key)}
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
          <div className="mt-2 flex md:hidden gap-1 overflow-x-auto pb-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-accent bg-accent-subtle'
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-elevated/60'
                  }`
                }
              >
                {t(l.key)}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 md:px-6 pt-8 md:pt-12">
        <Outlet />
      </main>
    </div>
  );
}
