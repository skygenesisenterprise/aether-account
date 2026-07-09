import { Sparkles } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

const features = [
  'Frontier reasoning models, tuned for speed',
  'Private by design — your data stays yours',
  'Connect tools, files, and live web search',
]

export function AuthShowcase() {
  return (
    <section className="relative hidden overflow-hidden bg-[#1a1410] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* warm sunset gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(120% 120% at 15% 0%, #ffd800 0%, #ff8205 32%, #fa520f 55%, #7a1f04 78%, #1a1410 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          background:
            'radial-gradient(80% 80% at 90% 90%, #ffaf00 0%, transparent 60%)',
        }}
      />

      <header className="relative z-10 flex items-center gap-3">
        <BrandLogo className="size-9 rounded-md" />
        <span className="text-lg font-semibold tracking-tight text-white">
          Le Chat
        </span>
      </header>

      <div className="relative z-10 max-w-md">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Sparkles className="size-3.5" />
          Now with agentic workflows
        </div>
        <h2 className="text-pretty text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
          Your ideas, amplified by frontier AI.
        </h2>
        <p className="mt-4 text-pretty text-base leading-relaxed text-white/80">
          Sign in to pick up where you left off, or create an account to start
          building with the most capable open models available.
        </p>

        <ul className="mt-8 space-y-3">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-sm text-white/85"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold text-white ring-1 ring-white/30">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <footer className="relative z-10 text-sm text-white/60">
        {'“It feels like a thinking partner, not just a tool.”'}
        <span className="mt-1 block font-medium text-white/80">
          Amélie R. — Product Designer
        </span>
      </footer>
    </section>
  )
}
