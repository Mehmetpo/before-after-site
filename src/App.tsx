import { Analytics } from '@vercel/analytics/react'
import { Hero } from '@/components/Hero'
import { SiteFooter } from '@/components/SiteFooter'
import { Tool } from '@/components/Tool'
import { StyledToaster } from '@/components/ui/styled-sonner'

// No transform/filter on any ancestor of SiteFooter: its gradient band is position: fixed.
export default function App() {
  return (
    <>
      <main>
        <Hero />
        <Tool />
      </main>
      <SiteFooter />
      <StyledToaster />
      <Analytics />
    </>
  )
}
