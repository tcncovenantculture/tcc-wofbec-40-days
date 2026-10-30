import { z } from 'zod'
import { Constants, type Enums } from '@/lib/database.types'
import { normaliseWhatsApp } from './phone'

export type Segment = Enums<'segment'>

export const segmentOptions: { value: Segment; label: string; hint: string }[] = [
  { value: 'undergrad', label: 'Undergraduate', hint: 'At university, polytechnic or college' },
  { value: 'early_career', label: 'Early career', hint: 'In your first few years of work' },
  { value: 'experienced_professional', label: 'Experienced professional', hint: 'Well into your career' },
  { value: 'entrepreneur', label: 'Entrepreneur', hint: 'Building your own business' },
]

const email = z.email('Check your email address, something looks off')

export const signupSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Add the name your pod will see')
    .max(40, 'Keep your name to 40 characters or fewer'),
  segment: z.enum(Constants.public.Enums.segment, 'Choose the one that fits you best'),
  email,
  whatsapp_number: z
    .string()
    .trim()
    .refine((value) => value === '' || normaliseWhatsApp(value) !== null, {
      message: 'Include your country code if you’re outside Nigeria, e.g. +44 7700 900123',
    })
    .transform((value) => (value === '' ? null : normaliseWhatsApp(value))),
  privacy: z
    .boolean()
    .refine((ticked) => ticked, 'Please confirm you’ve read how we look after your information'),
  reminder_email: z.boolean(),
})

export type SignupInput = z.input<typeof signupSchema>
export type SignupValues = z.output<typeof signupSchema>

export const signinSchema = z.object({ email })
export type SigninValues = z.output<typeof signinSchema>

export const codeSchema = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from the email')
