import { Hero } from '@/components/Hero'
import { Tool } from '@/components/Tool'
import { StyledToaster } from '@/components/ui/styled-sonner'

export default function App() {
  return (
    <>
      <main>
        <Hero />
        <Tool />
      </main>
      <StyledToaster />
    </>
  )
}
