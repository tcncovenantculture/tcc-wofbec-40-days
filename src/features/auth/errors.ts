import { isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js'

// Plain-language messages for the auth errors people actually hit.
export function authErrorMessage(error: unknown): string {
  if (isAuthRetryableFetchError(error)) {
    return 'We couldn’t reach the server. Check your connection and try again.'
  }
  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'otp_expired':
        return 'That code didn’t work. It may have a typo or have expired, so check it or send a new one.'
      case 'otp_disabled':
      case 'signup_disabled':
        return 'We couldn’t find an account for that email. Check the spelling, or join instead.'
      case 'over_email_send_rate_limit':
        return 'We’ve sent a few codes already. Please wait a minute, then try again.'
      case 'over_request_rate_limit':
        return 'Too many tries in a short time. Please wait a minute, then try again.'
      case 'email_address_invalid':
        return 'Check your email address, something looks off.'
    }
  }
  return 'Something went wrong. Please try again.'
}
