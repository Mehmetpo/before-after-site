import { useState } from 'react'
import { LEGAL_LINKS, LegalDialogs, type LegalPage } from '@/components/LegalDialogs'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'
import { Button } from '@/components/ui/button'
import { RuixenGradientFooter } from '@/components/ui/ruixen-gradient-footer'

export function SiteFooter() {
  const [legal, setLegal] = useState<LegalPage | null>(null)
  const year = new Date().getFullYear()

  return (
    <>
      <RuixenGradientFooter gradientHeight="40vh" className="mt-24">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-12 pb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-semibold tracking-tight">Before &amp; After Pro</p>
            <AnimatedThemeToggle className="h-9" />
          </div>
          <nav aria-label="Legal" className="-ml-3 flex flex-wrap gap-1">
            {LEGAL_LINKS.map(({ id, label }) => (
              <Button key={id} variant="link" size="sm" onClick={() => setLegal(id)}>
                {label}
              </Button>
            ))}
          </nav>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p>Sample imagery: NASA Earth Observatory / USGS Landsat (public domain)</p>
            <p>&copy; {year} Before &amp; After Pro</p>
          </div>
        </div>
      </RuixenGradientFooter>
      <LegalDialogs open={legal} onOpenChange={setLegal} />
    </>
  )
}
