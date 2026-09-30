import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buildEmbedUrl, buildIframeCode, DEFAULT_EMBED, isSafeImageUrl, MAX_LABEL_LENGTH, SITE_URL } from '@/lib/embed'

const SAMPLE = { a: `${SITE_URL}samples/hdr-before.webp`, b: `${SITE_URL}samples/hdr-after.webp` }

const fieldClass =
  'h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  )
}

export default function EmbedGenerator() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [la, setLa] = useState(DEFAULT_EMBED.la)
  const [lb, setLb] = useState(DEFAULT_EMBED.lb)
  const [pos, setPos] = useState(DEFAULT_EMBED.pos)
  const [fit, setFit] = useState(DEFAULT_EMBED.fit)
  const [intro, setIntro] = useState(DEFAULT_EMBED.intro)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(500)

  const aOk = isSafeImageUrl(a.trim())
  const bOk = isSafeImageUrl(b.trim())
  const ready = aOk && bOk

  const output = useMemo(() => {
    if (!ready) return null
    const config = {
      a: a.trim(),
      b: b.trim(),
      pos,
      la: la.trim() || DEFAULT_EMBED.la,
      lb: lb.trim() || DEFAULT_EMBED.lb,
      fit,
      intro,
    }
    const origin = window.location.origin
    return { src: buildEmbedUrl(origin, config), code: buildIframeCode(origin, config, { width, height }) }
  }, [ready, a, b, pos, la, lb, fit, intro, width, height])

  const copy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output.code)
      toast.success('Embed code copied')
    } catch {
      toast.error('Copy failed. Select the code and copy it manually.')
    }
  }

  const fillSample = () => {
    setA(SAMPLE.a)
    setB(SAMPLE.b)
  }

  return (
    <section id="embed" className="mx-auto flex w-full max-w-5xl scroll-mt-6 flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Embed a before and after slider</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Paste two public image links and copy the iframe code. Your images stay on your own host: nothing is uploaded
          here.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="Before image URL" hint={a && !aOk ? 'Use a public https:// image link.' : undefined}>
            <input
              className={fieldClass}
              type="url"
              inputMode="url"
              placeholder="https://example.com/before.jpg"
              value={a}
              onChange={(e) => setA(e.target.value)}
              aria-invalid={a !== '' && !aOk}
            />
          </Field>
          <Field label="After image URL" hint={b && !bOk ? 'Use a public https:// image link.' : undefined}>
            <input
              className={fieldClass}
              type="url"
              inputMode="url"
              placeholder="https://example.com/after.jpg"
              value={b}
              onChange={(e) => setB(e.target.value)}
              aria-invalid={b !== '' && !bOk}
            />
          </Field>
          <div>
            <Button variant="outline" size="sm" onClick={fillSample}>
              Fill with sample photos
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Before label">
              <input className={fieldClass} maxLength={MAX_LABEL_LENGTH} value={la} onChange={(e) => setLa(e.target.value)} />
            </Field>
            <Field label="After label">
              <input className={fieldClass} maxLength={MAX_LABEL_LENGTH} value={lb} onChange={(e) => setLb(e.target.value)} />
            </Field>
            <Field label="Width (px)">
              <input className={fieldClass} type="number" min={200} max={2000} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            </Field>
            <Field label="Height (px)">
              <input className={fieldClass} type="number" min={120} max={2000} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </Field>
          </div>

          <Field label={`Start position: ${pos}%`}>
            <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="accent-primary" />
          </Field>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <label className="flex items-center gap-2">
              Fit
              <select className={`${fieldClass} w-auto`} value={fit} onChange={(e) => setFit(e.target.value as typeof fit)}>
                <option value="cover">Fill (crop)</option>
                <option value="contain">Contain (no crop)</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={intro} onChange={(e) => setIntro(e.target.checked)} className="size-4 accent-primary" />
              Play intro sweep
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border bg-muted/40" style={{ aspectRatio: `${width} / ${height}`, maxHeight: 420 }}>
            {output ? (
              <iframe key={output.src} src={output.src} title="Embed preview" className="size-full border-0" loading="lazy" />
            ) : (
              <div className="flex size-full min-h-56 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Enter both image URLs to see a live preview.
              </div>
            )}
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Embed code
            <textarea
              readOnly
              rows={5}
              value={output?.code ?? ''}
              placeholder="Your iframe code appears here."
              onFocus={(e) => e.currentTarget.select()}
              className={`${fieldClass} h-auto py-2 font-mono text-xs`}
            />
          </label>
          <div>
            <Button onClick={copy} disabled={!output}>
              Copy embed code
            </Button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            The embed shows a small &ldquo;Made with Before &amp; After Pro&rdquo; link. The image host must allow
            hotlinking, and the embed sends no referrer to it.
          </p>
        </div>
      </div>
    </section>
  )
}
