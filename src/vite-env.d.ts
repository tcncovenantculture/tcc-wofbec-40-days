/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string | undefined
  readonly VITE_SUPABASE_ANON_KEY: string | undefined
  /** "true" allows the ?asOf test clock in a production build (staging only). */
  readonly VITE_ENABLE_AS_OF: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
