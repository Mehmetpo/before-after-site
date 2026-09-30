import PanoramicSpreadHero, { type PanoramicCard } from '@/components/ui/panoramic-spread-hero'
import { CompareReveal } from '@/components/ui/compare-reveal'
import { Button } from '@/components/ui/button'
import { SAMPLE_PAIRS, sampleUrl } from '@/lib/samples'

const CARDS: PanoramicCard[] = SAMPLE_PAIRS.map((p) => ({
  key: p.slug,
  caption: p.title,
  content: (
    <CompareReveal
      before={{ src: sampleUrl(p.slug, 'before'), alt: `${p.title} example, ${p.beforeLabel} version (photo: ${p.photographer})` }}
      after={{ src: sampleUrl(p.slug, 'after'), alt: `${p.title} example, ${p.afterLabel} version (photo: ${p.photographer})` }}
      labels={[p.beforeLabel, p.afterLabel]}
      aria-label={`${p.title}: ${p.beforeLabel} versus ${p.afterLabel}`}
      introSweep
      className="aspect-auto h-full rounded-none border-0"
    />
  ),
}))

const scrollToTool = () => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })

export function Hero() {
  return (
    <PanoramicSpreadHero
      cards={CARDS}
      title={
        <>
          See the difference.
          <span className="sr-only"> Free online before and after image slider.</span>
        </>
      }
      description="Compare two images in seconds. Free, private, in your browser."
      action={
        <Button size="lg" onClick={scrollToTool}>
          Try it now
        </Button>
      }
    />
  )
}
