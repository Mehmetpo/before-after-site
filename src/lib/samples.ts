export interface SamplePair {
  slug: string
  title: string
  beforeLabel: string
  afterLabel: string
}

export const SAMPLE_PAIRS: SamplePair[] = [
  { slug: 'neworleans', title: 'New Orleans after Katrina', beforeLabel: 'Aug 27, 2005', afterLabel: 'Aug 30, 2005' },
  { slug: 'vegas', title: 'Las Vegas growth', beforeLabel: '1984', afterLabel: '2009' },
  { slug: 'hobet', title: 'Hobet mine', beforeLabel: '2000', afterLabel: '2010' },
  { slug: 'aral', title: 'Aral Sea', beforeLabel: '2000', afterLabel: '2009' },
  { slug: 'dubai', title: 'Dubai', beforeLabel: '2000', afterLabel: '2011' },
  { slug: 'columbia', title: 'Columbia Glacier', beforeLabel: '1986', afterLabel: '2024' },
  { slug: 'powell', title: 'Lake Powell', beforeLabel: '1999', afterLabel: '2021' },
  { slug: 'amazon', title: 'Amazon deforestation', beforeLabel: '2000', afterLabel: '2012' },
]

export const sampleUrl = (slug: string, which: 'before' | 'after') => `/samples/${slug}-${which}.webp`
