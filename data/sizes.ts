/**
 * Size conversion chart.
 *
 * Shared by the /size-guide page and the modal on product pages, so the two can
 * never drift apart. EU is our master scale — every product is listed in EU
 * sizes and the storefront never displays anything else as the primary size.
 */

export interface SizeRow {
  uk: string
  eu: string
  us: string
  cm: string
}

export const MENS_SIZES: SizeRow[] = [
  { uk: '6', eu: '39', us: '7', cm: '24.5' },
  { uk: '7', eu: '40.5', us: '8', cm: '25.4' },
  { uk: '8', eu: '42', us: '9', cm: '26.2' },
  { uk: '9', eu: '43', us: '10', cm: '27.1' },
  { uk: '10', eu: '44.5', us: '11', cm: '28.0' },
  { uk: '11', eu: '46', us: '12', cm: '28.8' },
]

export const WOMENS_SIZES: SizeRow[] = [
  { uk: '3', eu: '36', us: '5', cm: '22.5' },
  { uk: '4', eu: '37', us: '6', cm: '23.4' },
  { uk: '5', eu: '38', us: '7', cm: '24.1' },
  { uk: '6', eu: '39', us: '8', cm: '25.0' },
  { uk: '7', eu: '40.5', us: '9', cm: '25.9' },
  { uk: '8', eu: '42', us: '10', cm: '26.7' },
]

export const FIT_NOTES = [
  'Between two sizes? Take the larger one — a slightly roomy shoe is far more comfortable than a tight one.',
  'For loafers and formal shoes, stay true to size.',
  'Measure in the evening; feet swell through the day.',
]
