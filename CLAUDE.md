# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is CodeBurn

CodeBurn is a CLI + TUI tool that shows where AI coding tokens go — by task, tool, model, MCP server, and project. It reads session data directly from disk (no wrapper, no proxy, no API keys) for Claude Code, Codex, Cursor, cursor-agent, OpenCode, Pi, OMP, and GitHub Copilot. Includes a native macOS menubar app in `mac/`.

## Commands

```bash
npm run build          # tsup → dist/cli.js (ESM, node20 target)
npm run dev            # tsx src/cli.ts (run CLI without building)
npm test               # vitest (watch mode)
npx vitest run         # single test run
npx vitest run tests/models.test.ts              # run one test file
npx vitest run tests/models.test.ts -t "test name"  # run one test by name
```

CI runs a Semgrep check (`.semgrep/rules/no-bracket-assign-hot-paths.yml`) against `src/providers/` and `src/parser.ts` to prevent prototype pollution via bracket-assign on literal objects. Use `Object.create(null)` instead of `{}` for maps with external keys in those paths.

### macOS menubar app (Swift)

```bash
cd mac
swift build            # debug build
swift build -c release # release build
swift test             # run Swift tests
```

Requires macOS 14+ / Swift 6.0+. The app shells out to the `codeburn` CLI for data (`codeburn status --format menubar-json`).

## Architecture

### Data pipeline

```
Provider session files on disk
  → Provider plugin (discover + parse)
    → parser.ts (dedup, date filter, aggregate into ProjectSummary[])
      → day-aggregator.ts (bucket into daily snapshots)
        → daily-cache.ts (file cache at ~/.cache/codeburn/)
          → CLI commands / dashboard.tsx / menubar-json.ts
```

### Provider plugin system

Each provider in `src/providers/` implements the `Provider` interface (`src/providers/types.ts`): session discovery, parsing (JSONL or SQLite), tool name normalization, and model display names. Core providers (Claude, Codex, Copilot, Pi, OMP) load eagerly; SQLite-dependent providers (Cursor, OpenCode, cursor-agent) lazy-load to avoid hard dependency on `better-sqlite3`.

To add a new provider: create a single file in `src/providers/`, implement the `Provider` interface, register in `src/providers/index.ts`.

### Key modules

- **cli.ts** — Commander.js entry point. All subcommands (`report`, `today`, `status`, `export`, `optimize`, `compare`, `menubar`, `model-alias`, `currency`, `plan`). Orchestrates the daily cache pipeline.
- **dashboard.tsx** — Ink (React for terminals) TUI. Responsive panels, keyboard navigation, auto-refresh. Renders data from `ProjectSummary[]`.
- **parser.ts** — JSONL reader for Claude-format sessions. Deduplicates by API message ID, filters by date range, classifies turns, builds `SessionSummary` and `ProjectSummary`.
- **models.ts** — LiteLLM pricing fetch + 24h disk cache. Hardcoded fallbacks for all Claude/GPT models to prevent fuzzy-match mispricing. Supports user-defined model aliases.
- **classifier.ts** — Deterministic 13-category task classifier based on tool usage patterns and user message keywords. No LLM calls.
- **optimize.ts** — Scans sessions and `~/.claude/` setup for waste patterns (repeated file reads, unused MCP servers, bloated CLAUDE.md, etc.). Produces findings with copy-paste fixes.
- **compare.tsx / compare-stats.ts** — Side-by-side model comparison. Computes one-shot rates, retry rates, cost efficiency, working style metrics from session data.
- **day-aggregator.ts / daily-cache.ts** — Aggregates `ProjectSummary[]` into per-day snapshots and caches them. Incremental: only parses new days.
- **menubar-json.ts** — Builds the JSON payload consumed by the native macOS menubar app.
- **config.ts** — Reads/writes `~/.config/codeburn/config.json` (model aliases, currency, plan settings).
- **currency.ts** — Currency conversion via Frankfurter API (ECB rates), 24h cache.
- **sqlite.ts** — Lazy-loads `better-sqlite3`, used by Cursor/OpenCode providers.

### Security constraint

The Semgrep CI rule enforces: in `src/providers/*.ts` and `src/parser.ts`, never do bracket-assign (`map[key] = ...`) on a map created with `{}`. Use `Object.create(null)` to prevent prototype pollution from external session data. A dedicated test suite exists at `tests/security/prototype-pollution.test.ts`.

### TypeScript conventions

- ESM-only (`"type": "module"` in package.json), all imports use `.js` extensions
- JSX uses `react-jsx` transform (no React import needed in TSX files)
- Node 22+ required (engines field), build targets node20
- No `tsconfig` path aliases — all imports are relative
