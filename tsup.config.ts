import { cpSync, mkdirSync } from 'fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  onSuccess: async () => {
    mkdirSync('dist/data', { recursive: true })
    cpSync('src/data/litellm-pricing.json', 'dist/data/litellm-pricing.json')
  },
})
