# Sample content

Stand-in module files for all 40 days, so the app can be built and tested before the real curriculum
arrives. Every title starts with "Sample:" and the body text says it's a placeholder. Scripture is quoted
from the KJV (public domain).

When a real module arrives, save it as `content/module-N.json`, check it with
`pnpm content:load content/module-N.json --dry-run`, then load it to the same targets. It replaces the
sample days by day number.

Staging loads these with `--publish-now`, so testers can open any day with `?asOf=YYYY-MM-DD`.
