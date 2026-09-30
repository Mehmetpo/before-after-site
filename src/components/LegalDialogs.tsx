import { Modal, ModalBody, ModalContent } from '@/components/ui/animated-modal'

export type LegalPage = 'about' | 'terms' | 'privacy'

export const LEGAL_LINKS: { id: LegalPage; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
]

const COPY: Record<LegalPage, { title: string; body: string[] }> = {
  about: {
    title: 'About',
    body: ['Before & After Pro compares two images in your browser. Nothing is uploaded.'],
  },
  terms: {
    title: 'Terms',
    body: ['This tool is provided as is, free of charge. You are responsible for the images you use.'],
  },
  privacy: {
    title: 'Privacy',
    body: [
      'Images are processed locally in your browser and are never sent to a server.',
      'This site sets no tracking cookies.',
      "Your theme choice is stored in your browser's local storage.",
    ],
  },
}

export function LegalDialogs({
  open,
  onOpenChange,
}: {
  open: LegalPage | null
  onOpenChange: (open: LegalPage | null) => void
}) {
  return (
    <>
      {LEGAL_LINKS.map(({ id }) => (
        <Modal key={id} open={open === id} onOpenChange={(o) => onOpenChange(o ? id : null)}>
          <ModalBody aria-labelledby={`legal-${id}-title`}>
            <ModalContent className="gap-4">
              <h2 id={`legal-${id}-title`} className="text-xl font-semibold">
                {COPY[id].title}
              </h2>
              {COPY[id].body.map((p) => (
                <p key={p} className="text-sm leading-6 text-muted-foreground">
                  {p}
                </p>
              ))}
            </ModalContent>
          </ModalBody>
        </Modal>
      ))}
    </>
  )
}
