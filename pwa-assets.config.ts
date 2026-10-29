import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Run `pnpm icons` after replacing public/icon-source.png to regenerate every icon.
// The source is currently cut from a 1080px graphic (scripts/extract-logo.ts), so the 512px icons are
// upscaled. Swap in the original logo file when it arrives.
const cream = '#FBF5EE'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // The source already has a cream margin, so the standard icons need no extra (transparent) padding
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: { background: cream } },
    apple: { ...minimal2023Preset.apple, padding: 0.05, resizeOptions: { background: cream } },
  },
  images: ['public/icon-source.png'],
})
