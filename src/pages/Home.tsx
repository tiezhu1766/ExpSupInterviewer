import { useTranslation } from '../i18n/useTranslation'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { GitBranch, Users, ShieldCheck, Target, History, FileUp, Briefcase, MessageSquareText, BarChart3, Check, X, ArrowRight } from 'lucide-react'

const highlightIcons = [
  { Icon: GitBranch, titleKey: 'home.highlights.behaviorTree.title', descKey: 'home.highlights.behaviorTree.desc' },
  { Icon: Users, titleKey: 'home.highlights.multiAgent.title', descKey: 'home.highlights.multiAgent.desc' },
  { Icon: ShieldCheck, titleKey: 'home.highlights.pydantic.title', descKey: 'home.highlights.pydantic.desc' },
  { Icon: Target, titleKey: 'home.highlights.eas.title', descKey: 'home.highlights.eas.desc' },
  { Icon: History, titleKey: 'home.highlights.replay.title', descKey: 'home.highlights.replay.desc' },
]

const steps = [
  { num: 1, Icon: FileUp, titleKey: 'home.steps.upload.title', descKey: 'home.steps.upload.desc' },
  { num: 2, Icon: Briefcase, titleKey: 'home.steps.jd.title', descKey: 'home.steps.jd.desc' },
  { num: 3, Icon: MessageSquareText, titleKey: 'home.steps.interview.title', descKey: 'home.steps.interview.desc' },
  { num: 4, Icon: BarChart3, titleKey: 'home.steps.report.title', descKey: 'home.steps.report.desc' },
]

const comparisons = [
  { featureKey: 'home.compare.followUpLogic', us: true, them: false },
  { featureKey: 'home.compare.evaluationMethod', us: true, them: false },
  { featureKey: 'home.compare.resumeMatching', us: true, them: false },
  { featureKey: 'home.compare.decisionTransparency', us: true, them: false },
  { featureKey: 'home.compare.multiDimensional', us: true, them: false },
]

export function Home() {
  const { t } = useTranslation()

  const subtitle = t('home.hero.subtitle')
  const subtitleParts = subtitle.includes('WHY')
    ? subtitle.split('WHY')
    : [subtitle, '']

  return (
    <div className="animate-fadeIn">
      <section className="py-16 md:py-28 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <Badge variant="accent">{t('home.hero.badge')}</Badge>
          <h1 className="mt-6 md:mt-8 text-5xl md:text-6xl lg:text-8xl font-bold font-heading tracking-tight text-gradient">
            ExpSupInterviewer
          </h1>
          <p className="mt-4 md:mt-6 text-xl md:text-2xl lg:text-3xl font-medium text-text-secondary">
            {subtitleParts[0]}
            {subtitleParts.length > 1 && <span className="text-gradient-accent">WHY</span>}
            {subtitleParts[1]}
          </p>
          <p className="mx-auto mt-5 md:mt-6 max-w-2xl text-base md:text-lg text-text-tertiary leading-relaxed">
            {t('home.hero.description')}
          </p>
          <div className="mt-10 md:mt-12">
            <Button href="/prepare" variant="primary" className="text-base px-8 py-4">
              {t('home.hero.cta')}
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-heading text-text-primary">{t('home.highlights.title')}</h2>
            <div className="mt-3 mx-auto w-16 h-0.5 bg-accent/30 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {highlightIcons.map(({ Icon, titleKey, descKey }) => (
              <Card key={titleKey}>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent ring-1 ring-accent/20">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary font-heading">{t(titleKey)}</h3>
                    <p className="mt-1.5 text-sm text-text-tertiary leading-relaxed">{t(descKey)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-heading text-text-primary">{t('home.steps.title')}</h2>
            <div className="mt-3 mx-auto w-16 h-0.5 bg-accent/30 rounded-full" />
          </div>
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-0">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-4 md:gap-0">
                <div className="flex flex-col items-center text-center w-full md:w-52 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-elevated border border-border text-accent">
                    <s.Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-accent text-sm font-bold ring-1 ring-accent/20">
                    {s.num}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-text-primary font-heading">{t(s.titleKey)}</h3>
                  <p className="mt-1.5 text-sm text-text-tertiary leading-relaxed">{t(s.descKey)}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center w-12 text-border">
                    <ArrowRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-heading text-text-primary">{t('home.compare.title')}</h2>
            <div className="mt-3 mx-auto w-16 h-0.5 bg-accent/30 rounded-full" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-elevated/40">
                  <th className="py-4 px-5 text-left text-text-tertiary font-semibold text-sm">{t('home.compare.feature')}</th>
                  <th className="py-4 px-5 text-center text-accent font-semibold text-sm">{t('home.compare.us')}</th>
                  <th className="py-4 px-5 text-center text-text-tertiary font-semibold text-sm">{t('home.compare.them')}</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c) => (
                  <tr key={c.featureKey} className="border-b border-border-subtle last:border-0">
                    <td className="py-4 px-5 text-text-secondary text-sm">{t(c.featureKey)}</td>
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-success/10 text-success ring-1 ring-success/20">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-danger/10 text-danger ring-1 ring-danger/20">
                        <X size={14} strokeWidth={3} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl border border-border-subtle bg-surface p-8 md:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
            <h2 className="relative text-2xl md:text-3xl lg:text-4xl font-bold font-heading text-text-primary">
              {t('home.cta.title')}
            </h2>
            <div className="relative mt-8">
              <Button href="/prepare" variant="primary" className="text-base px-8 py-4">
                {t('home.cta.button')}
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
