export type LegalPage = 'about' | 'terms' | 'privacy'

export const LEGAL_LINKS: { id: LegalPage; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
]
