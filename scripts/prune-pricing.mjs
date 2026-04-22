#!/usr/bin/env node
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const raw = JSON.parse(Buffer.concat(chunks).toString())

const pruned = Object.create(null)
for (const [key, val] of Object.entries(raw)) {
  if (key === 'sample_spec') continue
  if (val.input_cost_per_token === undefined || val.output_cost_per_token === undefined) continue
  const entry = {
    input_cost_per_token: val.input_cost_per_token,
    output_cost_per_token: val.output_cost_per_token,
  }
  if (val.cache_creation_input_token_cost !== undefined) entry.cache_creation_input_token_cost = val.cache_creation_input_token_cost
  if (val.cache_read_input_token_cost !== undefined) entry.cache_read_input_token_cost = val.cache_read_input_token_cost
  if (val.provider_specific_entry?.fast !== undefined) entry.provider_specific_entry = { fast: val.provider_specific_entry.fast }
  pruned[key] = entry
}

const thisDir = dirname(fileURLToPath(import.meta.url))
const outPath = join(thisDir, '..', 'src', 'data', 'litellm-pricing.json')
writeFileSync(outPath, JSON.stringify(pruned))
console.log(`Wrote ${Object.keys(pruned).length} models to ${outPath}`)
