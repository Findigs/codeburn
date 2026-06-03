import { cpSync, mkdirSync } from 'fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts', 'src/cli.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  onSuccess: async () => {
    mkdirSync('dist/data', { recursive: true })
    cpSync('src/data/litellm-pricing.json', 'dist/data/litellm-pricing.json')
  },
})
