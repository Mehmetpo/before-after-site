import { useMemo, useState } from 'react'
import { CompareReveal } from '@/components/ui/compare-reveal'
import { parseEmbedParams, SITE_URL, type EmbedConfig } from '@/lib/embed'

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground" role="alert">
      {children}
    </div>
  )
}

// Untrusted URLs only ever reach <img src>; no referrer is sent to the image host.
function Side({ src, alt, fit, onError }: { src: string; alt: string; fit: EmbedConfig['fit']; onError: () => void }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={onError}
      className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
    />
  )
}

export function EmbedApp() {
  const parsed = useMemo(() => parseEmbedParams(window.location.search), [])
  const [failed, setFailed] = useState(false)

  if (!parsed.ok) return <Notice>{parsed.error}</Notice>
  const { a, b, pos, la, lb, fit, intro } = parsed.config
  if (failed) return <Notice>One of the images could not be loaded. Check that both links are public https image URLs.</Notice>

  const fail = () => setFailed(true)
  return (
    <div className="relative h-full">
      <CompareReveal
        before={<Side src={a} alt={la} fit={fit} onError={fail} />}
        after={<Side src={b} alt={lb} fit={fit} onError={fail} />}
        labels={[la, lb]}
        defaultPosition={pos}
        introSweep={intro}
        className="aspect-auto h-full rounded-none border-0"
      />
      <a
        href={SITE_URL}
        target="_blank"
        rel="noopener"
        className="absolute right-2 bottom-2 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        Made with Before &amp; After Pro
      </a>
    </div>
  )
}
