// Turns a WhatsApp number as people type it into E.164 (+2348031234567). Most participants are in
// Nigeria, so an 11-digit number starting with 0 is read as Nigerian. Anyone else includes their
// country code. Returns null if the number can't be read.

const E164 = /^\+[1-9][0-9]{6,14}$/

export function normaliseWhatsApp(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, '')
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`
  if (/^0\d{10}$/.test(digits)) digits = `+234${digits.slice(1)}`
  else if (/^234\d{10}$/.test(digits)) digits = `+${digits}`
  // +234 0803... is a common mix of both forms
  if (/^\+2340\d{10}$/.test(digits)) digits = `+234${digits.slice(5)}`
  return E164.test(digits) ? digits : null
}
