var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/types.ts
var CATEGORY_LABELS;
var init_types = __esm({
  "src/types.ts"() {
    "use strict";
    CATEGORY_LABELS = {
      coding: "Coding",
      debugging: "Debugging",
      feature: "Feature Dev",
      refactoring: "Refactoring",
      testing: "Testing",
      exploration: "Exploration",
      planning: "Planning",
      delegation: "Delegation",
      git: "Git Ops",
      "build/deploy": "Build/Deploy",
      conversation: "Conversation",
      brainstorming: "Brainstorming",
      general: "General"
    };
  }
});

// src/plans.ts
function isPlanProvider(value) {
  return PLAN_PROVIDERS.includes(value);
}
function isPlanId(value) {
  return PLAN_IDS.includes(value);
}
function getPresetPlan(id) {
  if (id in PRESET_PLANS) {
    return PRESET_PLANS[id];
  }
  return null;
}
function planDisplayName(id) {
  switch (id) {
    case "claude-pro":
      return "Claude Pro";
    case "claude-max":
      return "Claude Max 20x";
    case "claude-max-5x":
      return "Claude Max 5x";
    case "cursor-pro":
      return "Cursor Pro";
    case "custom":
      return "Custom";
    case "none":
      return "None";
  }
}
var PLAN_PROVIDERS, PLAN_IDS, PRESET_PLANS;
var init_plans = __esm({
  "src/plans.ts"() {
    "use strict";
    PLAN_PROVIDERS = ["all", "claude", "codex", "cursor"];
    PLAN_IDS = ["claude-pro", "claude-max", "claude-max-5x", "cursor-pro", "custom", "none"];
    PRESET_PLANS = {
      "claude-pro": {
        id: "claude-pro",
        monthlyUsd: 20,
        provider: "claude",
        resetDay: 1
      },
      "claude-max": {
        id: "claude-max",
        monthlyUsd: 200,
        provider: "claude",
        resetDay: 1
      },
      "claude-max-5x": {
        id: "claude-max-5x",
        monthlyUsd: 100,
        provider: "claude",
        resetDay: 1
      },
      "cursor-pro": {
        id: "cursor-pro",
        monthlyUsd: 20,
        provider: "cursor",
        resetDay: 1
      }
    };
  }
});

// src/config.ts
import { readFile as readFile2, writeFile as writeFile2, mkdir as mkdir2, rename as rename2 } from "fs/promises";
import { join as join3 } from "path";
import { homedir as homedir2 } from "os";
import { randomBytes } from "crypto";
function getConfigDir() {
  return join3(homedir2(), ".config", "codeburn");
}
function getConfigPath() {
  return join3(getConfigDir(), "config.json");
}
async function readConfig() {
  try {
    const raw = await readFile2(getConfigPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function saveConfig(config) {
  await mkdir2(getConfigDir(), { recursive: true });
  const configPath = getConfigPath();
  const tmpPath = `${configPath}.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile2(tmpPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  await rename2(tmpPath, configPath);
}
function planFromConfig(provider, plan) {
  if (!plan) return void 0;
  return {
    ...plan,
    provider,
    setAt: plan.setAt ?? ""
  };
}
function normalizePlans(config) {
  const plans = {};
  if (config.plans && Object.keys(config.plans).length > 0) {
    for (const provider of PLAN_PROVIDERS) {
      const plan = planFromConfig(provider, config.plans[provider]);
      if (plan) plans[provider] = plan;
    }
    if (plans.all && PLAN_PROVIDERS.some((provider) => provider !== "all" && plans[provider])) {
      delete plans.all;
    }
    return plans;
  }
  if (config.plan) {
    plans[config.plan.provider] = config.plan;
  }
  return plans;
}
async function readPlans() {
  return normalizePlans(await readConfig());
}
async function savePlan(plan) {
  const config = await readConfig();
  const plans = normalizePlans(config);
  if (plan.provider === "all") {
    config.plans = { all: plan };
  } else {
    delete plans.all;
    plans[plan.provider] = plan;
    config.plans = plans;
  }
  delete config.plan;
  await saveConfig(config);
}
async function clearPlan(provider) {
  const config = await readConfig();
  if (provider) {
    const plans = normalizePlans(config);
    delete plans[provider];
    if (Object.keys(plans).length > 0) {
      config.plans = plans;
    } else {
      delete config.plans;
    }
    delete config.plan;
    await saveConfig(config);
    return;
  }
  delete config.plan;
  delete config.plans;
  await saveConfig(config);
}
function getConfigFilePath() {
  return getConfigPath();
}
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    init_plans();
  }
});

// src/currency.ts
import { readFile as readFile3, writeFile as writeFile3, mkdir as mkdir3 } from "fs/promises";
import { join as join4 } from "path";
import { homedir as homedir3 } from "os";
function isValidRate(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= MIN_VALID_FX_RATE && value <= MAX_VALID_FX_RATE;
}
function isValidCurrencyCode(code) {
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}
function resolveSymbol(code) {
  const parts = new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
    currencyDisplay: "symbol"
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? code;
}
function getFractionDigits(code) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: code
  }).resolvedOptions().maximumFractionDigits ?? 2;
}
function roundForActiveCurrency(value) {
  const code = getCurrency().code;
  const digits = getFractionDigits(code);
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
function getCacheDir() {
  return join4(homedir3(), ".cache", "codeburn");
}
function getRateCachePath() {
  return join4(getCacheDir(), "exchange-rate.json");
}
async function fetchRate(code) {
  const response = await fetch(`${FRANKFURTER_URL}${code}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const rate2 = data.rates?.[code];
  if (!isValidRate(rate2)) throw new Error(`Invalid rate returned for ${code}`);
  return rate2;
}
async function loadCachedRate(code) {
  try {
    const raw = await readFile3(getRateCachePath(), "utf-8");
    const cached = JSON.parse(raw);
    if (typeof cached.code !== "string" || cached.code !== code) return null;
    if (typeof cached.timestamp !== "number" || !Number.isFinite(cached.timestamp)) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    if (!isValidRate(cached.rate)) return null;
    return cached.rate;
  } catch {
    return null;
  }
}
async function cacheRate(code, rate2) {
  await mkdir3(getCacheDir(), { recursive: true });
  await writeFile3(getRateCachePath(), JSON.stringify({ timestamp: Date.now(), code, rate: rate2 }));
}
async function getExchangeRate(code) {
  if (code === "USD") return 1;
  const cached = await loadCachedRate(code);
  if (cached) return cached;
  let rate2;
  try {
    rate2 = await fetchRate(code);
  } catch {
    return 1;
  }
  cacheRate(code, rate2).catch(() => {
  });
  return rate2;
}
async function loadCurrency() {
  const config = await readConfig();
  if (!config.currency) return;
  const code = config.currency.code.toUpperCase();
  const rate2 = await getExchangeRate(code);
  const symbol = config.currency.symbol ?? resolveSymbol(code);
  active = { code, rate: rate2, symbol };
}
function getCurrency() {
  return active;
}
function convertCost(costUSD) {
  return costUSD * active.rate;
}
function formatCost(costUSD) {
  const { rate: rate2, symbol, code } = active;
  const cost = costUSD * rate2;
  const digits = getFractionDigits(code);
  if (digits === 0) return `${symbol}${Math.round(cost)}`;
  if (cost >= 1) return `${symbol}${cost.toFixed(2)}`;
  if (cost >= 0.01) return `${symbol}${cost.toFixed(3)}`;
  if (cost >= 1e-4) return `${symbol}${cost.toFixed(4)}`;
  return `${symbol}${cost.toFixed(2)}`;
}
var CACHE_TTL_MS, FRANKFURTER_URL, MIN_VALID_FX_RATE, MAX_VALID_FX_RATE, active;
var init_currency = __esm({
  "src/currency.ts"() {
    "use strict";
    init_config();
    CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
    FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD&to=";
    MIN_VALID_FX_RATE = 1e-4;
    MAX_VALID_FX_RATE = 1e6;
    active = { code: "USD", rate: 1, symbol: "$" };
  }
});

// src/data/litellm-snapshot.json
var litellm_snapshot_default;
var init_litellm_snapshot = __esm({
  "src/data/litellm-snapshot.json"() {
    litellm_snapshot_default = { "ai21.j2-mid-v1": [125e-7, 125e-7, null, null, null], "ai21.j2-ultra-v1": [188e-7, 188e-7, null, null, null], "ai21.jamba-1-5-large-v1:0": [2e-6, 8e-6, null, null, null], "ai21.jamba-1-5-mini-v1:0": [2e-7, 4e-7, null, null, null], "ai21.jamba-instruct-v1:0": [5e-7, 7e-7, null, null, null], "us.writer.palmyra-x4-v1:0": [25e-7, 1e-5, null, null, null], "us.writer.palmyra-x5-v1:0": [6e-7, 6e-6, null, null, null], "writer.palmyra-x4-v1:0": [25e-7, 1e-5, null, null, null], "writer.palmyra-x5-v1:0": [6e-7, 6e-6, null, null, null], "amazon.nova-lite-v1:0": [6e-8, 24e-8, null, null, null], "amazon.nova-2-lite-v1:0": [3e-7, 25e-7, null, 75e-9, null], "amazon.nova-2-pro-preview-20251202-v1:0": [21875e-10, 175e-7, null, 546875e-12, null], "apac.amazon.nova-2-lite-v1:0": [33e-8, 275e-8, null, 825e-10, null], "apac.amazon.nova-2-pro-preview-20251202-v1:0": [21875e-10, 175e-7, null, 546875e-12, null], "eu.amazon.nova-2-lite-v1:0": [33e-8, 275e-8, null, 825e-10, null], "eu.amazon.nova-2-pro-preview-20251202-v1:0": [21875e-10, 175e-7, null, 546875e-12, null], "us.amazon.nova-2-lite-v1:0": [33e-8, 275e-8, null, 825e-10, null], "us.amazon.nova-2-pro-preview-20251202-v1:0": [21875e-10, 175e-7, null, 546875e-12, null], "amazon.nova-2-multimodal-embeddings-v1:0": [135e-9, 0, null, null, null], "amazon.nova-micro-v1:0": [35e-9, 14e-8, null, null, null], "amazon.nova-pro-v1:0": [8e-7, 32e-7, null, null, null], "amazon.rerank-v1:0": [0, 0, null, null, null], "amazon.titan-embed-image-v1": [8e-7, 0, null, null, null], "amazon.titan-embed-text-v1": [1e-7, 0, null, null, null], "amazon.titan-embed-text-v2:0": [2e-7, 0, null, null, null], "twelvelabs.marengo-embed-2-7-v1:0": [7e-5, 0, null, null, null], "us.twelvelabs.marengo-embed-2-7-v1:0": [7e-5, 0, null, null, null], "eu.twelvelabs.marengo-embed-2-7-v1:0": [7e-5, 0, null, null, null], "amazon.titan-text-express-v1": [13e-7, 17e-7, null, null, null], "amazon.titan-text-lite-v1": [3e-7, 4e-7, null, null, null], "amazon.titan-text-premier-v1:0": [5e-7, 15e-7, null, null, null], "anthropic.claude-3-5-haiku-20241022-v1:0": [8e-7, 4e-6, 1e-6, 8e-8, null], "anthropic.claude-haiku-4-5-20251001-v1:0": [1e-6, 5e-6, 125e-8, 1e-7, null], "anthropic.claude-haiku-4-5@20251001": [1e-6, 5e-6, 125e-8, 1e-7, null], "anthropic.claude-3-5-sonnet-20240620-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic.claude-3-5-sonnet-20241022-v2:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic.claude-3-7-sonnet-20240620-v1:0": [36e-7, 18e-6, 45e-7, 36e-8, null], "anthropic.claude-3-7-sonnet-20250219-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic.claude-3-haiku-20240307-v1:0": [25e-8, 125e-8, 3125e-10, 25e-9, null], "anthropic.claude-3-opus-20240229-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "anthropic.claude-3-sonnet-20240229-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic.claude-instant-v1": [8e-7, 24e-7, null, null, null], "anthropic.claude-opus-4-1-20250805-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "anthropic.claude-opus-4-20250514-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "anthropic.claude-opus-4-5-20251101-v1:0": [5e-6, 25e-6, 625e-8, 5e-7, null], "anthropic.claude-opus-4-6-v1": [5e-6, 25e-6, 625e-8, 5e-7, null], "global.anthropic.claude-opus-4-6-v1": [5e-6, 25e-6, 625e-8, 5e-7, null], "us.anthropic.claude-opus-4-6-v1": [55e-7, 275e-7, 6875e-9, 55e-8, null], "eu.anthropic.claude-opus-4-6-v1": [55e-7, 275e-7, 6875e-9, 55e-8, null], "au.anthropic.claude-opus-4-6-v1": [55e-7, 275e-7, 6875e-9, 55e-8, null], "anthropic.claude-opus-4-7": [5e-6, 25e-6, 625e-8, 5e-7, null], "anthropic.claude-mythos-preview": [0, 0, null, null, null], "global.anthropic.claude-opus-4-7": [5e-6, 25e-6, 625e-8, 5e-7, null], "us.anthropic.claude-opus-4-7": [55e-7, 275e-7, 6875e-9, 55e-8, null], "eu.anthropic.claude-opus-4-7": [55e-7, 275e-7, 6875e-9, 55e-8, null], "au.anthropic.claude-opus-4-7": [55e-7, 275e-7, 6875e-9, 55e-8, null], "anthropic.claude-opus-4-8": [5e-6, 25e-6, 625e-8, 5e-7, null], "global.anthropic.claude-opus-4-8": [5e-6, 25e-6, 625e-8, 5e-7, null], "us.anthropic.claude-opus-4-8": [55e-7, 275e-7, 6875e-9, 55e-8, null], "eu.anthropic.claude-opus-4-8": [55e-7, 275e-7, 6875e-9, 55e-8, null], "au.anthropic.claude-opus-4-8": [55e-7, 275e-7, 6875e-9, 55e-8, null], "anthropic.claude-sonnet-4-6": [3e-6, 15e-6, 375e-8, 3e-7, null], "global.anthropic.claude-sonnet-4-6": [3e-6, 15e-6, 375e-8, 3e-7, null], "us.anthropic.claude-sonnet-4-6": [33e-7, 165e-7, 4125e-9, 33e-8, null], "eu.anthropic.claude-sonnet-4-6": [33e-7, 165e-7, 4125e-9, 33e-8, null], "au.anthropic.claude-sonnet-4-6": [33e-7, 165e-7, 4125e-9, 33e-8, null], "jp.anthropic.claude-sonnet-4-6": [33e-7, 165e-7, 4125e-9, 33e-8, null], "anthropic.claude-sonnet-4-20250514-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic.claude-sonnet-4-5-20250929-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "apac.amazon.nova-lite-v1:0": [63e-9, 252e-9, null, null, null], "apac.amazon.nova-micro-v1:0": [37e-9, 148e-9, null, null, null], "apac.amazon.nova-pro-v1:0": [84e-8, 336e-8, null, null, null], "apac.anthropic.claude-3-5-sonnet-20240620-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "apac.anthropic.claude-3-5-sonnet-20241022-v2:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "apac.anthropic.claude-3-haiku-20240307-v1:0": [25e-8, 125e-8, 3125e-10, 25e-9, null], "apac.anthropic.claude-haiku-4-5-20251001-v1:0": [11e-7, 55e-7, 1375e-9, 11e-8, null], "apac.anthropic.claude-3-sonnet-20240229-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "apac.anthropic.claude-sonnet-4-20250514-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "au.anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "babbage-002": [4e-7, 4e-7, null, null, null], chatdolphin: [5e-7, 5e-7, null, null, null], "chatgpt-4o-latest": [5e-6, 15e-6, null, null, null], "gpt-4o-transcribe-diarize": [25e-7, 1e-5, null, null, null], "claude-haiku-4-5-20251001": [1e-6, 5e-6, 125e-8, 1e-7, null], "claude-haiku-4-5": [1e-6, 5e-6, 125e-8, 1e-7, null], "claude-3-7-sonnet-20250219": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-3-haiku-20240307": [25e-8, 125e-8, 3e-7, 3e-8, null], "claude-3-opus-20240229": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-4-opus-20250514": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-4-sonnet-20250514": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4-5": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4-5-20250929": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4-6": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4-5-20250929-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-opus-4-1": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-opus-4-1-20250805": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-opus-4-20250514": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-opus-4-5-20251101": [5e-6, 25e-6, 625e-8, 5e-7, null], "claude-opus-4-5": [5e-6, 25e-6, 625e-8, 5e-7, null], "claude-opus-4-6": [5e-6, 25e-6, 625e-8, 5e-7, 6], "claude-opus-4-6-20260205": [5e-6, 25e-6, 625e-8, 5e-7, 6], "claude-opus-4-7": [5e-6, 25e-6, 625e-8, 5e-7, 6], "claude-opus-4-7-20260416": [5e-6, 25e-6, 625e-8, 5e-7, 6], "claude-opus-4-8": [5e-6, 25e-6, 625e-8, 5e-7, 2], "claude-sonnet-4-20250514": [3e-6, 15e-6, 375e-8, 3e-7, null], "codex-mini-latest": [15e-7, 6e-6, null, 375e-9, null], "cohere.command-light-text-v14": [3e-7, 6e-7, null, null, null], "cohere.command-r-plus-v1:0": [3e-6, 15e-6, null, null, null], "cohere.command-r-v1:0": [5e-7, 15e-7, null, null, null], "cohere.command-text-v14": [15e-7, 2e-6, null, null, null], "cohere.embed-english-v3": [1e-7, 0, null, null, null], "cohere.embed-multilingual-v3": [1e-7, 0, null, null, null], "cohere.embed-v4:0": [12e-8, 0, null, null, null], "cohere.rerank-v3-5:0": [0, 0, null, null, null], command: [1e-6, 2e-6, null, null, null], "command-a-03-2025": [25e-7, 1e-5, null, null, null], "command-light": [3e-7, 6e-7, null, null, null], "command-nightly": [1e-6, 2e-6, null, null, null], "command-r": [15e-8, 6e-7, null, null, null], "command-r-08-2024": [15e-8, 6e-7, null, null, null], "command-r-plus": [25e-7, 1e-5, null, null, null], "command-r-plus-08-2024": [25e-7, 1e-5, null, null, null], "command-r7b-12-2024": [15e-8, 375e-10, null, null, null], "computer-use-preview": [3e-6, 12e-6, null, null, null], "deepseek-chat": [28e-8, 42e-8, null, 28e-9, null], "deepseek-reasoner": [28e-8, 42e-8, null, 28e-9, null], "davinci-002": [2e-6, 2e-6, null, null, null], "deepseek.v3-v1:0": [58e-8, 168e-8, null, null, null], "deepseek.v3.2": [62e-8, 185e-8, null, null, null], dolphin: [5e-7, 5e-7, null, null, null], "deepseek-v3-2-251201": [0, 0, null, null, null], "glm-4-7-251222": [0, 0, null, null, null], "kimi-k2-thinking-251104": [0, 0, null, null, null], "doubao-embedding": [0, 0, null, null, null], "doubao-embedding-large": [0, 0, null, null, null], "doubao-embedding-large-text-240915": [0, 0, null, null, null], "doubao-embedding-large-text-250515": [0, 0, null, null, null], "doubao-embedding-text-240715": [0, 0, null, null, null], "embed-english-light-v2.0": [1e-7, 0, null, null, null], "embed-english-light-v3.0": [1e-7, 0, null, null, null], "embed-english-v2.0": [1e-7, 0, null, null, null], "embed-english-v3.0": [1e-7, 0, null, null, null], "embed-multilingual-v2.0": [1e-7, 0, null, null, null], "embed-multilingual-v3.0": [1e-7, 0, null, null, null], "embed-multilingual-light-v3.0": [1e-4, 0, null, null, null], "eu.amazon.nova-lite-v1:0": [78e-9, 312e-9, null, null, null], "eu.amazon.nova-micro-v1:0": [46e-9, 184e-9, null, null, null], "eu.amazon.nova-pro-v1:0": [105e-8, 42e-7, null, null, null], "eu.anthropic.claude-3-5-haiku-20241022-v1:0": [25e-8, 125e-8, 3125e-10, 25e-9, null], "eu.anthropic.claude-haiku-4-5-20251001-v1:0": [11e-7, 55e-7, 1375e-9, 11e-8, null], "eu.anthropic.claude-3-5-sonnet-20240620-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "eu.anthropic.claude-3-5-sonnet-20241022-v2:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "eu.anthropic.claude-3-7-sonnet-20250219-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "eu.anthropic.claude-3-haiku-20240307-v1:0": [25e-8, 125e-8, 3125e-10, 25e-9, null], "eu.anthropic.claude-3-opus-20240229-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "eu.anthropic.claude-3-sonnet-20240229-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "eu.anthropic.claude-opus-4-1-20250805-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "eu.anthropic.claude-opus-4-20250514-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "eu.anthropic.claude-sonnet-4-20250514-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "eu.anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "eu.meta.llama3-2-1b-instruct-v1:0": [13e-8, 13e-8, null, null, null], "eu.meta.llama3-2-3b-instruct-v1:0": [19e-8, 19e-8, null, null, null], "eu.mistral.pixtral-large-2502-v1:0": [2e-6, 6e-6, null, null, null], "fireworks-ai-4.1b-to-16b": [2e-7, 2e-7, null, null, null], "fireworks-ai-56b-to-176b": [12e-7, 12e-7, null, null, null], "fireworks-ai-above-16b": [9e-7, 9e-7, null, null, null], "fireworks-ai-default": [0, 0, null, null, null], "fireworks-ai-embedding-150m-to-350m": [16e-9, 0, null, null, null], "fireworks-ai-embedding-up-to-150m": [8e-9, 0, null, null, null], "fireworks-ai-moe-up-to-56b": [5e-7, 5e-7, null, null, null], "fireworks-ai-up-to-4b": [2e-7, 2e-7, null, null, null], "ft:babbage-002": [16e-7, 16e-7, null, null, null], "ft:davinci-002": [12e-6, 12e-6, null, null, null], "ft:gpt-3.5-turbo": [3e-6, 6e-6, null, null, null], "ft:gpt-3.5-turbo-0125": [3e-6, 6e-6, null, null, null], "ft:gpt-3.5-turbo-0613": [3e-6, 6e-6, null, null, null], "ft:gpt-3.5-turbo-1106": [3e-6, 6e-6, null, null, null], "ft:gpt-4-0613": [3e-5, 6e-5, null, null, null], "ft:gpt-4o-2024-08-06": [375e-8, 15e-6, null, 1875e-9, null], "ft:gpt-4o-2024-11-20": [375e-8, 15e-6, 1875e-9, null, null], "ft:gpt-4o-mini-2024-07-18": [3e-7, 12e-7, null, 15e-8, null], "ft:gpt-4.1-2025-04-14": [3e-6, 12e-6, null, 75e-8, null], "ft:gpt-4.1-mini-2025-04-14": [8e-7, 32e-7, null, 2e-7, null], "ft:gpt-4.1-nano-2025-04-14": [2e-7, 8e-7, null, 5e-8, null], "ft:o4-mini-2025-04-16": [4e-6, 16e-6, null, 1e-6, null], "gemini-2.0-flash": [1e-7, 4e-7, null, 25e-9, null], "gemini-2.0-flash-001": [15e-8, 6e-7, null, 375e-10, null], "gemini-2.0-flash-lite": [75e-9, 3e-7, null, 1875e-11, null], "gemini-2.0-flash-lite-001": [75e-9, 3e-7, null, 1875e-11, null], "gemini-2.5-flash": [3e-7, 25e-7, null, 3e-8, null], "gemini-2.5-flash-image": [3e-7, 25e-7, null, 3e-8, null], "gemini-3-pro-image-preview": [2e-6, 12e-6, null, null, null], "gemini-3.1-flash-image-preview": [5e-7, 3e-6, null, null, null], "gemini-3.1-flash-lite-preview": [25e-8, 15e-7, null, 25e-9, null], "gemini-3.1-flash-lite": [25e-8, 15e-7, null, 25e-9, null], "deep-research-pro-preview-12-2025": [2e-6, 12e-6, null, null, null], "gemini-2.5-flash-lite": [1e-7, 4e-7, null, 1e-8, null], "gemini-2.5-flash-lite-preview-09-2025": [1e-7, 4e-7, null, 1e-8, null], "gemini-2.5-flash-preview-09-2025": [3e-7, 25e-7, null, 75e-9, null], "gemini-live-2.5-flash-preview-native-audio-09-2025": [3e-7, 2e-6, null, 75e-9, null], "gemini-2.5-flash-lite-preview-06-17": [1e-7, 4e-7, null, 25e-9, null], "gemini-2.5-pro": [125e-8, 1e-5, null, 125e-9, null], "gemini-3-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "gemini-3.1-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "gemini-3.1-pro-preview-customtools": [2e-6, 12e-6, null, 2e-7, null], "gemini-2.5-pro-preview-tts": [125e-8, 1e-5, null, 125e-9, null], "gemini-robotics-er-1.5-preview": [3e-7, 25e-7, null, 0, null], "gemini-2.5-computer-use-preview-10-2025": [125e-8, 1e-5, null, null, null], "gemini-embedding-001": [15e-8, 0, null, null, null], "gemini-embedding-2-preview": [2e-7, 0, null, null, null], "gemini-embedding-2": [2e-7, 0, null, null, null], "gemini-flash-experimental": [0, 0, null, null, null], "gemini-3-flash-preview": [5e-7, 3e-6, null, 5e-8, null], "gemini-3.5-flash": [15e-7, 9e-6, null, 15e-8, null], "google.gemma-3-12b-it": [9e-8, 29e-8, null, null, null], "google.gemma-3-27b-it": [23e-8, 38e-8, null, null, null], "google.gemma-3-4b-it": [4e-8, 8e-8, null, null, null], "global.anthropic.claude-sonnet-4-5-20250929-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "global.anthropic.claude-sonnet-4-20250514-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "global.anthropic.claude-haiku-4-5-20251001-v1:0": [1e-6, 5e-6, 125e-8, 1e-7, null], "global.amazon.nova-2-lite-v1:0": [3e-7, 25e-7, null, 75e-9, null], "gpt-3.5-turbo": [5e-7, 15e-7, null, null, null], "gpt-3.5-turbo-0125": [5e-7, 15e-7, null, null, null], "gpt-3.5-turbo-1106": [1e-6, 2e-6, null, null, null], "gpt-3.5-turbo-16k": [3e-6, 4e-6, null, null, null], "gpt-3.5-turbo-instruct": [15e-7, 2e-6, null, null, null], "gpt-3.5-turbo-instruct-0914": [15e-7, 2e-6, null, null, null], "gpt-4": [3e-5, 6e-5, null, null, null], "gpt-4-0125-preview": [1e-5, 3e-5, null, null, null], "gpt-4-0314": [3e-5, 6e-5, null, null, null], "gpt-4-0613": [3e-5, 6e-5, null, null, null], "gpt-4-1106-preview": [1e-5, 3e-5, null, null, null], "gpt-4-turbo": [1e-5, 3e-5, null, null, null], "gpt-4-turbo-2024-04-09": [1e-5, 3e-5, null, null, null], "gpt-4-turbo-preview": [1e-5, 3e-5, null, null, null], "gpt-4.1": [2e-6, 8e-6, null, 5e-7, null], "gpt-4.1-2025-04-14": [2e-6, 8e-6, null, 5e-7, null], "gpt-4.1-mini": [4e-7, 16e-7, null, 1e-7, null], "gpt-4.1-mini-2025-04-14": [4e-7, 16e-7, null, 1e-7, null], "gpt-4.1-nano": [1e-7, 4e-7, null, 25e-9, null], "gpt-4.1-nano-2025-04-14": [1e-7, 4e-7, null, 25e-9, null], "gpt-4o": [25e-7, 1e-5, null, 125e-8, null], "gpt-4o-2024-05-13": [5e-6, 15e-6, null, null, null], "gpt-4o-2024-08-06": [25e-7, 1e-5, null, 125e-8, null], "gpt-4o-2024-11-20": [25e-7, 1e-5, null, 125e-8, null], "gpt-4o-audio-preview": [25e-7, 1e-5, null, null, null], "gpt-4o-audio-preview-2024-12-17": [25e-7, 1e-5, null, null, null], "gpt-4o-audio-preview-2025-06-03": [25e-7, 1e-5, null, null, null], "gpt-audio": [25e-7, 1e-5, null, null, null], "gpt-audio-1.5": [25e-7, 1e-5, null, null, null], "gpt-audio-2025-08-28": [25e-7, 1e-5, null, null, null], "gpt-audio-mini": [6e-7, 24e-7, null, null, null], "gpt-audio-mini-2025-10-06": [6e-7, 24e-7, null, null, null], "gpt-audio-mini-2025-12-15": [6e-7, 24e-7, null, null, null], "gpt-4o-mini": [15e-8, 6e-7, null, 75e-9, null], "gpt-4o-mini-2024-07-18": [15e-8, 6e-7, null, 75e-9, null], "gpt-4o-mini-audio-preview": [15e-8, 6e-7, null, null, null], "gpt-4o-mini-audio-preview-2024-12-17": [15e-8, 6e-7, null, null, null], "gpt-4o-mini-realtime-preview": [6e-7, 24e-7, null, 3e-7, null], "gpt-4o-mini-realtime-preview-2024-12-17": [6e-7, 24e-7, null, 3e-7, null], "gpt-4o-mini-search-preview": [15e-8, 6e-7, null, 75e-9, null], "gpt-4o-mini-search-preview-2025-03-11": [15e-8, 6e-7, null, 75e-9, null], "gpt-4o-mini-transcribe": [125e-8, 5e-6, null, null, null], "gpt-4o-mini-tts": [25e-7, 1e-5, null, null, null], "gpt-4o-realtime-preview": [5e-6, 2e-5, null, 25e-7, null], "gpt-4o-realtime-preview-2024-12-17": [5e-6, 2e-5, null, 25e-7, null], "gpt-4o-realtime-preview-2025-06-03": [5e-6, 2e-5, null, 25e-7, null], "gpt-4o-search-preview": [25e-7, 1e-5, null, 125e-8, null], "gpt-4o-search-preview-2025-03-11": [25e-7, 1e-5, null, 125e-8, null], "gpt-4o-transcribe": [25e-7, 1e-5, null, null, null], "gpt-image-1.5": [5e-6, 1e-5, null, 125e-8, null], "gpt-image-1.5-2025-12-16": [5e-6, 1e-5, null, 125e-8, null], "gpt-image-2": [5e-6, 1e-5, null, 125e-8, null], "gpt-image-2-2026-04-21": [5e-6, 1e-5, null, 125e-8, null], "gpt-5": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-2025-11-13": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-chat-latest": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.2": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.2-2025-12-11": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.2-chat-latest": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.3-chat-latest": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.2-pro": [21e-6, 168e-6, null, null, null], "gpt-5.2-pro-2025-12-11": [21e-6, 168e-6, null, null, null], "gpt-5.5": [5e-6, 3e-5, null, 5e-7, null], "gpt-5.5-2026-04-23": [5e-6, 3e-5, null, 5e-7, null], "gpt-5.5-pro": [3e-5, 18e-5, null, 3e-6, null], "gpt-5.5-pro-2026-04-23": [3e-5, 18e-5, null, 3e-6, null], "gpt-5.4": [25e-7, 15e-6, null, 25e-8, null], "gpt-5.4-2026-03-05": [25e-7, 15e-6, null, 25e-8, null], "gpt-5.4-pro": [3e-5, 18e-5, null, 3e-6, null], "gpt-5.4-pro-2026-03-05": [3e-5, 18e-5, null, 3e-6, null], "gpt-5.4-mini": [75e-8, 45e-7, null, 75e-9, null], "gpt-5.4-mini-2026-03-17": [75e-8, 45e-7, null, 75e-9, null], "gpt-5.4-nano": [2e-7, 125e-8, null, 2e-8, null], "gpt-5.4-nano-2026-03-17": [2e-7, 125e-8, null, 2e-8, null], "gpt-5-pro": [15e-6, 12e-5, null, null, null], "gpt-5-pro-2025-10-06": [15e-6, 12e-5, null, null, null], "gpt-5-2025-08-07": [125e-8, 1e-5, null, 125e-9, null], "gpt-5-chat": [125e-8, 1e-5, null, 125e-9, null], "gpt-5-chat-latest": [125e-8, 1e-5, null, 125e-9, null], "gpt-5-codex": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-codex": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-codex-max": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-codex-mini": [25e-8, 2e-6, null, 25e-9, null], "gpt-5.2-codex": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.3-codex": [175e-8, 14e-6, null, 175e-9, null], "gpt-5-mini": [25e-8, 2e-6, null, 25e-9, null], "gpt-5-mini-2025-08-07": [25e-8, 2e-6, null, 25e-9, null], "gpt-5-nano": [5e-8, 4e-7, null, 5e-9, null], "gpt-5-nano-2025-08-07": [5e-8, 4e-7, null, 5e-9, null], "gpt-realtime": [4e-6, 16e-6, null, 4e-7, null], "gpt-realtime-1.5": [4e-6, 16e-6, null, 4e-7, null], "gpt-realtime-2": [4e-6, 16e-6, null, 4e-7, null], "gpt-realtime-mini": [6e-7, 24e-7, null, null, null], "gpt-realtime-2025-08-28": [4e-6, 16e-6, null, 4e-7, null], "j2-light": [3e-6, 3e-6, null, null, null], "j2-mid": [1e-5, 1e-5, null, null, null], "j2-ultra": [15e-6, 15e-6, null, null, null], "jamba-1.5": [2e-7, 4e-7, null, null, null], "jamba-1.5-large": [2e-6, 8e-6, null, null, null], "jamba-1.5-large@001": [2e-6, 8e-6, null, null, null], "jamba-1.5-mini": [2e-7, 4e-7, null, null, null], "jamba-1.5-mini@001": [2e-7, 4e-7, null, null, null], "jamba-large-1.6": [2e-6, 8e-6, null, null, null], "jamba-large-1.7": [2e-6, 8e-6, null, null, null], "jamba-mini-1.6": [2e-7, 4e-7, null, null, null], "jamba-mini-1.7": [2e-7, 4e-7, null, null, null], "jina-reranker-v2-base-multilingual": [18e-9, 18e-9, null, null, null], "jp.anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "jp.anthropic.claude-haiku-4-5-20251001-v1:0": [11e-7, 55e-7, 1375e-9, 11e-8, null], "meta.llama2-13b-chat-v1": [75e-8, 1e-6, null, null, null], "meta.llama2-70b-chat-v1": [195e-8, 256e-8, null, null, null], "meta.llama3-1-405b-instruct-v1:0": [532e-8, 16e-6, null, null, null], "meta.llama3-1-70b-instruct-v1:0": [99e-8, 99e-8, null, null, null], "meta.llama3-1-8b-instruct-v1:0": [22e-8, 22e-8, null, null, null], "meta.llama3-2-11b-instruct-v1:0": [35e-8, 35e-8, null, null, null], "meta.llama3-2-1b-instruct-v1:0": [1e-7, 1e-7, null, null, null], "meta.llama3-2-3b-instruct-v1:0": [15e-8, 15e-8, null, null, null], "meta.llama3-2-90b-instruct-v1:0": [2e-6, 2e-6, null, null, null], "meta.llama3-3-70b-instruct-v1:0": [72e-8, 72e-8, null, null, null], "meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "meta.llama3-8b-instruct-v1:0": [3e-7, 6e-7, null, null, null], "meta.llama4-maverick-17b-instruct-v1:0": [24e-8, 97e-8, null, null, null], "meta.llama4-scout-17b-instruct-v1:0": [17e-8, 66e-8, null, null, null], "minimax.minimax-m2": [3e-7, 12e-7, null, null, null], "minimax.minimax-m2.1": [3e-7, 12e-7, null, null, null], "minimax.minimax-m2.5": [3e-7, 12e-7, null, null, null], "mistral.devstral-2-123b": [4e-7, 2e-6, null, null, null], "mistral.magistral-small-2509": [5e-7, 15e-7, null, null, null], "mistral.ministral-3-14b-instruct": [2e-7, 2e-7, null, null, null], "mistral.ministral-3-3b-instruct": [1e-7, 1e-7, null, null, null], "mistral.ministral-3-8b-instruct": [15e-8, 15e-8, null, null, null], "mistral.mistral-7b-instruct-v0:2": [15e-8, 2e-7, null, null, null], "mistral.mistral-large-2402-v1:0": [8e-6, 24e-6, null, null, null], "mistral.mistral-large-2407-v1:0": [3e-6, 9e-6, null, null, null], "mistral.mistral-large-3-675b-instruct": [5e-7, 15e-7, null, null, null], "mistral.mistral-small-2402-v1:0": [1e-6, 3e-6, null, null, null], "mistral.mixtral-8x7b-instruct-v0:1": [45e-8, 7e-7, null, null, null], "mistral.voxtral-mini-3b-2507": [4e-8, 4e-8, null, null, null], "mistral.voxtral-small-24b-2507": [1e-7, 3e-7, null, null, null], "moonshot.kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "moonshotai.kimi-k2.5": [6e-7, 3e-6, null, null, null], multimodalembedding: [8e-7, 0, null, null, null], "multimodalembedding@001": [8e-7, 0, null, null, null], "nvidia.nemotron-nano-12b-v2": [2e-7, 6e-7, null, null, null], "nvidia.nemotron-nano-9b-v2": [6e-8, 23e-8, null, null, null], "nvidia.nemotron-nano-3-30b": [6e-8, 24e-8, null, null, null], "nvidia.nemotron-super-3-120b": [15e-8, 65e-8, null, null, null], o1: [15e-6, 6e-5, null, 75e-7, null], "o1-2024-12-17": [15e-6, 6e-5, null, 75e-7, null], "o1-pro": [15e-5, 6e-4, null, null, null], "o1-pro-2025-03-19": [15e-5, 6e-4, null, null, null], o3: [2e-6, 8e-6, null, 5e-7, null], "o3-2025-04-16": [2e-6, 8e-6, null, 5e-7, null], "o3-deep-research": [1e-5, 4e-5, null, 25e-7, null], "o3-deep-research-2025-06-26": [1e-5, 4e-5, null, 25e-7, null], "o3-mini": [11e-7, 44e-7, null, 55e-8, null], "o3-mini-2025-01-31": [11e-7, 44e-7, null, 55e-8, null], "o3-pro": [2e-5, 8e-5, null, null, null], "o3-pro-2025-06-10": [2e-5, 8e-5, null, null, null], "o4-mini": [11e-7, 44e-7, null, 275e-9, null], "o4-mini-2025-04-16": [11e-7, 44e-7, null, 275e-9, null], "o4-mini-deep-research": [2e-6, 8e-6, null, 5e-7, null], "o4-mini-deep-research-2025-06-26": [2e-6, 8e-6, null, 5e-7, null], "omni-moderation-2024-09-26": [0, 0, null, null, null], "omni-moderation-latest": [0, 0, null, null, null], "openai.gpt-oss-120b-1:0": [15e-8, 6e-7, null, null, null], "openai.gpt-oss-20b-1:0": [7e-8, 3e-7, null, null, null], "openai.gpt-oss-safeguard-120b": [15e-8, 6e-7, null, null, null], "openai.gpt-oss-safeguard-20b": [7e-8, 2e-7, null, null, null], "qwen.qwen3-coder-480b-a35b-v1:0": [22e-8, 18e-7, null, null, null], "qwen.qwen3-235b-a22b-2507-v1:0": [22e-8, 88e-8, null, null, null], "qwen.qwen3-coder-30b-a3b-v1:0": [15e-8, 6e-7, null, null, null], "qwen.qwen3-32b-v1:0": [15e-8, 6e-7, null, null, null], "qwen.qwen3-next-80b-a3b": [15e-8, 12e-7, null, null, null], "qwen.qwen3-vl-235b-a22b": [53e-8, 266e-8, null, null, null], "qwen.qwen3-coder-next": [5e-7, 12e-7, null, null, null], "rerank-english-v2.0": [0, 0, null, null, null], "rerank-english-v3.0": [0, 0, null, null, null], "rerank-multilingual-v2.0": [0, 0, null, null, null], "rerank-multilingual-v3.0": [0, 0, null, null, null], "rerank-v3.5": [0, 0, null, null, null], "text-embedding-004": [1e-7, 0, null, null, null], "text-embedding-005": [1e-7, 0, null, null, null], "text-embedding-3-large": [13e-8, 0, null, null, null], "text-embedding-3-small": [2e-8, 0, null, null, null], "text-embedding-ada-002": [1e-7, 0, null, null, null], "text-embedding-ada-002-v2": [1e-7, 0, null, null, null], "text-embedding-large-exp-03-07": [1e-7, 0, null, null, null], "text-embedding-preview-0409": [625e-11, 0, null, null, null], "text-moderation-007": [0, 0, null, null, null], "text-moderation-latest": [0, 0, null, null, null], "text-moderation-stable": [0, 0, null, null, null], "text-multilingual-embedding-002": [1e-7, 0, null, null, null], "text-unicorn": [1e-5, 28e-6, null, null, null], "text-unicorn@001": [1e-5, 28e-6, null, null, null], "together-ai-21.1b-41b": [8e-7, 8e-7, null, null, null], "together-ai-4.1b-8b": [2e-7, 2e-7, null, null, null], "together-ai-41.1b-80b": [9e-7, 9e-7, null, null, null], "together-ai-8.1b-21b": [3e-7, 3e-7, null, null, null], "together-ai-81.1b-110b": [18e-7, 18e-7, null, null, null], "together-ai-embedding-151m-to-350m": [16e-9, 0, null, null, null], "together-ai-embedding-up-to-150m": [8e-9, 0, null, null, null], "together-ai-up-to-4b": [1e-7, 1e-7, null, null, null], "us.amazon.nova-lite-v1:0": [6e-8, 24e-8, null, null, null], "us.amazon.nova-micro-v1:0": [35e-9, 14e-8, null, null, null], "us.amazon.nova-premier-v1:0": [25e-7, 125e-7, null, null, null], "us.amazon.nova-pro-v1:0": [8e-7, 32e-7, null, null, null], "us.anthropic.claude-3-5-haiku-20241022-v1:0": [8e-7, 4e-6, 1e-6, 8e-8, null], "us.anthropic.claude-haiku-4-5-20251001-v1:0": [11e-7, 55e-7, 1375e-9, 11e-8, null], "us.anthropic.claude-3-5-sonnet-20240620-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "us.anthropic.claude-3-5-sonnet-20241022-v2:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "us.anthropic.claude-3-7-sonnet-20250219-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "us.anthropic.claude-3-haiku-20240307-v1:0": [25e-8, 125e-8, 3125e-10, 25e-9, null], "us.anthropic.claude-3-opus-20240229-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "us.anthropic.claude-3-sonnet-20240229-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "us.anthropic.claude-opus-4-1-20250805-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "us.anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "au.anthropic.claude-haiku-4-5-20251001-v1:0": [11e-7, 55e-7, 1375e-9, 11e-8, null], "us.anthropic.claude-opus-4-20250514-v1:0": [15e-6, 75e-6, 1875e-8, 15e-7, null], "us.anthropic.claude-opus-4-5-20251101-v1:0": [55e-7, 275e-7, 6875e-9, 55e-8, null], "global.anthropic.claude-opus-4-5-20251101-v1:0": [5e-6, 25e-6, 625e-8, 5e-7, null], "eu.anthropic.claude-opus-4-5-20251101-v1:0": [5e-6, 25e-6, 625e-8, 5e-7, null], "us.anthropic.claude-sonnet-4-20250514-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "us.deepseek.r1-v1:0": [135e-8, 54e-7, null, null, null], "us.deepseek.v3.2": [62e-8, 185e-8, null, null, null], "eu.deepseek.v3.2": [74e-8, 222e-8, null, null, null], "us.meta.llama3-1-405b-instruct-v1:0": [532e-8, 16e-6, null, null, null], "us.meta.llama3-1-70b-instruct-v1:0": [99e-8, 99e-8, null, null, null], "us.meta.llama3-1-8b-instruct-v1:0": [22e-8, 22e-8, null, null, null], "us.meta.llama3-2-11b-instruct-v1:0": [35e-8, 35e-8, null, null, null], "us.meta.llama3-2-1b-instruct-v1:0": [1e-7, 1e-7, null, null, null], "us.meta.llama3-2-3b-instruct-v1:0": [15e-8, 15e-8, null, null, null], "us.meta.llama3-2-90b-instruct-v1:0": [2e-6, 2e-6, null, null, null], "us.meta.llama3-3-70b-instruct-v1:0": [72e-8, 72e-8, null, null, null], "us.meta.llama4-maverick-17b-instruct-v1:0": [24e-8, 97e-8, null, null, null], "us.meta.llama4-scout-17b-instruct-v1:0": [17e-8, 66e-8, null, null, null], "us.mistral.pixtral-large-2502-v1:0": [2e-6, 6e-6, null, null, null], "zai.glm-4.7": [6e-7, 22e-7, null, null, null], "zai.glm-5": [1e-6, 32e-7, null, null, null], "zai.glm-4.7-flash": [7e-8, 4e-7, null, null, null], "gpt-4o-mini-tts-2025-03-20": [25e-7, 1e-5, null, null, null], "gpt-4o-mini-tts-2025-12-15": [25e-7, 1e-5, null, null, null], "gpt-4o-mini-transcribe-2025-03-20": [125e-8, 5e-6, null, null, null], "gpt-4o-mini-transcribe-2025-12-15": [125e-8, 5e-6, null, null, null], "gpt-5-search-api": [125e-8, 1e-5, null, 125e-9, null], "gpt-5-search-api-2025-10-14": [125e-8, 1e-5, null, 125e-9, null], "gpt-realtime-mini-2025-10-06": [6e-7, 24e-7, null, 6e-8, null], "gpt-realtime-mini-2025-12-15": [6e-7, 24e-7, null, 6e-8, null], "gemini-2.0-flash-exp-image-generation": [0, 0, null, null, null], "gemini-2.5-flash-native-audio-latest": [3e-7, 25e-7, null, null, null], "gemini-2.5-flash-native-audio-preview-09-2025": [3e-7, 25e-7, null, null, null], "gemini-2.5-flash-native-audio-preview-12-2025": [3e-7, 25e-7, null, null, null], "gemini-3.1-flash-live-preview": [75e-8, 45e-7, null, null, null], "gemini-2.5-flash-preview-tts": [3e-7, 25e-7, null, null, null], "gemini-flash-latest": [3e-7, 25e-7, null, 3e-8, null], "gemini-flash-lite-latest": [1e-7, 4e-7, null, 1e-8, null], "gemini-pro-latest": [125e-8, 1e-5, null, 125e-9, null], "gemini-exp-1206": [3e-7, 25e-7, null, 3e-8, null], "anyscale/HuggingFaceH4/zephyr-7b-beta": [15e-8, 15e-8, null, null, null], "HuggingFaceH4/zephyr-7b-beta": [15e-8, 15e-8, null, null, null], "anyscale/codellama/CodeLlama-34b-Instruct-hf": [1e-6, 1e-6, null, null, null], "codellama/CodeLlama-34b-Instruct-hf": [1e-6, 1e-6, null, null, null], "anyscale/codellama/CodeLlama-70b-Instruct-hf": [1e-6, 1e-6, null, null, null], "codellama/CodeLlama-70b-Instruct-hf": [1e-6, 1e-6, null, null, null], "anyscale/google/gemma-7b-it": [15e-8, 15e-8, null, null, null], "google/gemma-7b-it": [15e-8, 15e-8, null, null, null], "anyscale/meta-llama/Llama-2-13b-chat-hf": [25e-8, 25e-8, null, null, null], "meta-llama/Llama-2-13b-chat-hf": [25e-8, 25e-8, null, null, null], "anyscale/meta-llama/Llama-2-70b-chat-hf": [1e-6, 1e-6, null, null, null], "meta-llama/Llama-2-70b-chat-hf": [1e-6, 1e-6, null, null, null], "anyscale/meta-llama/Llama-2-7b-chat-hf": [15e-8, 15e-8, null, null, null], "meta-llama/Llama-2-7b-chat-hf": [15e-8, 15e-8, null, null, null], "anyscale/meta-llama/Meta-Llama-3-70B-Instruct": [1e-6, 1e-6, null, null, null], "meta-llama/Meta-Llama-3-70B-Instruct": [1e-6, 1e-6, null, null, null], "anyscale/meta-llama/Meta-Llama-3-8B-Instruct": [15e-8, 15e-8, null, null, null], "meta-llama/Meta-Llama-3-8B-Instruct": [15e-8, 15e-8, null, null, null], "anyscale/mistralai/Mistral-7B-Instruct-v0.1": [15e-8, 15e-8, null, null, null], "mistralai/Mistral-7B-Instruct-v0.1": [15e-8, 15e-8, null, null, null], "anyscale/mistralai/Mixtral-8x22B-Instruct-v0.1": [9e-7, 9e-7, null, null, null], "mistralai/Mixtral-8x22B-Instruct-v0.1": [9e-7, 9e-7, null, null, null], "anyscale/mistralai/Mixtral-8x7B-Instruct-v0.1": [15e-8, 15e-8, null, null, null], "mistralai/Mixtral-8x7B-Instruct-v0.1": [15e-8, 15e-8, null, null, null], "azure/ada": [1e-7, 0, null, null, null], ada: [1e-7, 0, null, null, null], "azure/codex-mini": [15e-7, 6e-6, null, 375e-9, null], "codex-mini": [15e-7, 6e-6, null, 375e-9, null], "azure/command-r-plus": [3e-6, 15e-6, null, null, null], "azure_ai/claude-haiku-4-5": [1e-6, 5e-6, 125e-8, 1e-7, null], "azure_ai/claude-opus-4-5": [5e-6, 25e-6, 625e-8, 5e-7, null], "azure_ai/claude-opus-4-6": [5e-6, 25e-6, 625e-8, 5e-7, null], "azure_ai/claude-opus-4-7": [5e-6, 25e-6, 625e-8, 5e-7, null], "azure_ai/claude-opus-4-8": [5e-6, 25e-6, 625e-8, 5e-7, null], "azure_ai/claude-opus-4-1": [15e-6, 75e-6, 1875e-8, 15e-7, null], "azure_ai/claude-sonnet-4-5": [3e-6, 15e-6, 375e-8, 3e-7, null], "azure_ai/claude-sonnet-4-6": [3e-6, 15e-6, 375e-8, 3e-7, null], "azure/computer-use-preview": [3e-6, 12e-6, null, null, null], "azure_ai/gpt-oss-120b": [15e-8, 6e-7, null, null, null], "gpt-oss-120b": [15e-8, 6e-7, null, null, null], "azure_ai/gpt-5.4": [25e-7, 15e-6, null, 25e-8, null], "azure_ai/gpt-5.4-2026-03-05": [25e-7, 15e-6, null, 25e-8, null], "azure_ai/gpt-5.4-pro": [3e-5, 18e-5, null, 3e-6, null], "azure_ai/gpt-5.4-pro-2026-03-05": [3e-5, 18e-5, null, 3e-6, null], "azure_ai/gpt-5.4-mini": [75e-8, 45e-7, null, 75e-9, null], "azure_ai/gpt-5.4-mini-2026-03-17": [75e-8, 45e-7, null, 75e-9, null], "azure_ai/gpt-5.4-nano": [2e-7, 125e-8, null, 2e-8, null], "azure_ai/gpt-5.4-nano-2026-03-17": [2e-7, 125e-8, null, 2e-8, null], "azure_ai/model_router": [14e-8, 0, null, null, null], model_router: [14e-8, 0, null, null, null], "azure/eu/gpt-4o-2024-08-06": [275e-8, 11e-6, null, 1375e-9, null], "eu/gpt-4o-2024-08-06": [275e-8, 11e-6, null, 1375e-9, null], "azure/eu/gpt-4o-2024-11-20": [275e-8, 11e-6, 138e-8, null, null], "eu/gpt-4o-2024-11-20": [275e-8, 11e-6, 138e-8, null, null], "azure/eu/gpt-4o-mini-2024-07-18": [165e-9, 66e-8, null, 83e-9, null], "eu/gpt-4o-mini-2024-07-18": [165e-9, 66e-8, null, 83e-9, null], "azure/eu/gpt-4o-mini-realtime-preview-2024-12-17": [66e-8, 264e-8, null, 33e-8, null], "eu/gpt-4o-mini-realtime-preview-2024-12-17": [66e-8, 264e-8, null, 33e-8, null], "azure/eu/gpt-4o-realtime-preview-2024-10-01": [55e-7, 22e-6, null, 275e-8, null], "eu/gpt-4o-realtime-preview-2024-10-01": [55e-7, 22e-6, null, 275e-8, null], "azure/eu/gpt-4o-realtime-preview-2024-12-17": [55e-7, 22e-6, null, 275e-8, null], "eu/gpt-4o-realtime-preview-2024-12-17": [55e-7, 22e-6, null, 275e-8, null], "azure/eu/gpt-5-2025-08-07": [1375e-9, 11e-6, null, 1375e-10, null], "eu/gpt-5-2025-08-07": [1375e-9, 11e-6, null, 1375e-10, null], "azure/eu/gpt-5-mini-2025-08-07": [275e-9, 22e-7, null, 275e-10, null], "eu/gpt-5-mini-2025-08-07": [275e-9, 22e-7, null, 275e-10, null], "azure/eu/gpt-5.1": [138e-8, 11e-6, null, 14e-8, null], "eu/gpt-5.1": [138e-8, 11e-6, null, 14e-8, null], "azure/eu/gpt-5.1-chat": [138e-8, 11e-6, null, 14e-8, null], "eu/gpt-5.1-chat": [138e-8, 11e-6, null, 14e-8, null], "azure/eu/gpt-5.1-codex": [138e-8, 11e-6, null, 14e-8, null], "eu/gpt-5.1-codex": [138e-8, 11e-6, null, 14e-8, null], "azure/eu/gpt-5.1-codex-mini": [275e-9, 22e-7, null, 28e-9, null], "eu/gpt-5.1-codex-mini": [275e-9, 22e-7, null, 28e-9, null], "azure/eu/gpt-5-nano-2025-08-07": [55e-9, 44e-8, null, 55e-10, null], "eu/gpt-5-nano-2025-08-07": [55e-9, 44e-8, null, 55e-10, null], "azure/eu/o1-2024-12-17": [165e-7, 66e-6, null, 825e-8, null], "eu/o1-2024-12-17": [165e-7, 66e-6, null, 825e-8, null], "azure/eu/o1-mini-2024-09-12": [121e-8, 484e-8, null, 605e-9, null], "eu/o1-mini-2024-09-12": [121e-8, 484e-8, null, 605e-9, null], "azure/eu/o1-preview-2024-09-12": [165e-7, 66e-6, null, 825e-8, null], "eu/o1-preview-2024-09-12": [165e-7, 66e-6, null, 825e-8, null], "azure/eu/o3-mini-2025-01-31": [121e-8, 484e-8, null, 605e-9, null], "eu/o3-mini-2025-01-31": [121e-8, 484e-8, null, 605e-9, null], "azure/global-standard/gpt-4o-2024-08-06": [25e-7, 1e-5, null, 125e-8, null], "global-standard/gpt-4o-2024-08-06": [25e-7, 1e-5, null, 125e-8, null], "azure/global-standard/gpt-4o-2024-11-20": [25e-7, 1e-5, null, 125e-8, null], "global-standard/gpt-4o-2024-11-20": [25e-7, 1e-5, null, 125e-8, null], "azure/global-standard/gpt-4o-mini": [15e-8, 6e-7, null, null, null], "global-standard/gpt-4o-mini": [15e-8, 6e-7, null, null, null], "azure/global/gpt-4o-2024-08-06": [25e-7, 1e-5, null, 125e-8, null], "global/gpt-4o-2024-08-06": [25e-7, 1e-5, null, 125e-8, null], "azure/global/gpt-4o-2024-11-20": [25e-7, 1e-5, null, 125e-8, null], "global/gpt-4o-2024-11-20": [25e-7, 1e-5, null, 125e-8, null], "azure/global/gpt-5.1": [125e-8, 1e-5, null, 125e-9, null], "global/gpt-5.1": [125e-8, 1e-5, null, 125e-9, null], "azure/global/gpt-5.1-chat": [125e-8, 1e-5, null, 125e-9, null], "global/gpt-5.1-chat": [125e-8, 1e-5, null, 125e-9, null], "azure/global/gpt-5.1-codex": [125e-8, 1e-5, null, 125e-9, null], "global/gpt-5.1-codex": [125e-8, 1e-5, null, 125e-9, null], "azure/global/gpt-5.1-codex-mini": [25e-8, 2e-6, null, 25e-9, null], "global/gpt-5.1-codex-mini": [25e-8, 2e-6, null, 25e-9, null], "azure/gpt-3.5-turbo": [5e-7, 15e-7, null, null, null], "azure/gpt-3.5-turbo-0125": [5e-7, 15e-7, null, null, null], "azure/gpt-3.5-turbo-instruct-0914": [15e-7, 2e-6, null, null, null], "azure/gpt-35-turbo": [5e-7, 15e-7, null, null, null], "gpt-35-turbo": [5e-7, 15e-7, null, null, null], "azure/gpt-35-turbo-0125": [5e-7, 15e-7, null, null, null], "gpt-35-turbo-0125": [5e-7, 15e-7, null, null, null], "azure/gpt-35-turbo-1106": [1e-6, 2e-6, null, null, null], "gpt-35-turbo-1106": [1e-6, 2e-6, null, null, null], "azure/gpt-35-turbo-16k": [3e-6, 4e-6, null, null, null], "gpt-35-turbo-16k": [3e-6, 4e-6, null, null, null], "azure/gpt-35-turbo-16k-0613": [3e-6, 4e-6, null, null, null], "gpt-35-turbo-16k-0613": [3e-6, 4e-6, null, null, null], "azure/gpt-35-turbo-instruct": [15e-7, 2e-6, null, null, null], "gpt-35-turbo-instruct": [15e-7, 2e-6, null, null, null], "azure/gpt-35-turbo-instruct-0914": [15e-7, 2e-6, null, null, null], "gpt-35-turbo-instruct-0914": [15e-7, 2e-6, null, null, null], "azure/gpt-4": [3e-5, 6e-5, null, null, null], "azure/gpt-4-0125-preview": [1e-5, 3e-5, null, null, null], "azure/gpt-4-0613": [3e-5, 6e-5, null, null, null], "azure/gpt-4-1106-preview": [1e-5, 3e-5, null, null, null], "azure/gpt-4-32k": [6e-5, 12e-5, null, null, null], "gpt-4-32k": [6e-5, 12e-5, null, null, null], "azure/gpt-4-32k-0613": [6e-5, 12e-5, null, null, null], "gpt-4-32k-0613": [6e-5, 12e-5, null, null, null], "azure/gpt-4-turbo": [1e-5, 3e-5, null, null, null], "azure/gpt-4-turbo-2024-04-09": [1e-5, 3e-5, null, null, null], "azure/gpt-4-turbo-vision-preview": [1e-5, 3e-5, null, null, null], "gpt-4-turbo-vision-preview": [1e-5, 3e-5, null, null, null], "azure/gpt-4.1": [2e-6, 8e-6, null, 5e-7, null], "azure/gpt-4.1-2025-04-14": [2e-6, 8e-6, null, 5e-7, null], "azure/gpt-4.1-mini": [4e-7, 16e-7, null, 1e-7, null], "azure/gpt-4.1-mini-2025-04-14": [4e-7, 16e-7, null, 1e-7, null], "azure/gpt-4.1-nano": [1e-7, 4e-7, null, 25e-9, null], "azure/gpt-4.1-nano-2025-04-14": [1e-7, 4e-7, null, 25e-9, null], "azure/gpt-4.5-preview": [75e-6, 15e-5, null, 375e-7, null], "gpt-4.5-preview": [75e-6, 15e-5, null, 375e-7, null], "azure/gpt-4o": [25e-7, 1e-5, null, 125e-8, null], "azure/gpt-4o-2024-05-13": [5e-6, 15e-6, null, null, null], "azure/gpt-4o-2024-08-06": [25e-7, 1e-5, null, 125e-8, null], "azure/gpt-4o-2024-11-20": [275e-8, 11e-6, null, 125e-8, null], "azure/gpt-audio-2025-08-28": [25e-7, 1e-5, null, null, null], "azure/gpt-audio-1.5-2026-02-23": [25e-7, 1e-5, null, null, null], "gpt-audio-1.5-2026-02-23": [25e-7, 1e-5, null, null, null], "azure/gpt-audio-mini-2025-10-06": [6e-7, 24e-7, null, null, null], "azure/gpt-4o-audio-preview-2024-12-17": [25e-7, 1e-5, null, null, null], "azure/gpt-4o-mini": [165e-9, 66e-8, null, 75e-9, null], "azure/gpt-4o-mini-2024-07-18": [165e-9, 66e-8, null, 75e-9, null], "azure/gpt-4o-mini-audio-preview-2024-12-17": [25e-7, 1e-5, null, null, null], "azure/gpt-4o-mini-realtime-preview-2024-12-17": [6e-7, 24e-7, null, 3e-7, null], "azure/gpt-realtime-2025-08-28": [4e-6, 16e-6, null, 4e-6, null], "azure/gpt-realtime-1.5-2026-02-23": [4e-6, 16e-6, null, 4e-6, null], "gpt-realtime-1.5-2026-02-23": [4e-6, 16e-6, null, 4e-6, null], "azure/gpt-realtime-mini-2025-10-06": [6e-7, 24e-7, null, 6e-8, null], "azure/gpt-4o-mini-transcribe": [125e-8, 5e-6, null, null, null], "azure/gpt-4o-mini-tts": [25e-7, 1e-5, null, null, null], "azure/gpt-4o-realtime-preview-2024-10-01": [5e-6, 2e-5, null, 25e-7, null], "gpt-4o-realtime-preview-2024-10-01": [5e-6, 2e-5, null, 25e-7, null], "azure/gpt-4o-realtime-preview-2024-12-17": [5e-6, 2e-5, null, 25e-7, null], "azure/gpt-4o-transcribe": [25e-7, 1e-5, null, null, null], "azure/gpt-4o-transcribe-diarize": [25e-7, 1e-5, null, null, null], "azure/gpt-5.1-2025-11-13": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5.1-chat-2025-11-13": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-chat-2025-11-13": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5.1-codex-2025-11-13": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-codex-2025-11-13": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5.1-codex-mini-2025-11-13": [25e-8, 2e-6, null, 25e-9, null], "gpt-5.1-codex-mini-2025-11-13": [25e-8, 2e-6, null, 25e-9, null], "azure/gpt-5": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5-2025-08-07": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5-chat": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5-chat-latest": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5-codex": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5-mini": [25e-8, 2e-6, null, 25e-9, null], "azure/gpt-5-mini-2025-08-07": [25e-8, 2e-6, null, 25e-9, null], "azure/gpt-5-nano": [5e-8, 4e-7, null, 5e-9, null], "azure/gpt-5-nano-2025-08-07": [5e-8, 4e-7, null, 5e-9, null], "azure/gpt-5-pro": [15e-6, 12e-5, null, null, null], "azure/gpt-5.1": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5.1-chat": [125e-8, 1e-5, null, 125e-9, null], "gpt-5.1-chat": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5.1-codex": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5.1-codex-max": [125e-8, 1e-5, null, 125e-9, null], "azure/gpt-5.1-codex-mini": [25e-8, 2e-6, null, 25e-9, null], "azure/gpt-5.2": [175e-8, 14e-6, null, 175e-9, null], "azure/gpt-5.2-2025-12-11": [175e-8, 14e-6, null, 175e-9, null], "azure/gpt-5.2-chat": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.2-chat": [175e-8, 14e-6, null, 175e-9, null], "azure/gpt-5.2-chat-2025-12-11": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.2-chat-2025-12-11": [175e-8, 14e-6, null, 175e-9, null], "azure/gpt-5.2-codex": [175e-8, 14e-6, null, 175e-9, null], "azure/gpt-5.3-chat": [175e-8, 14e-6, null, 175e-9, null], "gpt-5.3-chat": [175e-8, 14e-6, null, 175e-9, null], "azure/gpt-5.3-codex": [175e-8, 14e-6, null, 175e-9, null], "azure/gpt-5.2-pro": [21e-6, 168e-6, null, null, null], "azure/gpt-5.2-pro-2025-12-11": [21e-6, 168e-6, null, null, null], "azure/gpt-5.4": [25e-7, 15e-6, null, 25e-8, null], "azure/gpt-5.4-2026-03-05": [25e-7, 15e-6, null, 25e-8, null], "azure/gpt-5.4-pro": [3e-5, 18e-5, null, 3e-6, null], "azure/gpt-5.4-pro-2026-03-05": [3e-5, 18e-5, null, 3e-6, null], "azure/gpt-5.5": [5e-6, 3e-5, null, 5e-7, null], "azure/gpt-5.5-2026-04-23": [5e-6, 3e-5, null, 5e-7, null], "azure/gpt-5.5-pro": [3e-5, 18e-5, null, 3e-6, null], "azure/gpt-5.5-pro-2026-04-23": [3e-5, 18e-5, null, 3e-6, null], "azure/gpt-5.4-mini": [75e-8, 45e-7, null, 75e-9, null], "azure/gpt-5.4-mini-2026-03-17": [75e-8, 45e-7, null, 75e-9, null], "azure/gpt-5.4-nano": [2e-7, 125e-8, null, 2e-8, null], "azure/gpt-5.4-nano-2026-03-17": [2e-7, 125e-8, null, 2e-8, null], "azure/gpt-image-2": [5e-6, 1e-5, null, 125e-8, null], "azure/gpt-image-2-2026-04-21": [5e-6, 1e-5, null, 125e-8, null], "azure/mistral-large-2402": [8e-6, 24e-6, null, null, null], "mistral-large-2402": [8e-6, 24e-6, null, null, null], "azure/mistral-large-latest": [8e-6, 24e-6, null, null, null], "mistral-large-latest": [8e-6, 24e-6, null, null, null], "azure/o1": [15e-6, 6e-5, null, 75e-7, null], "azure/o1-2024-12-17": [15e-6, 6e-5, null, 75e-7, null], "azure/o1-mini": [121e-8, 484e-8, null, 605e-9, null], "o1-mini": [121e-8, 484e-8, null, 605e-9, null], "azure/o1-mini-2024-09-12": [11e-7, 44e-7, null, 55e-8, null], "o1-mini-2024-09-12": [11e-7, 44e-7, null, 55e-8, null], "azure/o1-preview": [15e-6, 6e-5, null, 75e-7, null], "o1-preview": [15e-6, 6e-5, null, 75e-7, null], "azure/o1-preview-2024-09-12": [15e-6, 6e-5, null, 75e-7, null], "o1-preview-2024-09-12": [15e-6, 6e-5, null, 75e-7, null], "azure/o3": [2e-6, 8e-6, null, 5e-7, null], "azure/o3-2025-04-16": [2e-6, 8e-6, null, 5e-7, null], "azure/o3-deep-research": [1e-5, 4e-5, null, 25e-7, null], "azure/o3-mini": [11e-7, 44e-7, null, 55e-8, null], "azure/o3-mini-2025-01-31": [11e-7, 44e-7, null, 55e-8, null], "azure/o3-pro": [2e-5, 8e-5, null, null, null], "azure/o3-pro-2025-06-10": [2e-5, 8e-5, null, null, null], "azure/o4-mini": [11e-7, 44e-7, null, 275e-9, null], "azure/o4-mini-2025-04-16": [11e-7, 44e-7, null, 275e-9, null], "azure/text-embedding-3-large": [13e-8, 0, null, null, null], "azure/text-embedding-3-small": [2e-8, 0, null, null, null], "azure/text-embedding-ada-002": [1e-7, 0, null, null, null], "azure/us/gpt-4.1-2025-04-14": [22e-7, 88e-7, null, 55e-8, null], "us/gpt-4.1-2025-04-14": [22e-7, 88e-7, null, 55e-8, null], "azure/us/gpt-4.1-mini-2025-04-14": [44e-8, 176e-8, null, 11e-8, null], "us/gpt-4.1-mini-2025-04-14": [44e-8, 176e-8, null, 11e-8, null], "azure/us/gpt-4.1-nano-2025-04-14": [11e-8, 44e-8, null, 25e-9, null], "us/gpt-4.1-nano-2025-04-14": [11e-8, 44e-8, null, 25e-9, null], "azure/us/gpt-4o-2024-08-06": [275e-8, 11e-6, null, 1375e-9, null], "us/gpt-4o-2024-08-06": [275e-8, 11e-6, null, 1375e-9, null], "azure/us/gpt-4o-2024-11-20": [275e-8, 11e-6, 138e-8, null, null], "us/gpt-4o-2024-11-20": [275e-8, 11e-6, 138e-8, null, null], "azure/us/gpt-4o-mini-2024-07-18": [165e-9, 66e-8, null, 83e-9, null], "us/gpt-4o-mini-2024-07-18": [165e-9, 66e-8, null, 83e-9, null], "azure/us/gpt-4o-mini-realtime-preview-2024-12-17": [66e-8, 264e-8, null, 33e-8, null], "us/gpt-4o-mini-realtime-preview-2024-12-17": [66e-8, 264e-8, null, 33e-8, null], "azure/us/gpt-4o-realtime-preview-2024-10-01": [55e-7, 22e-6, null, 275e-8, null], "us/gpt-4o-realtime-preview-2024-10-01": [55e-7, 22e-6, null, 275e-8, null], "azure/us/gpt-4o-realtime-preview-2024-12-17": [55e-7, 22e-6, null, 275e-8, null], "us/gpt-4o-realtime-preview-2024-12-17": [55e-7, 22e-6, null, 275e-8, null], "azure/us/gpt-5-2025-08-07": [1375e-9, 11e-6, null, 1375e-10, null], "us/gpt-5-2025-08-07": [1375e-9, 11e-6, null, 1375e-10, null], "azure/us/gpt-5-mini-2025-08-07": [275e-9, 22e-7, null, 275e-10, null], "us/gpt-5-mini-2025-08-07": [275e-9, 22e-7, null, 275e-10, null], "azure/us/gpt-5-nano-2025-08-07": [55e-9, 44e-8, null, 55e-10, null], "us/gpt-5-nano-2025-08-07": [55e-9, 44e-8, null, 55e-10, null], "azure/us/gpt-5.1": [138e-8, 11e-6, null, 14e-8, null], "us/gpt-5.1": [138e-8, 11e-6, null, 14e-8, null], "azure/us/gpt-5.1-chat": [138e-8, 11e-6, null, 14e-8, null], "us/gpt-5.1-chat": [138e-8, 11e-6, null, 14e-8, null], "azure/us/gpt-5.1-codex": [138e-8, 11e-6, null, 14e-8, null], "us/gpt-5.1-codex": [138e-8, 11e-6, null, 14e-8, null], "azure/us/gpt-5.1-codex-mini": [275e-9, 22e-7, null, 28e-9, null], "us/gpt-5.1-codex-mini": [275e-9, 22e-7, null, 28e-9, null], "azure/us/o1-2024-12-17": [165e-7, 66e-6, null, 825e-8, null], "us/o1-2024-12-17": [165e-7, 66e-6, null, 825e-8, null], "azure/us/o1-mini-2024-09-12": [121e-8, 484e-8, null, 605e-9, null], "us/o1-mini-2024-09-12": [121e-8, 484e-8, null, 605e-9, null], "azure/us/o1-preview-2024-09-12": [165e-7, 66e-6, null, 825e-8, null], "us/o1-preview-2024-09-12": [165e-7, 66e-6, null, 825e-8, null], "azure/us/o3-2025-04-16": [22e-7, 88e-7, null, 55e-8, null], "us/o3-2025-04-16": [22e-7, 88e-7, null, 55e-8, null], "azure/us/o3-mini-2025-01-31": [121e-8, 484e-8, null, 605e-9, null], "us/o3-mini-2025-01-31": [121e-8, 484e-8, null, 605e-9, null], "azure/us/o4-mini-2025-04-16": [121e-8, 484e-8, null, 31e-8, null], "us/o4-mini-2025-04-16": [121e-8, 484e-8, null, 31e-8, null], "azure_ai/Cohere-embed-v3-english": [1e-7, 0, null, null, null], "Cohere-embed-v3-english": [1e-7, 0, null, null, null], "azure_ai/Cohere-embed-v3-multilingual": [1e-7, 0, null, null, null], "Cohere-embed-v3-multilingual": [1e-7, 0, null, null, null], "azure_ai/Llama-3.2-11B-Vision-Instruct": [37e-8, 37e-8, null, null, null], "Llama-3.2-11B-Vision-Instruct": [37e-8, 37e-8, null, null, null], "azure_ai/Llama-3.2-90B-Vision-Instruct": [204e-8, 204e-8, null, null, null], "Llama-3.2-90B-Vision-Instruct": [204e-8, 204e-8, null, null, null], "azure_ai/Llama-3.3-70B-Instruct": [71e-8, 71e-8, null, null, null], "Llama-3.3-70B-Instruct": [71e-8, 71e-8, null, null, null], "azure_ai/Llama-4-Maverick-17B-128E-Instruct-FP8": [141e-8, 35e-8, null, null, null], "Llama-4-Maverick-17B-128E-Instruct-FP8": [141e-8, 35e-8, null, null, null], "azure_ai/Llama-4-Scout-17B-16E-Instruct": [2e-7, 78e-8, null, null, null], "Llama-4-Scout-17B-16E-Instruct": [2e-7, 78e-8, null, null, null], "azure_ai/Meta-Llama-3-70B-Instruct": [11e-7, 37e-8, null, null, null], "Meta-Llama-3-70B-Instruct": [11e-7, 37e-8, null, null, null], "azure_ai/Meta-Llama-3.1-405B-Instruct": [533e-8, 16e-6, null, null, null], "Meta-Llama-3.1-405B-Instruct": [533e-8, 16e-6, null, null, null], "azure_ai/Meta-Llama-3.1-70B-Instruct": [268e-8, 354e-8, null, null, null], "Meta-Llama-3.1-70B-Instruct": [268e-8, 354e-8, null, null, null], "azure_ai/Meta-Llama-3.1-8B-Instruct": [3e-7, 61e-8, null, null, null], "Meta-Llama-3.1-8B-Instruct": [3e-7, 61e-8, null, null, null], "azure_ai/Phi-3-medium-128k-instruct": [17e-8, 68e-8, null, null, null], "Phi-3-medium-128k-instruct": [17e-8, 68e-8, null, null, null], "azure_ai/Phi-3-medium-4k-instruct": [17e-8, 68e-8, null, null, null], "Phi-3-medium-4k-instruct": [17e-8, 68e-8, null, null, null], "azure_ai/Phi-3-mini-128k-instruct": [13e-8, 52e-8, null, null, null], "Phi-3-mini-128k-instruct": [13e-8, 52e-8, null, null, null], "azure_ai/Phi-3-mini-4k-instruct": [13e-8, 52e-8, null, null, null], "Phi-3-mini-4k-instruct": [13e-8, 52e-8, null, null, null], "azure_ai/Phi-3-small-128k-instruct": [15e-8, 6e-7, null, null, null], "Phi-3-small-128k-instruct": [15e-8, 6e-7, null, null, null], "azure_ai/Phi-3-small-8k-instruct": [15e-8, 6e-7, null, null, null], "Phi-3-small-8k-instruct": [15e-8, 6e-7, null, null, null], "azure_ai/Phi-3.5-MoE-instruct": [16e-8, 64e-8, null, null, null], "Phi-3.5-MoE-instruct": [16e-8, 64e-8, null, null, null], "azure_ai/Phi-3.5-mini-instruct": [13e-8, 52e-8, null, null, null], "Phi-3.5-mini-instruct": [13e-8, 52e-8, null, null, null], "azure_ai/Phi-3.5-vision-instruct": [13e-8, 52e-8, null, null, null], "Phi-3.5-vision-instruct": [13e-8, 52e-8, null, null, null], "azure_ai/Phi-4": [125e-9, 5e-7, null, null, null], "Phi-4": [125e-9, 5e-7, null, null, null], "azure_ai/Phi-4-mini-instruct": [75e-9, 3e-7, null, null, null], "Phi-4-mini-instruct": [75e-9, 3e-7, null, null, null], "azure_ai/Phi-4-multimodal-instruct": [8e-8, 32e-8, null, null, null], "Phi-4-multimodal-instruct": [8e-8, 32e-8, null, null, null], "azure_ai/Phi-4-mini-reasoning": [8e-8, 32e-8, null, null, null], "Phi-4-mini-reasoning": [8e-8, 32e-8, null, null, null], "azure_ai/Phi-4-reasoning": [125e-9, 5e-7, null, null, null], "Phi-4-reasoning": [125e-9, 5e-7, null, null, null], "azure_ai/MAI-DS-R1": [135e-8, 54e-7, null, null, null], "MAI-DS-R1": [135e-8, 54e-7, null, null, null], "azure_ai/cohere-rerank-v3-english": [0, 0, null, null, null], "cohere-rerank-v3-english": [0, 0, null, null, null], "azure_ai/cohere-rerank-v3-multilingual": [0, 0, null, null, null], "cohere-rerank-v3-multilingual": [0, 0, null, null, null], "azure_ai/cohere-rerank-v3.5": [0, 0, null, null, null], "cohere-rerank-v3.5": [0, 0, null, null, null], "azure_ai/cohere-rerank-v4.0-pro": [0, 0, null, null, null], "cohere-rerank-v4.0-pro": [0, 0, null, null, null], "azure_ai/cohere-rerank-v4.0-fast": [0, 0, null, null, null], "cohere-rerank-v4.0-fast": [0, 0, null, null, null], "azure_ai/deepseek-v3.2": [58e-8, 168e-8, null, null, null], "deepseek-v3.2": [58e-8, 168e-8, null, null, null], "azure_ai/deepseek-v3.2-speciale": [58e-8, 168e-8, null, null, null], "deepseek-v3.2-speciale": [58e-8, 168e-8, null, null, null], "azure_ai/deepseek-r1": [135e-8, 54e-7, null, null, null], "deepseek-r1": [135e-8, 54e-7, null, null, null], "azure_ai/deepseek-v3": [114e-8, 456e-8, null, null, null], "deepseek-v3": [114e-8, 456e-8, null, null, null], "azure_ai/deepseek-v3-0324": [114e-8, 456e-8, null, null, null], "deepseek-v3-0324": [114e-8, 456e-8, null, null, null], "azure_ai/embed-v-4-0": [12e-8, 0, null, null, null], "embed-v-4-0": [12e-8, 0, null, null, null], "azure_ai/global/grok-3": [3e-6, 15e-6, null, null, null], "global/grok-3": [3e-6, 15e-6, null, null, null], "azure_ai/global/grok-3-mini": [25e-8, 127e-8, null, null, null], "global/grok-3-mini": [25e-8, 127e-8, null, null, null], "azure_ai/grok-3": [3e-6, 15e-6, null, null, null], "grok-3": [3e-6, 15e-6, null, null, null], "azure_ai/grok-3-mini": [25e-8, 127e-8, null, null, null], "grok-3-mini": [25e-8, 127e-8, null, null, null], "azure_ai/grok-4": [3e-6, 15e-6, null, null, null], "grok-4": [3e-6, 15e-6, null, null, null], "azure_ai/grok-4-fast-non-reasoning": [2e-7, 5e-7, null, null, null], "grok-4-fast-non-reasoning": [2e-7, 5e-7, null, null, null], "azure_ai/grok-4-fast-reasoning": [2e-7, 5e-7, null, null, null], "grok-4-fast-reasoning": [2e-7, 5e-7, null, null, null], "azure_ai/grok-4-1-fast-non-reasoning": [2e-7, 5e-7, null, null, null], "grok-4-1-fast-non-reasoning": [2e-7, 5e-7, null, null, null], "azure_ai/grok-4-1-fast-reasoning": [2e-7, 5e-7, null, null, null], "grok-4-1-fast-reasoning": [2e-7, 5e-7, null, null, null], "azure_ai/grok-code-fast-1": [2e-7, 15e-7, null, null, null], "grok-code-fast-1": [2e-7, 15e-7, null, null, null], "azure_ai/jais-30b-chat": [32e-4, 971e-5, null, null, null], "jais-30b-chat": [32e-4, 971e-5, null, null, null], "azure_ai/jamba-instruct": [5e-7, 7e-7, null, null, null], "jamba-instruct": [5e-7, 7e-7, null, null, null], "azure_ai/kimi-k2.5": [6e-7, 3e-6, null, null, null], "kimi-k2.5": [6e-7, 3e-6, null, null, null], "azure_ai/ministral-3b": [4e-8, 4e-8, null, null, null], "ministral-3b": [4e-8, 4e-8, null, null, null], "azure_ai/mistral-large": [4e-6, 12e-6, null, null, null], "mistral-large": [4e-6, 12e-6, null, null, null], "azure_ai/mistral-large-2407": [2e-6, 6e-6, null, null, null], "mistral-large-2407": [2e-6, 6e-6, null, null, null], "azure_ai/mistral-large-latest": [2e-6, 6e-6, null, null, null], "azure_ai/mistral-large-3": [5e-7, 15e-7, null, null, null], "mistral-large-3": [5e-7, 15e-7, null, null, null], "azure_ai/mistral-medium-2505": [4e-7, 2e-6, null, null, null], "mistral-medium-2505": [4e-7, 2e-6, null, null, null], "azure_ai/mistral-nemo": [15e-8, 15e-8, null, null, null], "mistral-nemo": [15e-8, 15e-8, null, null, null], "azure_ai/mistral-small": [1e-6, 3e-6, null, null, null], "mistral-small": [1e-6, 3e-6, null, null, null], "azure_ai/mistral-small-2503": [1e-7, 3e-7, null, null, null], "mistral-small-2503": [1e-7, 3e-7, null, null, null], "bedrock/ap-northeast-1/anthropic.claude-instant-v1": [223e-8, 755e-8, null, null, null], "ap-northeast-1/anthropic.claude-instant-v1": [223e-8, 755e-8, null, null, null], "bedrock/ap-northeast-1/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "ap-northeast-1/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "bedrock/ap-northeast-1/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "ap-northeast-1/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "bedrock/ap-northeast-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "ap-northeast-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "bedrock/ap-northeast-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "ap-northeast-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/ap-northeast-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "ap-northeast-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/ap-northeast-1/moonshotai.kimi-k2-thinking": [73e-8, 303e-8, null, null, null], "ap-northeast-1/moonshotai.kimi-k2-thinking": [73e-8, 303e-8, null, null, null], "bedrock/ap-northeast-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "ap-northeast-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "bedrock/ap-northeast-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "ap-northeast-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "bedrock/moonshotai.kimi-k2-thinking": [73e-8, 303e-8, null, null, null], "moonshotai.kimi-k2-thinking": [73e-8, 303e-8, null, null, null], "bedrock/moonshotai.kimi-k2.5": [6e-7, 303e-8, null, null, null], "bedrock/ap-south-1/meta.llama3-70b-instruct-v1:0": [318e-8, 42e-7, null, null, null], "ap-south-1/meta.llama3-70b-instruct-v1:0": [318e-8, 42e-7, null, null, null], "bedrock/ap-south-1/meta.llama3-8b-instruct-v1:0": [36e-8, 72e-8, null, null, null], "ap-south-1/meta.llama3-8b-instruct-v1:0": [36e-8, 72e-8, null, null, null], "bedrock/ap-south-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "ap-south-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "bedrock/ap-south-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "ap-south-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/ap-south-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "ap-south-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/ap-south-1/moonshotai.kimi-k2-thinking": [71e-8, 294e-8, null, null, null], "ap-south-1/moonshotai.kimi-k2-thinking": [71e-8, 294e-8, null, null, null], "bedrock/ap-south-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "ap-south-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "bedrock/ap-south-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "ap-south-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "bedrock/ap-southeast-2/minimax.minimax-m2.5": [309e-9, 1236e-9, null, null, null], "ap-southeast-2/minimax.minimax-m2.5": [309e-9, 1236e-9, null, null, null], "bedrock/ap-southeast-3/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "ap-southeast-3/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "bedrock/ap-southeast-3/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "ap-southeast-3/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/ap-southeast-3/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "ap-southeast-3/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/ap-southeast-3/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "ap-southeast-3/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "bedrock/ap-southeast-3/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "ap-southeast-3/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "bedrock/ca-central-1/meta.llama3-70b-instruct-v1:0": [305e-8, 403e-8, null, null, null], "ca-central-1/meta.llama3-70b-instruct-v1:0": [305e-8, 403e-8, null, null, null], "bedrock/ca-central-1/meta.llama3-8b-instruct-v1:0": [35e-8, 69e-8, null, null, null], "ca-central-1/meta.llama3-8b-instruct-v1:0": [35e-8, 69e-8, null, null, null], "bedrock/eu-north-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "eu-north-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "bedrock/eu-north-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "eu-north-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/eu-north-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "eu-north-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/eu-north-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "eu-north-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "bedrock/eu-central-1/anthropic.claude-instant-v1": [248e-8, 838e-8, null, null, null], "eu-central-1/anthropic.claude-instant-v1": [248e-8, 838e-8, null, null, null], "bedrock/eu-central-1/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "eu-central-1/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "bedrock/eu-central-1/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "eu-central-1/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "bedrock/eu-central-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "eu-central-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/eu-central-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "eu-central-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/eu-central-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "eu-central-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "bedrock/eu-west-1/meta.llama3-70b-instruct-v1:0": [286e-8, 378e-8, null, null, null], "eu-west-1/meta.llama3-70b-instruct-v1:0": [286e-8, 378e-8, null, null, null], "bedrock/eu-west-1/meta.llama3-8b-instruct-v1:0": [32e-8, 65e-8, null, null, null], "eu-west-1/meta.llama3-8b-instruct-v1:0": [32e-8, 65e-8, null, null, null], "bedrock/eu-west-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "eu-west-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/eu-west-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "eu-west-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/eu-west-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "eu-west-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "bedrock/eu-west-2/meta.llama3-70b-instruct-v1:0": [345e-8, 455e-8, null, null, null], "eu-west-2/meta.llama3-70b-instruct-v1:0": [345e-8, 455e-8, null, null, null], "bedrock/eu-west-2/meta.llama3-8b-instruct-v1:0": [39e-8, 78e-8, null, null, null], "eu-west-2/meta.llama3-8b-instruct-v1:0": [39e-8, 78e-8, null, null, null], "bedrock/eu-west-2/minimax.minimax-m2.1": [47e-8, 186e-8, null, null, null], "eu-west-2/minimax.minimax-m2.1": [47e-8, 186e-8, null, null, null], "bedrock/eu-west-2/minimax.minimax-m2.5": [47e-8, 186e-8, null, null, null], "eu-west-2/minimax.minimax-m2.5": [47e-8, 186e-8, null, null, null], "bedrock/eu-west-2/qwen.qwen3-coder-next": [78e-8, 186e-8, null, null, null], "eu-west-2/qwen.qwen3-coder-next": [78e-8, 186e-8, null, null, null], "bedrock/eu-west-3/mistral.mistral-7b-instruct-v0:2": [2e-7, 26e-8, null, null, null], "eu-west-3/mistral.mistral-7b-instruct-v0:2": [2e-7, 26e-8, null, null, null], "bedrock/eu-west-3/mistral.mistral-large-2402-v1:0": [104e-7, 312e-7, null, null, null], "eu-west-3/mistral.mistral-large-2402-v1:0": [104e-7, 312e-7, null, null, null], "bedrock/eu-west-3/mistral.mixtral-8x7b-instruct-v0:1": [59e-8, 91e-8, null, null, null], "eu-west-3/mistral.mixtral-8x7b-instruct-v0:1": [59e-8, 91e-8, null, null, null], "bedrock/eu-south-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "eu-south-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/eu-south-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "eu-south-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/eu-south-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "eu-south-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "bedrock/invoke/anthropic.claude-3-5-sonnet-20240620-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "invoke/anthropic.claude-3-5-sonnet-20240620-v1:0": [3e-6, 15e-6, 375e-8, 3e-7, null], "bedrock/sa-east-1/meta.llama3-70b-instruct-v1:0": [445e-8, 588e-8, null, null, null], "sa-east-1/meta.llama3-70b-instruct-v1:0": [445e-8, 588e-8, null, null, null], "bedrock/sa-east-1/meta.llama3-8b-instruct-v1:0": [5e-7, 101e-8, null, null, null], "sa-east-1/meta.llama3-8b-instruct-v1:0": [5e-7, 101e-8, null, null, null], "bedrock/sa-east-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "sa-east-1/deepseek.v3.2": [74e-8, 222e-8, null, null, null], "bedrock/sa-east-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "sa-east-1/minimax.minimax-m2.1": [36e-8, 144e-8, null, null, null], "bedrock/sa-east-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "sa-east-1/minimax.minimax-m2.5": [36e-8, 144e-8, null, null, null], "bedrock/sa-east-1/moonshotai.kimi-k2-thinking": [73e-8, 303e-8, null, null, null], "sa-east-1/moonshotai.kimi-k2-thinking": [73e-8, 303e-8, null, null, null], "bedrock/sa-east-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "sa-east-1/moonshotai.kimi-k2.5": [72e-8, 36e-7, null, null, null], "bedrock/sa-east-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "sa-east-1/qwen.qwen3-coder-next": [6e-7, 144e-8, null, null, null], "bedrock/us-east-1/anthropic.claude-instant-v1": [8e-7, 24e-7, null, null, null], "us-east-1/anthropic.claude-instant-v1": [8e-7, 24e-7, null, null, null], "bedrock/us-east-1/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "us-east-1/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "bedrock/us-east-1/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "us-east-1/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "bedrock/us-east-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "us-east-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "bedrock/us-east-1/meta.llama3-8b-instruct-v1:0": [3e-7, 6e-7, null, null, null], "us-east-1/meta.llama3-8b-instruct-v1:0": [3e-7, 6e-7, null, null, null], "bedrock/us-east-1/mistral.mistral-7b-instruct-v0:2": [15e-8, 2e-7, null, null, null], "us-east-1/mistral.mistral-7b-instruct-v0:2": [15e-8, 2e-7, null, null, null], "bedrock/us-east-1/mistral.mistral-large-2402-v1:0": [8e-6, 24e-6, null, null, null], "us-east-1/mistral.mistral-large-2402-v1:0": [8e-6, 24e-6, null, null, null], "bedrock/us-east-1/mistral.mixtral-8x7b-instruct-v0:1": [45e-8, 7e-7, null, null, null], "us-east-1/mistral.mixtral-8x7b-instruct-v0:1": [45e-8, 7e-7, null, null, null], "bedrock/us-east-1/deepseek.v3.2": [62e-8, 185e-8, null, null, null], "us-east-1/deepseek.v3.2": [62e-8, 185e-8, null, null, null], "bedrock/us-east-1/minimax.minimax-m2.1": [3e-7, 12e-7, null, null, null], "us-east-1/minimax.minimax-m2.1": [3e-7, 12e-7, null, null, null], "bedrock/us-east-1/minimax.minimax-m2.5": [3e-7, 12e-7, null, null, null], "us-east-1/minimax.minimax-m2.5": [3e-7, 12e-7, null, null, null], "bedrock/us-east-1/moonshotai.kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "us-east-1/moonshotai.kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "bedrock/us-east-1/moonshotai.kimi-k2.5": [6e-7, 3e-6, null, null, null], "us-east-1/moonshotai.kimi-k2.5": [6e-7, 3e-6, null, null, null], "bedrock/us-east-1/qwen.qwen3-coder-next": [5e-7, 12e-7, null, null, null], "us-east-1/qwen.qwen3-coder-next": [5e-7, 12e-7, null, null, null], "bedrock/us-east-2/deepseek.v3.2": [62e-8, 185e-8, null, null, null], "us-east-2/deepseek.v3.2": [62e-8, 185e-8, null, null, null], "bedrock/us-east-2/minimax.minimax-m2.1": [3e-7, 12e-7, null, null, null], "us-east-2/minimax.minimax-m2.1": [3e-7, 12e-7, null, null, null], "bedrock/us-east-2/minimax.minimax-m2.5": [3e-7, 12e-7, null, null, null], "us-east-2/minimax.minimax-m2.5": [3e-7, 12e-7, null, null, null], "bedrock/us-east-2/moonshotai.kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "us-east-2/moonshotai.kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "bedrock/us-east-2/moonshotai.kimi-k2.5": [6e-7, 3e-6, null, null, null], "us-east-2/moonshotai.kimi-k2.5": [6e-7, 3e-6, null, null, null], "bedrock/us-east-2/qwen.qwen3-coder-next": [5e-7, 12e-7, null, null, null], "us-east-2/qwen.qwen3-coder-next": [5e-7, 12e-7, null, null, null], "bedrock/us-gov-east-1/amazon.nova-pro-v1:0": [96e-8, 384e-8, null, null, null], "us-gov-east-1/amazon.nova-pro-v1:0": [96e-8, 384e-8, null, null, null], "bedrock/us-gov-east-1/amazon.titan-embed-text-v1": [1e-7, 0, null, null, null], "us-gov-east-1/amazon.titan-embed-text-v1": [1e-7, 0, null, null, null], "bedrock/us-gov-east-1/amazon.titan-embed-text-v2:0": [2e-7, 0, null, null, null], "us-gov-east-1/amazon.titan-embed-text-v2:0": [2e-7, 0, null, null, null], "bedrock/us-gov-east-1/amazon.titan-text-express-v1": [13e-7, 17e-7, null, null, null], "us-gov-east-1/amazon.titan-text-express-v1": [13e-7, 17e-7, null, null, null], "bedrock/us-gov-east-1/amazon.titan-text-lite-v1": [3e-7, 4e-7, null, null, null], "us-gov-east-1/amazon.titan-text-lite-v1": [3e-7, 4e-7, null, null, null], "bedrock/us-gov-east-1/amazon.titan-text-premier-v1:0": [5e-7, 15e-7, null, null, null], "us-gov-east-1/amazon.titan-text-premier-v1:0": [5e-7, 15e-7, null, null, null], "bedrock/us-gov-east-1/anthropic.claude-3-5-sonnet-20240620-v1:0": [36e-7, 18e-6, 45e-7, 36e-8, null], "us-gov-east-1/anthropic.claude-3-5-sonnet-20240620-v1:0": [36e-7, 18e-6, 45e-7, 36e-8, null], "bedrock/us-gov-east-1/anthropic.claude-3-haiku-20240307-v1:0": [3e-7, 15e-7, 375e-9, 3e-8, null], "us-gov-east-1/anthropic.claude-3-haiku-20240307-v1:0": [3e-7, 15e-7, 375e-9, 3e-8, null], "bedrock/us-gov-east-1/anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "us-gov-east-1/anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "bedrock/us-gov-east-1/claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "us-gov-east-1/claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "bedrock/us-gov-east-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "us-gov-east-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "bedrock/us-gov-east-1/meta.llama3-8b-instruct-v1:0": [3e-7, 265e-8, null, null, null], "us-gov-east-1/meta.llama3-8b-instruct-v1:0": [3e-7, 265e-8, null, null, null], "bedrock/us-gov-west-1/amazon.nova-pro-v1:0": [96e-8, 384e-8, null, null, null], "us-gov-west-1/amazon.nova-pro-v1:0": [96e-8, 384e-8, null, null, null], "bedrock/us-gov-west-1/amazon.titan-embed-text-v1": [1e-7, 0, null, null, null], "us-gov-west-1/amazon.titan-embed-text-v1": [1e-7, 0, null, null, null], "bedrock/us-gov-west-1/amazon.titan-embed-text-v2:0": [2e-7, 0, null, null, null], "us-gov-west-1/amazon.titan-embed-text-v2:0": [2e-7, 0, null, null, null], "bedrock/us-gov-west-1/amazon.titan-text-express-v1": [13e-7, 17e-7, null, null, null], "us-gov-west-1/amazon.titan-text-express-v1": [13e-7, 17e-7, null, null, null], "bedrock/us-gov-west-1/amazon.titan-text-lite-v1": [3e-7, 4e-7, null, null, null], "us-gov-west-1/amazon.titan-text-lite-v1": [3e-7, 4e-7, null, null, null], "bedrock/us-gov-west-1/amazon.titan-text-premier-v1:0": [5e-7, 15e-7, null, null, null], "us-gov-west-1/amazon.titan-text-premier-v1:0": [5e-7, 15e-7, null, null, null], "bedrock/us-gov-west-1/anthropic.claude-3-7-sonnet-20250219-v1:0": [36e-7, 18e-6, 45e-7, 36e-8, null], "us-gov-west-1/anthropic.claude-3-7-sonnet-20250219-v1:0": [36e-7, 18e-6, 45e-7, 36e-8, null], "bedrock/us-gov-west-1/anthropic.claude-3-5-sonnet-20240620-v1:0": [36e-7, 18e-6, 45e-7, 36e-8, null], "us-gov-west-1/anthropic.claude-3-5-sonnet-20240620-v1:0": [36e-7, 18e-6, 45e-7, 36e-8, null], "bedrock/us-gov-west-1/anthropic.claude-3-haiku-20240307-v1:0": [3e-7, 15e-7, 375e-9, 3e-8, null], "us-gov-west-1/anthropic.claude-3-haiku-20240307-v1:0": [3e-7, 15e-7, 375e-9, 3e-8, null], "bedrock/us-gov-west-1/anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "us-gov-west-1/anthropic.claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "bedrock/us-gov-west-1/claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "us-gov-west-1/claude-sonnet-4-5-20250929-v1:0": [33e-7, 165e-7, 4125e-9, 33e-8, null], "bedrock/us-gov-west-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "us-gov-west-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "bedrock/us-gov-west-1/meta.llama3-8b-instruct-v1:0": [3e-7, 265e-8, null, null, null], "us-gov-west-1/meta.llama3-8b-instruct-v1:0": [3e-7, 265e-8, null, null, null], "bedrock/us-west-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "us-west-1/meta.llama3-70b-instruct-v1:0": [265e-8, 35e-7, null, null, null], "bedrock/us-west-1/meta.llama3-8b-instruct-v1:0": [3e-7, 6e-7, null, null, null], "us-west-1/meta.llama3-8b-instruct-v1:0": [3e-7, 6e-7, null, null, null], "bedrock/us-west-2/anthropic.claude-instant-v1": [8e-7, 24e-7, null, null, null], "us-west-2/anthropic.claude-instant-v1": [8e-7, 24e-7, null, null, null], "bedrock/us-west-2/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "us-west-2/anthropic.claude-v1": [8e-6, 24e-6, null, null, null], "bedrock/us-west-2/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "us-west-2/anthropic.claude-v2:1": [8e-6, 24e-6, null, null, null], "bedrock/us-west-2/mistral.mistral-7b-instruct-v0:2": [15e-8, 2e-7, null, null, null], "us-west-2/mistral.mistral-7b-instruct-v0:2": [15e-8, 2e-7, null, null, null], "bedrock/us-west-2/mistral.mistral-large-2402-v1:0": [8e-6, 24e-6, null, null, null], "us-west-2/mistral.mistral-large-2402-v1:0": [8e-6, 24e-6, null, null, null], "bedrock/us-west-2/mistral.mixtral-8x7b-instruct-v0:1": [45e-8, 7e-7, null, null, null], "us-west-2/mistral.mixtral-8x7b-instruct-v0:1": [45e-8, 7e-7, null, null, null], "bedrock/us-west-2/deepseek.v3.2": [62e-8, 185e-8, null, null, null], "us-west-2/deepseek.v3.2": [62e-8, 185e-8, null, null, null], "bedrock/us-west-2/minimax.minimax-m2.1": [3e-7, 12e-7, null, null, null], "us-west-2/minimax.minimax-m2.1": [3e-7, 12e-7, null, null, null], "bedrock/us-west-2/minimax.minimax-m2.5": [3e-7, 12e-7, null, null, null], "us-west-2/minimax.minimax-m2.5": [3e-7, 12e-7, null, null, null], "bedrock/us-west-2/moonshotai.kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "us-west-2/moonshotai.kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "bedrock/us-west-2/moonshotai.kimi-k2.5": [6e-7, 3e-6, null, null, null], "us-west-2/moonshotai.kimi-k2.5": [6e-7, 3e-6, null, null, null], "bedrock/us-west-2/qwen.qwen3-coder-next": [5e-7, 12e-7, null, null, null], "us-west-2/qwen.qwen3-coder-next": [5e-7, 12e-7, null, null, null], "bedrock/us.anthropic.claude-3-5-haiku-20241022-v1:0": [8e-7, 4e-6, 1e-6, 8e-8, null], "cerebras/llama-3.3-70b": [85e-8, 12e-7, null, null, null], "llama-3.3-70b": [85e-8, 12e-7, null, null, null], "cerebras/llama3.1-70b": [6e-7, 6e-7, null, null, null], "llama3.1-70b": [6e-7, 6e-7, null, null, null], "cerebras/llama3.1-8b": [1e-7, 1e-7, null, null, null], "llama3.1-8b": [1e-7, 1e-7, null, null, null], "cerebras/gpt-oss-120b": [35e-8, 75e-8, null, null, null], "cerebras/qwen-3-32b": [4e-7, 8e-7, null, null, null], "qwen-3-32b": [4e-7, 8e-7, null, null, null], "cerebras/zai-glm-4.6": [225e-8, 275e-8, null, null, null], "zai-glm-4.6": [225e-8, 275e-8, null, null, null], "cerebras/zai-glm-4.7": [225e-8, 275e-8, null, null, null], "zai-glm-4.7": [225e-8, 275e-8, null, null, null], "cloudflare/@cf/meta/llama-2-7b-chat-fp16": [1923e-9, 1923e-9, null, null, null], "@cf/meta/llama-2-7b-chat-fp16": [1923e-9, 1923e-9, null, null, null], "cloudflare/@cf/meta/llama-2-7b-chat-int8": [1923e-9, 1923e-9, null, null, null], "@cf/meta/llama-2-7b-chat-int8": [1923e-9, 1923e-9, null, null, null], "cloudflare/@cf/mistral/mistral-7b-instruct-v0.1": [1923e-9, 1923e-9, null, null, null], "@cf/mistral/mistral-7b-instruct-v0.1": [1923e-9, 1923e-9, null, null, null], "cloudflare/@hf/thebloke/codellama-7b-instruct-awq": [1923e-9, 1923e-9, null, null, null], "@hf/thebloke/codellama-7b-instruct-awq": [1923e-9, 1923e-9, null, null, null], "codestral/codestral-2405": [0, 0, null, null, null], "codestral-2405": [0, 0, null, null, null], "codestral/codestral-latest": [0, 0, null, null, null], "codestral-latest": [0, 0, null, null, null], "cohere/embed-v4.0": [12e-8, 0, null, null, null], "embed-v4.0": [12e-8, 0, null, null, null], "dashscope/qwen-coder": [3e-7, 15e-7, null, null, null], "qwen-coder": [3e-7, 15e-7, null, null, null], "dashscope/qwen-max": [16e-7, 64e-7, null, null, null], "qwen-max": [16e-7, 64e-7, null, null, null], "dashscope/qwen-plus": [4e-7, 12e-7, null, null, null], "qwen-plus": [4e-7, 12e-7, null, null, null], "dashscope/qwen-plus-2025-01-25": [4e-7, 12e-7, null, null, null], "qwen-plus-2025-01-25": [4e-7, 12e-7, null, null, null], "dashscope/qwen-plus-2025-04-28": [4e-7, 12e-7, null, null, null], "qwen-plus-2025-04-28": [4e-7, 12e-7, null, null, null], "dashscope/qwen-plus-2025-07-14": [4e-7, 12e-7, null, null, null], "qwen-plus-2025-07-14": [4e-7, 12e-7, null, null, null], "dashscope/qwen-turbo": [5e-8, 2e-7, null, null, null], "qwen-turbo": [5e-8, 2e-7, null, null, null], "dashscope/qwen-turbo-2024-11-01": [5e-8, 2e-7, null, null, null], "qwen-turbo-2024-11-01": [5e-8, 2e-7, null, null, null], "dashscope/qwen-turbo-2025-04-28": [5e-8, 2e-7, null, null, null], "qwen-turbo-2025-04-28": [5e-8, 2e-7, null, null, null], "dashscope/qwen-turbo-latest": [5e-8, 2e-7, null, null, null], "qwen-turbo-latest": [5e-8, 2e-7, null, null, null], "dashscope/qwen3-next-80b-a3b-instruct": [15e-8, 12e-7, null, null, null], "qwen3-next-80b-a3b-instruct": [15e-8, 12e-7, null, null, null], "dashscope/qwen3-next-80b-a3b-thinking": [15e-8, 12e-7, null, null, null], "qwen3-next-80b-a3b-thinking": [15e-8, 12e-7, null, null, null], "dashscope/qwen3-vl-235b-a22b-instruct": [4e-7, 16e-7, null, null, null], "qwen3-vl-235b-a22b-instruct": [4e-7, 16e-7, null, null, null], "dashscope/qwen3-vl-235b-a22b-thinking": [4e-7, 4e-6, null, null, null], "qwen3-vl-235b-a22b-thinking": [4e-7, 4e-6, null, null, null], "dashscope/qwen3-vl-32b-instruct": [16e-8, 64e-8, null, null, null], "qwen3-vl-32b-instruct": [16e-8, 64e-8, null, null, null], "dashscope/qwen3-vl-32b-thinking": [16e-8, 287e-8, null, null, null], "qwen3-vl-32b-thinking": [16e-8, 287e-8, null, null, null], "dashscope/qwq-plus": [8e-7, 24e-7, null, null, null], "qwq-plus": [8e-7, 24e-7, null, null, null], "databricks/databricks-bge-large-en": [10003e-11, 0, null, null, null], "databricks-bge-large-en": [10003e-11, 0, null, null, null], "databricks/databricks-claude-3-7-sonnet": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks-claude-3-7-sonnet": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks/databricks-claude-haiku-4-5": [100002e-11, 500003e-11, null, null, null], "databricks-claude-haiku-4-5": [100002e-11, 500003e-11, null, null, null], "databricks/databricks-claude-opus-4": [15000020000000002e-21, 7500003000000001e-20, null, null, null], "databricks-claude-opus-4": [15000020000000002e-21, 7500003000000001e-20, null, null, null], "databricks/databricks-claude-opus-4-1": [15000020000000002e-21, 7500003000000001e-20, null, null, null], "databricks-claude-opus-4-1": [15000020000000002e-21, 7500003000000001e-20, null, null, null], "databricks/databricks-claude-opus-4-5": [500003e-11, 25000010000000002e-21, null, null, null], "databricks-claude-opus-4-5": [500003e-11, 25000010000000002e-21, null, null, null], "databricks/databricks-claude-sonnet-4": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks-claude-sonnet-4": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks/databricks-claude-sonnet-4-1": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks-claude-sonnet-4-1": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks/databricks-claude-sonnet-4-5": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks-claude-sonnet-4-5": [29999900000000002e-22, 15000020000000002e-21, null, null, null], "databricks/databricks-gemini-2-5-flash": [30001999999999996e-23, 249998e-11, null, null, null], "databricks-gemini-2-5-flash": [30001999999999996e-23, 249998e-11, null, null, null], "databricks/databricks-gemini-2-5-pro": [124999e-11, 9999990000000002e-21, null, null, null], "databricks-gemini-2-5-pro": [124999e-11, 9999990000000002e-21, null, null, null], "databricks/databricks-gemma-3-12b": [15000999999999998e-23, 50001e-11, null, null, null], "databricks-gemma-3-12b": [15000999999999998e-23, 50001e-11, null, null, null], "databricks/databricks-gpt-5": [124999e-11, 9999990000000002e-21, null, null, null], "databricks-gpt-5": [124999e-11, 9999990000000002e-21, null, null, null], "databricks/databricks-gpt-5-1": [124999e-11, 9999990000000002e-21, null, null, null], "databricks-gpt-5-1": [124999e-11, 9999990000000002e-21, null, null, null], "databricks/databricks-gpt-5-mini": [24997000000000006e-23, 19999700000000004e-22, null, null, null], "databricks-gpt-5-mini": [24997000000000006e-23, 19999700000000004e-22, null, null, null], "databricks/databricks-gpt-5-nano": [4998e-11, 39998000000000007e-23, null, null, null], "databricks-gpt-5-nano": [4998e-11, 39998000000000007e-23, null, null, null], "databricks/databricks-gpt-oss-120b": [15000999999999998e-23, 59997e-11, null, null, null], "databricks-gpt-oss-120b": [15000999999999998e-23, 59997e-11, null, null, null], "databricks/databricks-gpt-oss-20b": [7e-8, 30001999999999996e-23, null, null, null], "databricks-gpt-oss-20b": [7e-8, 30001999999999996e-23, null, null, null], "databricks/databricks-gte-large-en": [12999000000000001e-23, 0, null, null, null], "databricks-gte-large-en": [12999000000000001e-23, 0, null, null, null], "databricks/databricks-llama-2-70b-chat": [50001e-11, 15000300000000002e-22, null, null, null], "databricks-llama-2-70b-chat": [50001e-11, 15000300000000002e-22, null, null, null], "databricks/databricks-llama-4-maverick": [50001e-11, 15000300000000002e-22, null, null, null], "databricks-llama-4-maverick": [50001e-11, 15000300000000002e-22, null, null, null], "databricks/databricks-meta-llama-3-1-405b-instruct": [500003e-11, 15000020000000002e-21, null, null, null], "databricks-meta-llama-3-1-405b-instruct": [500003e-11, 15000020000000002e-21, null, null, null], "databricks/databricks-meta-llama-3-1-8b-instruct": [15000999999999998e-23, 45003000000000007e-23, null, null, null], "databricks-meta-llama-3-1-8b-instruct": [15000999999999998e-23, 45003000000000007e-23, null, null, null], "databricks/databricks-meta-llama-3-3-70b-instruct": [50001e-11, 15000300000000002e-22, null, null, null], "databricks-meta-llama-3-3-70b-instruct": [50001e-11, 15000300000000002e-22, null, null, null], "databricks/databricks-meta-llama-3-70b-instruct": [100002e-11, 29999900000000002e-22, null, null, null], "databricks-meta-llama-3-70b-instruct": [100002e-11, 29999900000000002e-22, null, null, null], "databricks/databricks-mixtral-8x7b-instruct": [50001e-11, 100002e-11, null, null, null], "databricks-mixtral-8x7b-instruct": [50001e-11, 100002e-11, null, null, null], "databricks/databricks-mpt-30b-instruct": [100002e-11, 100002e-11, null, null, null], "databricks-mpt-30b-instruct": [100002e-11, 100002e-11, null, null, null], "databricks/databricks-mpt-7b-instruct": [50001e-11, 0, null, null, null], "databricks-mpt-7b-instruct": [50001e-11, 0, null, null, null], "deepinfra/Gryphe/MythoMax-L2-13b": [8e-8, 9e-8, null, null, null], "Gryphe/MythoMax-L2-13b": [8e-8, 9e-8, null, null, null], "deepinfra/NousResearch/Hermes-3-Llama-3.1-405B": [1e-6, 1e-6, null, null, null], "NousResearch/Hermes-3-Llama-3.1-405B": [1e-6, 1e-6, null, null, null], "deepinfra/NousResearch/Hermes-3-Llama-3.1-70B": [3e-7, 3e-7, null, null, null], "NousResearch/Hermes-3-Llama-3.1-70B": [3e-7, 3e-7, null, null, null], "deepinfra/Qwen/QwQ-32B": [15e-8, 4e-7, null, null, null], "Qwen/QwQ-32B": [15e-8, 4e-7, null, null, null], "deepinfra/Qwen/Qwen2.5-72B-Instruct": [12e-8, 39e-8, null, null, null], "Qwen/Qwen2.5-72B-Instruct": [12e-8, 39e-8, null, null, null], "deepinfra/Qwen/Qwen2.5-7B-Instruct": [4e-8, 1e-7, null, null, null], "Qwen/Qwen2.5-7B-Instruct": [4e-8, 1e-7, null, null, null], "deepinfra/Qwen/Qwen2.5-VL-32B-Instruct": [2e-7, 6e-7, null, null, null], "Qwen/Qwen2.5-VL-32B-Instruct": [2e-7, 6e-7, null, null, null], "deepinfra/Qwen/Qwen3-14B": [6e-8, 24e-8, null, null, null], "Qwen/Qwen3-14B": [6e-8, 24e-8, null, null, null], "deepinfra/Qwen/Qwen3-235B-A22B": [18e-8, 54e-8, null, null, null], "Qwen/Qwen3-235B-A22B": [18e-8, 54e-8, null, null, null], "deepinfra/Qwen/Qwen3-235B-A22B-Instruct-2507": [9e-8, 6e-7, null, null, null], "Qwen/Qwen3-235B-A22B-Instruct-2507": [9e-8, 6e-7, null, null, null], "deepinfra/Qwen/Qwen3-235B-A22B-Thinking-2507": [3e-7, 29e-7, null, null, null], "Qwen/Qwen3-235B-A22B-Thinking-2507": [3e-7, 29e-7, null, null, null], "deepinfra/Qwen/Qwen3-30B-A3B": [8e-8, 29e-8, null, null, null], "Qwen/Qwen3-30B-A3B": [8e-8, 29e-8, null, null, null], "deepinfra/Qwen/Qwen3-32B": [1e-7, 28e-8, null, null, null], "Qwen/Qwen3-32B": [1e-7, 28e-8, null, null, null], "deepinfra/Qwen/Qwen3-Coder-480B-A35B-Instruct": [4e-7, 16e-7, null, null, null], "Qwen/Qwen3-Coder-480B-A35B-Instruct": [4e-7, 16e-7, null, null, null], "deepinfra/Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo": [29e-8, 12e-7, null, null, null], "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo": [29e-8, 12e-7, null, null, null], "deepinfra/Qwen/Qwen3-Next-80B-A3B-Instruct": [14e-8, 14e-7, null, null, null], "Qwen/Qwen3-Next-80B-A3B-Instruct": [14e-8, 14e-7, null, null, null], "deepinfra/Qwen/Qwen3-Next-80B-A3B-Thinking": [14e-8, 14e-7, null, null, null], "Qwen/Qwen3-Next-80B-A3B-Thinking": [14e-8, 14e-7, null, null, null], "deepinfra/Sao10K/L3-8B-Lunaris-v1-Turbo": [4e-8, 5e-8, null, null, null], "Sao10K/L3-8B-Lunaris-v1-Turbo": [4e-8, 5e-8, null, null, null], "deepinfra/Sao10K/L3.1-70B-Euryale-v2.2": [65e-8, 75e-8, null, null, null], "Sao10K/L3.1-70B-Euryale-v2.2": [65e-8, 75e-8, null, null, null], "deepinfra/Sao10K/L3.3-70B-Euryale-v2.3": [65e-8, 75e-8, null, null, null], "Sao10K/L3.3-70B-Euryale-v2.3": [65e-8, 75e-8, null, null, null], "deepinfra/allenai/olmOCR-7B-0725-FP8": [27e-8, 15e-7, null, null, null], "allenai/olmOCR-7B-0725-FP8": [27e-8, 15e-7, null, null, null], "deepinfra/anthropic/claude-3-7-sonnet-latest": [33e-7, 165e-7, null, 33e-8, null], "anthropic/claude-3-7-sonnet-latest": [33e-7, 165e-7, null, 33e-8, null], "deepinfra/anthropic/claude-4-opus": [165e-7, 825e-7, null, null, null], "anthropic/claude-4-opus": [165e-7, 825e-7, null, null, null], "deepinfra/anthropic/claude-4-sonnet": [33e-7, 165e-7, null, null, null], "anthropic/claude-4-sonnet": [33e-7, 165e-7, null, null, null], "deepinfra/deepseek-ai/DeepSeek-R1": [7e-7, 24e-7, null, null, null], "deepseek-ai/DeepSeek-R1": [7e-7, 24e-7, null, null, null], "deepinfra/deepseek-ai/DeepSeek-R1-0528": [5e-7, 215e-8, null, 4e-7, null], "deepseek-ai/DeepSeek-R1-0528": [5e-7, 215e-8, null, 4e-7, null], "deepinfra/deepseek-ai/DeepSeek-R1-0528-Turbo": [1e-6, 3e-6, null, null, null], "deepseek-ai/DeepSeek-R1-0528-Turbo": [1e-6, 3e-6, null, null, null], "deepinfra/deepseek-ai/DeepSeek-R1-Distill-Llama-70B": [2e-7, 6e-7, null, null, null], "deepseek-ai/DeepSeek-R1-Distill-Llama-70B": [2e-7, 6e-7, null, null, null], "deepinfra/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B": [27e-8, 27e-8, null, null, null], "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B": [27e-8, 27e-8, null, null, null], "deepinfra/deepseek-ai/DeepSeek-R1-Turbo": [1e-6, 3e-6, null, null, null], "deepseek-ai/DeepSeek-R1-Turbo": [1e-6, 3e-6, null, null, null], "deepinfra/deepseek-ai/DeepSeek-V3": [38e-8, 89e-8, null, null, null], "deepseek-ai/DeepSeek-V3": [38e-8, 89e-8, null, null, null], "deepinfra/deepseek-ai/DeepSeek-V3-0324": [25e-8, 88e-8, null, null, null], "deepseek-ai/DeepSeek-V3-0324": [25e-8, 88e-8, null, null, null], "deepinfra/deepseek-ai/DeepSeek-V3.1": [27e-8, 1e-6, null, 216e-9, null], "deepseek-ai/DeepSeek-V3.1": [27e-8, 1e-6, null, 216e-9, null], "deepinfra/deepseek-ai/DeepSeek-V3.1-Terminus": [27e-8, 1e-6, null, 216e-9, null], "deepseek-ai/DeepSeek-V3.1-Terminus": [27e-8, 1e-6, null, 216e-9, null], "deepinfra/google/gemini-2.0-flash-001": [1e-7, 4e-7, null, null, null], "google/gemini-2.0-flash-001": [1e-7, 4e-7, null, null, null], "deepinfra/google/gemini-2.5-flash": [3e-7, 25e-7, null, null, null], "google/gemini-2.5-flash": [3e-7, 25e-7, null, null, null], "deepinfra/google/gemini-2.5-pro": [125e-8, 1e-5, null, null, null], "google/gemini-2.5-pro": [125e-8, 1e-5, null, null, null], "deepinfra/google/gemma-3-12b-it": [5e-8, 1e-7, null, null, null], "google/gemma-3-12b-it": [5e-8, 1e-7, null, null, null], "deepinfra/google/gemma-3-27b-it": [9e-8, 16e-8, null, null, null], "google/gemma-3-27b-it": [9e-8, 16e-8, null, null, null], "deepinfra/google/gemma-3-4b-it": [4e-8, 8e-8, null, null, null], "google/gemma-3-4b-it": [4e-8, 8e-8, null, null, null], "deepinfra/meta-llama/Llama-3.2-11B-Vision-Instruct": [49e-9, 49e-9, null, null, null], "meta-llama/Llama-3.2-11B-Vision-Instruct": [49e-9, 49e-9, null, null, null], "deepinfra/meta-llama/Llama-3.2-3B-Instruct": [2e-8, 2e-8, null, null, null], "meta-llama/Llama-3.2-3B-Instruct": [2e-8, 2e-8, null, null, null], "deepinfra/meta-llama/Llama-3.3-70B-Instruct": [23e-8, 4e-7, null, null, null], "meta-llama/Llama-3.3-70B-Instruct": [23e-8, 4e-7, null, null, null], "deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo": [13e-8, 39e-8, null, null, null], "meta-llama/Llama-3.3-70B-Instruct-Turbo": [13e-8, 39e-8, null, null, null], "deepinfra/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": [15e-8, 6e-7, null, null, null], "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": [15e-8, 6e-7, null, null, null], "deepinfra/meta-llama/Llama-4-Scout-17B-16E-Instruct": [8e-8, 3e-7, null, null, null], "meta-llama/Llama-4-Scout-17B-16E-Instruct": [8e-8, 3e-7, null, null, null], "deepinfra/meta-llama/Llama-Guard-3-8B": [55e-9, 55e-9, null, null, null], "meta-llama/Llama-Guard-3-8B": [55e-9, 55e-9, null, null, null], "deepinfra/meta-llama/Llama-Guard-4-12B": [18e-8, 18e-8, null, null, null], "meta-llama/Llama-Guard-4-12B": [18e-8, 18e-8, null, null, null], "deepinfra/meta-llama/Meta-Llama-3-8B-Instruct": [3e-8, 6e-8, null, null, null], "deepinfra/meta-llama/Meta-Llama-3.1-70B-Instruct": [4e-7, 4e-7, null, null, null], "meta-llama/Meta-Llama-3.1-70B-Instruct": [4e-7, 4e-7, null, null, null], "deepinfra/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": [1e-7, 28e-8, null, null, null], "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": [1e-7, 28e-8, null, null, null], "deepinfra/meta-llama/Meta-Llama-3.1-8B-Instruct": [3e-8, 5e-8, null, null, null], "meta-llama/Meta-Llama-3.1-8B-Instruct": [3e-8, 5e-8, null, null, null], "deepinfra/meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": [2e-8, 3e-8, null, null, null], "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": [2e-8, 3e-8, null, null, null], "deepinfra/microsoft/WizardLM-2-8x22B": [48e-8, 48e-8, null, null, null], "microsoft/WizardLM-2-8x22B": [48e-8, 48e-8, null, null, null], "deepinfra/microsoft/phi-4": [7e-8, 14e-8, null, null, null], "microsoft/phi-4": [7e-8, 14e-8, null, null, null], "deepinfra/mistralai/Mistral-Nemo-Instruct-2407": [2e-8, 4e-8, null, null, null], "mistralai/Mistral-Nemo-Instruct-2407": [2e-8, 4e-8, null, null, null], "deepinfra/mistralai/Mistral-Small-24B-Instruct-2501": [5e-8, 8e-8, null, null, null], "mistralai/Mistral-Small-24B-Instruct-2501": [5e-8, 8e-8, null, null, null], "deepinfra/mistralai/Mistral-Small-3.2-24B-Instruct-2506": [75e-9, 2e-7, null, null, null], "mistralai/Mistral-Small-3.2-24B-Instruct-2506": [75e-9, 2e-7, null, null, null], "deepinfra/mistralai/Mixtral-8x7B-Instruct-v0.1": [4e-7, 4e-7, null, null, null], "deepinfra/moonshotai/Kimi-K2-Instruct": [5e-7, 2e-6, null, null, null], "moonshotai/Kimi-K2-Instruct": [5e-7, 2e-6, null, null, null], "deepinfra/moonshotai/Kimi-K2-Instruct-0905": [5e-7, 2e-6, null, 4e-7, null], "moonshotai/Kimi-K2-Instruct-0905": [5e-7, 2e-6, null, 4e-7, null], "deepinfra/nvidia/Llama-3.1-Nemotron-70B-Instruct": [6e-7, 6e-7, null, null, null], "nvidia/Llama-3.1-Nemotron-70B-Instruct": [6e-7, 6e-7, null, null, null], "deepinfra/nvidia/Llama-3.3-Nemotron-Super-49B-v1.5": [1e-7, 4e-7, null, null, null], "nvidia/Llama-3.3-Nemotron-Super-49B-v1.5": [1e-7, 4e-7, null, null, null], "deepinfra/nvidia/NVIDIA-Nemotron-Nano-9B-v2": [4e-8, 16e-8, null, null, null], "nvidia/NVIDIA-Nemotron-Nano-9B-v2": [4e-8, 16e-8, null, null, null], "deepinfra/openai/gpt-oss-120b": [5e-8, 45e-8, null, null, null], "openai/gpt-oss-120b": [5e-8, 45e-8, null, null, null], "deepinfra/openai/gpt-oss-20b": [4e-8, 15e-8, null, null, null], "openai/gpt-oss-20b": [4e-8, 15e-8, null, null, null], "deepinfra/zai-org/GLM-4.5": [4e-7, 16e-7, null, null, null], "zai-org/GLM-4.5": [4e-7, 16e-7, null, null, null], "deepseek/deepseek-chat": [28e-8, 42e-8, 0, 28e-9, null], "deepseek/deepseek-coder": [14e-8, 28e-8, null, null, null], "deepseek-coder": [14e-8, 28e-8, null, null, null], "deepseek/deepseek-r1": [55e-8, 219e-8, null, null, null], "deepseek/deepseek-reasoner": [28e-8, 42e-8, null, 28e-9, null], "deepseek/deepseek-v3": [27e-8, 11e-7, 0, 7e-8, null], "deepseek/deepseek-v3.2": [28e-8, 4e-7, null, null, null], "fireworks_ai/WhereIsAI/UAE-Large-V1": [16e-9, 0, null, null, null], "WhereIsAI/UAE-Large-V1": [16e-9, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-v2-instruct": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-v2-instruct": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1": [3e-6, 8e-6, null, null, null], "accounts/fireworks/models/deepseek-r1": [3e-6, 8e-6, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-0528": [3e-6, 8e-6, null, null, null], "accounts/fireworks/models/deepseek-r1-0528": [3e-6, 8e-6, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-basic": [55e-8, 219e-8, null, null, null], "accounts/fireworks/models/deepseek-r1-basic": [55e-8, 219e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-v3": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/deepseek-v3": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-v3-0324": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/deepseek-v3-0324": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-v3p1": [56e-8, 168e-8, null, null, null], "accounts/fireworks/models/deepseek-v3p1": [56e-8, 168e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-v3p1-terminus": [56e-8, 168e-8, null, null, null], "accounts/fireworks/models/deepseek-v3p1-terminus": [56e-8, 168e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-v3p2": [56e-8, 168e-8, null, null, null], "accounts/fireworks/models/deepseek-v3p2": [56e-8, 168e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/firefunction-v2": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/firefunction-v2": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/glm-4p5": [55e-8, 219e-8, null, null, null], "accounts/fireworks/models/glm-4p5": [55e-8, 219e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/glm-4p5-air": [22e-8, 88e-8, null, null, null], "accounts/fireworks/models/glm-4p5-air": [22e-8, 88e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/glm-4p6": [55e-8, 219e-8, null, null, null], "accounts/fireworks/models/glm-4p6": [55e-8, 219e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/glm-4p7": [6e-7, 22e-7, null, 3e-7, null], "accounts/fireworks/models/glm-4p7": [6e-7, 22e-7, null, 3e-7, null], "fireworks_ai/accounts/fireworks/models/glm-5p1": [14e-7, 44e-7, null, 26e-8, null], "accounts/fireworks/models/glm-5p1": [14e-7, 44e-7, null, 26e-8, null], "fireworks_ai/accounts/fireworks/models/gpt-oss-120b": [15e-8, 6e-7, null, null, null], "accounts/fireworks/models/gpt-oss-120b": [15e-8, 6e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/gpt-oss-20b": [5e-8, 2e-7, null, null, null], "accounts/fireworks/models/gpt-oss-20b": [5e-8, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/kimi-k2-instruct": [6e-7, 25e-7, null, null, null], "accounts/fireworks/models/kimi-k2-instruct": [6e-7, 25e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/kimi-k2-instruct-0905": [6e-7, 25e-7, null, null, null], "accounts/fireworks/models/kimi-k2-instruct-0905": [6e-7, 25e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "accounts/fireworks/models/kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/kimi-k2p5": [6e-7, 3e-6, null, 1e-7, null], "accounts/fireworks/models/kimi-k2p5": [6e-7, 3e-6, null, 1e-7, null], "fireworks_ai/accounts/fireworks/models/llama-v3p1-405b-instruct": [3e-6, 3e-6, null, null, null], "accounts/fireworks/models/llama-v3p1-405b-instruct": [3e-6, 3e-6, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p1-8b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v3p1-8b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p2-11b-vision-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-v3p2-11b-vision-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p2-1b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v3p2-1b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p2-3b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v3p2-3b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p2-90b-vision-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llama-v3p2-90b-vision-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama4-maverick-instruct-basic": [22e-8, 88e-8, null, null, null], "accounts/fireworks/models/llama4-maverick-instruct-basic": [22e-8, 88e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/llama4-scout-instruct-basic": [15e-8, 6e-7, null, null, null], "accounts/fireworks/models/llama4-scout-instruct-basic": [15e-8, 6e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/minimax-m2p1": [3e-7, 12e-7, null, 3e-8, null], "accounts/fireworks/models/minimax-m2p1": [3e-7, 12e-7, null, 3e-8, null], "fireworks_ai/accounts/fireworks/models/mixtral-8x22b-instruct-hf": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/mixtral-8x22b-instruct-hf": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2-72b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2-72b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-32b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-32b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/yi-large": [3e-6, 3e-6, null, null, null], "accounts/fireworks/models/yi-large": [3e-6, 3e-6, null, null, null], "fireworks_ai/glm-4p7": [6e-7, 22e-7, null, 3e-7, null], "glm-4p7": [6e-7, 22e-7, null, 3e-7, null], "fireworks_ai/glm-5p1": [14e-7, 44e-7, null, 26e-8, null], "glm-5p1": [14e-7, 44e-7, null, 26e-8, null], "fireworks_ai/kimi-k2p5": [6e-7, 3e-6, null, 1e-7, null], "kimi-k2p5": [6e-7, 3e-6, null, 1e-7, null], "fireworks_ai/minimax-m2p1": [3e-7, 12e-7, null, 3e-8, null], "minimax-m2p1": [3e-7, 12e-7, null, 3e-8, null], "fireworks_ai/nomic-ai/nomic-embed-text-v1": [8e-9, 0, null, null, null], "nomic-ai/nomic-embed-text-v1": [8e-9, 0, null, null, null], "fireworks_ai/nomic-ai/nomic-embed-text-v1.5": [8e-9, 0, null, null, null], "nomic-ai/nomic-embed-text-v1.5": [8e-9, 0, null, null, null], "fireworks_ai/thenlper/gte-base": [8e-9, 0, null, null, null], "thenlper/gte-base": [8e-9, 0, null, null, null], "fireworks_ai/thenlper/gte-large": [16e-9, 0, null, null, null], "thenlper/gte-large": [16e-9, 0, null, null, null], "friendliai/meta-llama-3.1-70b-instruct": [6e-7, 6e-7, null, null, null], "meta-llama-3.1-70b-instruct": [6e-7, 6e-7, null, null, null], "friendliai/meta-llama-3.1-8b-instruct": [1e-7, 1e-7, null, null, null], "meta-llama-3.1-8b-instruct": [1e-7, 1e-7, null, null, null], "gemini/gemini-live-2.5-flash-preview-native-audio-09-2025": [3e-7, 2e-6, null, 75e-9, null], "vertex_ai/gemini-3-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "vertex_ai/gemini-3-flash-preview": [5e-7, 3e-6, null, 5e-8, null], "vertex_ai/gemini-3.5-flash": [15e-7, 9e-6, null, 15e-8, null], "vertex_ai/gemini-3.1-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "vertex_ai/gemini-3.1-pro-preview-customtools": [2e-6, 12e-6, null, 2e-7, null], "gemini/gemini-robotics-er-1.5-preview": [3e-7, 25e-7, null, 0, null], "vertex_ai/gemini-embedding-2-preview": [2e-7, 0, null, null, null], "vertex_ai/gemini-embedding-2": [2e-7, 0, null, null, null], "gemini/gemini-embedding-001": [15e-8, 0, null, null, null], "gemini/gemini-embedding-2-preview": [2e-7, 0, null, null, null], "gemini/gemini-embedding-2": [2e-7, 0, null, null, null], "gemini/gemini-1.5-flash": [75e-9, 0, null, null, null], "gemini-1.5-flash": [75e-9, 0, null, null, null], "gemini/gemini-2.0-flash": [1e-7, 4e-7, null, 25e-9, null], "gemini/gemini-2.0-flash-001": [1e-7, 4e-7, null, 25e-9, null], "gemini/gemini-2.0-flash-lite": [75e-9, 3e-7, null, 1875e-11, null], "gemini/gemini-2.5-flash": [3e-7, 25e-7, null, 3e-8, null], "gemini/gemini-2.5-flash-image": [3e-7, 25e-7, null, 3e-8, null], "gemini/gemini-3-pro-image-preview": [2e-6, 12e-6, null, null, null], "gemini/gemini-3.1-flash-image-preview": [25e-8, 15e-7, null, null, null], "gemini/deep-research-pro-preview-12-2025": [2e-6, 12e-6, null, null, null], "gemini/gemini-2.5-flash-lite": [1e-7, 4e-7, null, 1e-8, null], "gemini/gemini-2.5-flash-lite-preview-09-2025": [1e-7, 4e-7, null, 1e-8, null], "gemini/gemini-2.5-flash-preview-09-2025": [3e-7, 25e-7, null, 75e-9, null], "gemini/gemini-flash-latest": [3e-7, 25e-7, null, 75e-9, null], "gemini/gemini-flash-lite-latest": [1e-7, 4e-7, null, 25e-9, null], "gemini/gemini-2.5-flash-lite-preview-06-17": [1e-7, 4e-7, null, 25e-9, null], "gemini/gemini-2.5-flash-preview-tts": [3e-7, 25e-7, null, null, null], "gemini/gemini-2.5-pro": [125e-8, 1e-5, null, 125e-9, null], "gemini/gemini-2.5-computer-use-preview-10-2025": [125e-8, 1e-5, null, null, null], "gemini/gemini-3-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "gemini/gemini-3.1-flash-lite-preview": [25e-8, 15e-7, null, 25e-9, null], "gemini/gemini-3.1-flash-lite": [25e-8, 15e-7, null, 25e-9, null], "gemini/gemini-3-flash-preview": [5e-7, 3e-6, null, 5e-8, null], "gemini/gemini-3.5-flash": [15e-7, 9e-6, null, 15e-8, null], "gemini/gemini-3.1-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "gemini/gemini-3.1-pro-preview-customtools": [2e-6, 12e-6, null, 2e-7, null], "gemini/gemini-2.5-pro-preview-tts": [125e-8, 1e-5, null, 125e-9, null], "gemini/gemini-exp-1114": [0, 0, null, null, null], "gemini-exp-1114": [0, 0, null, null, null], "gemini/gemini-exp-1206": [0, 0, null, null, null], "gemini/gemini-gemma-2-27b-it": [35e-8, 105e-8, null, null, null], "gemini-gemma-2-27b-it": [35e-8, 105e-8, null, null, null], "gemini/gemini-gemma-2-9b-it": [35e-8, 105e-8, null, null, null], "gemini-gemma-2-9b-it": [35e-8, 105e-8, null, null, null], "gemini/gemma-3-27b-it": [0, 0, null, null, null], "gemma-3-27b-it": [0, 0, null, null, null], "gemini/learnlm-1.5-pro-experimental": [0, 0, null, null, null], "learnlm-1.5-pro-experimental": [0, 0, null, null, null], "gemini/lyria-3-clip-preview": [0, 0, null, null, null], "lyria-3-clip-preview": [0, 0, null, null, null], "gemini/lyria-3-pro-preview": [0, 0, null, null, null], "lyria-3-pro-preview": [0, 0, null, null, null], "gigachat/GigaChat-2-Lite": [0, 0, null, null, null], "GigaChat-2-Lite": [0, 0, null, null, null], "gigachat/GigaChat-2-Max": [0, 0, null, null, null], "GigaChat-2-Max": [0, 0, null, null, null], "gigachat/GigaChat-2-Pro": [0, 0, null, null, null], "GigaChat-2-Pro": [0, 0, null, null, null], "gigachat/Embeddings": [0, 0, null, null, null], Embeddings: [0, 0, null, null, null], "gigachat/Embeddings-2": [0, 0, null, null, null], "Embeddings-2": [0, 0, null, null, null], "gigachat/EmbeddingsGigaR": [0, 0, null, null, null], EmbeddingsGigaR: [0, 0, null, null, null], "gmi/anthropic/claude-opus-4.5": [5e-6, 25e-6, null, null, null], "anthropic/claude-opus-4.5": [5e-6, 25e-6, null, null, null], "gmi/anthropic/claude-sonnet-4.5": [3e-6, 15e-6, null, null, null], "anthropic/claude-sonnet-4.5": [3e-6, 15e-6, null, null, null], "gmi/anthropic/claude-sonnet-4": [3e-6, 15e-6, null, null, null], "anthropic/claude-sonnet-4": [3e-6, 15e-6, null, null, null], "gmi/anthropic/claude-opus-4": [15e-6, 75e-6, null, null, null], "anthropic/claude-opus-4": [15e-6, 75e-6, null, null, null], "gmi/openai/gpt-5.2": [175e-8, 14e-6, null, null, null], "openai/gpt-5.2": [175e-8, 14e-6, null, null, null], "gmi/openai/gpt-5.1": [125e-8, 1e-5, null, null, null], "openai/gpt-5.1": [125e-8, 1e-5, null, null, null], "gmi/openai/gpt-5": [125e-8, 1e-5, null, null, null], "openai/gpt-5": [125e-8, 1e-5, null, null, null], "gmi/openai/gpt-4o": [25e-7, 1e-5, null, null, null], "openai/gpt-4o": [25e-7, 1e-5, null, null, null], "gmi/openai/gpt-4o-mini": [15e-8, 6e-7, null, null, null], "openai/gpt-4o-mini": [15e-8, 6e-7, null, null, null], "gmi/deepseek-ai/DeepSeek-V3.2": [28e-8, 4e-7, null, null, null], "deepseek-ai/DeepSeek-V3.2": [28e-8, 4e-7, null, null, null], "gmi/deepseek-ai/DeepSeek-V3-0324": [28e-8, 88e-8, null, null, null], "gmi/google/gemini-3-pro-preview": [2e-6, 12e-6, null, null, null], "google/gemini-3-pro-preview": [2e-6, 12e-6, null, null, null], "gmi/google/gemini-3-flash-preview": [5e-7, 3e-6, null, null, null], "google/gemini-3-flash-preview": [5e-7, 3e-6, null, null, null], "gmi/moonshotai/Kimi-K2-Thinking": [8e-7, 12e-7, null, null, null], "moonshotai/Kimi-K2-Thinking": [8e-7, 12e-7, null, null, null], "gmi/MiniMaxAI/MiniMax-M2.1": [3e-7, 12e-7, null, null, null], "MiniMaxAI/MiniMax-M2.1": [3e-7, 12e-7, null, null, null], "baseten/MiniMaxAI/MiniMax-M2.5": [3e-7, 12e-7, null, null, null], "MiniMaxAI/MiniMax-M2.5": [3e-7, 12e-7, null, null, null], "baseten/nvidia/Nemotron-120B-A12B": [3e-7, 75e-8, null, null, null], "nvidia/Nemotron-120B-A12B": [3e-7, 75e-8, null, null, null], "baseten/zai-org/GLM-5": [95e-8, 315e-8, null, null, null], "zai-org/GLM-5": [95e-8, 315e-8, null, null, null], "baseten/zai-org/GLM-4.7": [6e-7, 22e-7, null, null, null], "zai-org/GLM-4.7": [6e-7, 22e-7, null, null, null], "baseten/zai-org/GLM-4.6": [6e-7, 22e-7, null, null, null], "zai-org/GLM-4.6": [6e-7, 22e-7, null, null, null], "baseten/moonshotai/Kimi-K2.5": [6e-7, 3e-6, null, null, null], "moonshotai/Kimi-K2.5": [6e-7, 3e-6, null, null, null], "baseten/moonshotai/Kimi-K2-Thinking": [6e-7, 25e-7, null, null, null], "baseten/moonshotai/Kimi-K2-Instruct-0905": [6e-7, 25e-7, null, null, null], "baseten/openai/gpt-oss-120b": [1e-7, 5e-7, null, null, null], "baseten/deepseek-ai/DeepSeek-V3.1": [5e-7, 15e-7, null, null, null], "baseten/deepseek-ai/DeepSeek-V3-0324": [77e-8, 77e-8, null, null, null], "gmi/Qwen/Qwen3-VL-235B-A22B-Instruct-FP8": [3e-7, 14e-7, null, null, null], "Qwen/Qwen3-VL-235B-A22B-Instruct-FP8": [3e-7, 14e-7, null, null, null], "gmi/zai-org/GLM-4.7-FP8": [4e-7, 2e-6, null, null, null], "zai-org/GLM-4.7-FP8": [4e-7, 2e-6, null, null, null], "gradient_ai/anthropic-claude-3-opus": [15e-6, 75e-6, null, null, null], "anthropic-claude-3-opus": [15e-6, 75e-6, null, null, null], "gradient_ai/anthropic-claude-3.5-haiku": [8e-7, 4e-6, null, null, null], "anthropic-claude-3.5-haiku": [8e-7, 4e-6, null, null, null], "gradient_ai/anthropic-claude-3.5-sonnet": [3e-6, 15e-6, null, null, null], "anthropic-claude-3.5-sonnet": [3e-6, 15e-6, null, null, null], "gradient_ai/anthropic-claude-3.7-sonnet": [3e-6, 15e-6, null, null, null], "anthropic-claude-3.7-sonnet": [3e-6, 15e-6, null, null, null], "gradient_ai/deepseek-r1-distill-llama-70b": [99e-8, 99e-8, null, null, null], "deepseek-r1-distill-llama-70b": [99e-8, 99e-8, null, null, null], "gradient_ai/llama3-8b-instruct": [2e-7, 2e-7, null, null, null], "llama3-8b-instruct": [2e-7, 2e-7, null, null, null], "gradient_ai/llama3.3-70b-instruct": [65e-8, 65e-8, null, null, null], "llama3.3-70b-instruct": [65e-8, 65e-8, null, null, null], "gradient_ai/mistral-nemo-instruct-2407": [3e-7, 3e-7, null, null, null], "mistral-nemo-instruct-2407": [3e-7, 3e-7, null, null, null], "gradient_ai/openai-o3": [2e-6, 8e-6, null, null, null], "openai-o3": [2e-6, 8e-6, null, null, null], "gradient_ai/openai-o3-mini": [11e-7, 44e-7, null, null, null], "openai-o3-mini": [11e-7, 44e-7, null, null, null], "lemonade/Qwen3-Coder-30B-A3B-Instruct-GGUF": [0, 0, null, null, null], "Qwen3-Coder-30B-A3B-Instruct-GGUF": [0, 0, null, null, null], "lemonade/gpt-oss-20b-mxfp4-GGUF": [0, 0, null, null, null], "gpt-oss-20b-mxfp4-GGUF": [0, 0, null, null, null], "lemonade/gpt-oss-120b-mxfp-GGUF": [0, 0, null, null, null], "gpt-oss-120b-mxfp-GGUF": [0, 0, null, null, null], "lemonade/Gemma-3-4b-it-GGUF": [0, 0, null, null, null], "Gemma-3-4b-it-GGUF": [0, 0, null, null, null], "lemonade/Qwen3-4B-Instruct-2507-GGUF": [0, 0, null, null, null], "Qwen3-4B-Instruct-2507-GGUF": [0, 0, null, null, null], "amazon-nova/nova-micro-v1": [35e-9, 14e-8, null, null, null], "nova-micro-v1": [35e-9, 14e-8, null, null, null], "amazon-nova/nova-lite-v1": [6e-8, 24e-8, null, null, null], "nova-lite-v1": [6e-8, 24e-8, null, null, null], "amazon-nova/nova-premier-v1": [25e-7, 125e-7, null, null, null], "nova-premier-v1": [25e-7, 125e-7, null, null, null], "amazon-nova/nova-pro-v1": [8e-7, 32e-7, null, null, null], "nova-pro-v1": [8e-7, 32e-7, null, null, null], "groq/llama-3.1-8b-instant": [5e-8, 8e-8, null, null, null], "llama-3.1-8b-instant": [5e-8, 8e-8, null, null, null], "groq/llama-3.3-70b-versatile": [59e-8, 79e-8, null, null, null], "llama-3.3-70b-versatile": [59e-8, 79e-8, null, null, null], "groq/gemma-7b-it": [5e-8, 8e-8, null, null, null], "gemma-7b-it": [5e-8, 8e-8, null, null, null], "groq/meta-llama/llama-guard-4-12b": [2e-7, 2e-7, null, null, null], "meta-llama/llama-guard-4-12b": [2e-7, 2e-7, null, null, null], "groq/meta-llama/llama-4-maverick-17b-128e-instruct": [2e-7, 6e-7, null, null, null], "meta-llama/llama-4-maverick-17b-128e-instruct": [2e-7, 6e-7, null, null, null], "groq/meta-llama/llama-4-scout-17b-16e-instruct": [11e-8, 34e-8, null, null, null], "meta-llama/llama-4-scout-17b-16e-instruct": [11e-8, 34e-8, null, null, null], "groq/moonshotai/kimi-k2-instruct-0905": [1e-6, 3e-6, null, 5e-7, null], "moonshotai/kimi-k2-instruct-0905": [1e-6, 3e-6, null, 5e-7, null], "groq/openai/gpt-oss-120b": [15e-8, 6e-7, null, 75e-9, null], "groq/openai/gpt-oss-20b": [75e-9, 3e-7, null, 375e-10, null], "groq/openai/gpt-oss-safeguard-20b": [75e-9, 3e-7, null, 37e-9, null], "openai/gpt-oss-safeguard-20b": [75e-9, 3e-7, null, 37e-9, null], "groq/qwen/qwen3-32b": [29e-8, 59e-8, null, null, null], "qwen/qwen3-32b": [29e-8, 59e-8, null, null, null], "hyperbolic/NousResearch/Hermes-3-Llama-3.1-70B": [12e-8, 3e-7, null, null, null], "hyperbolic/Qwen/QwQ-32B": [2e-7, 2e-7, null, null, null], "hyperbolic/Qwen/Qwen2.5-72B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/Qwen/Qwen2.5-Coder-32B-Instruct": [12e-8, 3e-7, null, null, null], "Qwen/Qwen2.5-Coder-32B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/Qwen/Qwen3-235B-A22B": [2e-6, 2e-6, null, null, null], "hyperbolic/deepseek-ai/DeepSeek-R1": [4e-7, 4e-7, null, null, null], "hyperbolic/deepseek-ai/DeepSeek-R1-0528": [25e-8, 25e-8, null, null, null], "hyperbolic/deepseek-ai/DeepSeek-V3": [2e-7, 2e-7, null, null, null], "hyperbolic/deepseek-ai/DeepSeek-V3-0324": [4e-7, 4e-7, null, null, null], "hyperbolic/meta-llama/Llama-3.2-3B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/meta-llama/Llama-3.3-70B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/meta-llama/Meta-Llama-3-70B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/meta-llama/Meta-Llama-3.1-405B-Instruct": [12e-8, 3e-7, null, null, null], "meta-llama/Meta-Llama-3.1-405B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/meta-llama/Meta-Llama-3.1-70B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/meta-llama/Meta-Llama-3.1-8B-Instruct": [12e-8, 3e-7, null, null, null], "hyperbolic/moonshotai/Kimi-K2-Instruct": [2e-6, 2e-6, null, null, null], "crusoe/deepseek-ai/DeepSeek-R1-0528": [3e-6, 7e-6, null, null, null], "crusoe/deepseek-ai/DeepSeek-V3-0324": [15e-7, 15e-7, null, null, null], "crusoe/google/gemma-3-12b-it": [1e-7, 1e-7, null, null, null], "crusoe/meta-llama/Llama-3.3-70B-Instruct": [2e-7, 2e-7, null, null, null], "crusoe/moonshotai/Kimi-K2-Thinking": [25e-7, 25e-7, null, null, null], "crusoe/openai/gpt-oss-120b": [8e-7, 8e-7, null, null, null], "crusoe/Qwen/Qwen3-235B-A22B-Instruct-2507": [3e-6, 3e-6, null, null, null], "lambda_ai/deepseek-llama3.3-70b": [2e-7, 6e-7, null, null, null], "deepseek-llama3.3-70b": [2e-7, 6e-7, null, null, null], "lambda_ai/deepseek-r1-0528": [2e-7, 6e-7, null, null, null], "deepseek-r1-0528": [2e-7, 6e-7, null, null, null], "lambda_ai/deepseek-r1-671b": [8e-7, 8e-7, null, null, null], "deepseek-r1-671b": [8e-7, 8e-7, null, null, null], "lambda_ai/deepseek-v3-0324": [2e-7, 6e-7, null, null, null], "lambda_ai/hermes3-405b": [8e-7, 8e-7, null, null, null], "hermes3-405b": [8e-7, 8e-7, null, null, null], "lambda_ai/hermes3-70b": [12e-8, 3e-7, null, null, null], "hermes3-70b": [12e-8, 3e-7, null, null, null], "lambda_ai/hermes3-8b": [25e-9, 4e-8, null, null, null], "hermes3-8b": [25e-9, 4e-8, null, null, null], "lambda_ai/lfm-40b": [1e-7, 2e-7, null, null, null], "lfm-40b": [1e-7, 2e-7, null, null, null], "lambda_ai/lfm-7b": [25e-9, 4e-8, null, null, null], "lfm-7b": [25e-9, 4e-8, null, null, null], "lambda_ai/llama-4-maverick-17b-128e-instruct-fp8": [5e-8, 1e-7, null, null, null], "llama-4-maverick-17b-128e-instruct-fp8": [5e-8, 1e-7, null, null, null], "lambda_ai/llama-4-scout-17b-16e-instruct": [5e-8, 1e-7, null, null, null], "llama-4-scout-17b-16e-instruct": [5e-8, 1e-7, null, null, null], "lambda_ai/llama3.1-405b-instruct-fp8": [8e-7, 8e-7, null, null, null], "llama3.1-405b-instruct-fp8": [8e-7, 8e-7, null, null, null], "lambda_ai/llama3.1-70b-instruct-fp8": [12e-8, 3e-7, null, null, null], "llama3.1-70b-instruct-fp8": [12e-8, 3e-7, null, null, null], "lambda_ai/llama3.1-8b-instruct": [25e-9, 4e-8, null, null, null], "llama3.1-8b-instruct": [25e-9, 4e-8, null, null, null], "lambda_ai/llama3.1-nemotron-70b-instruct-fp8": [12e-8, 3e-7, null, null, null], "llama3.1-nemotron-70b-instruct-fp8": [12e-8, 3e-7, null, null, null], "lambda_ai/llama3.2-11b-vision-instruct": [15e-9, 25e-9, null, null, null], "llama3.2-11b-vision-instruct": [15e-9, 25e-9, null, null, null], "lambda_ai/llama3.2-3b-instruct": [15e-9, 25e-9, null, null, null], "llama3.2-3b-instruct": [15e-9, 25e-9, null, null, null], "lambda_ai/llama3.3-70b-instruct-fp8": [12e-8, 3e-7, null, null, null], "llama3.3-70b-instruct-fp8": [12e-8, 3e-7, null, null, null], "lambda_ai/qwen25-coder-32b-instruct": [5e-8, 1e-7, null, null, null], "qwen25-coder-32b-instruct": [5e-8, 1e-7, null, null, null], "lambda_ai/qwen3-32b-fp8": [5e-8, 1e-7, null, null, null], "qwen3-32b-fp8": [5e-8, 1e-7, null, null, null], "minimax/MiniMax-M2.1": [3e-7, 12e-7, 375e-9, 3e-8, null], "MiniMax-M2.1": [3e-7, 12e-7, 375e-9, 3e-8, null], "minimax/MiniMax-M2.1-lightning": [3e-7, 24e-7, 375e-9, 3e-8, null], "MiniMax-M2.1-lightning": [3e-7, 24e-7, 375e-9, 3e-8, null], "minimax/MiniMax-M2.5": [3e-7, 12e-7, 375e-9, 3e-8, null], "MiniMax-M2.5": [3e-7, 12e-7, 375e-9, 3e-8, null], "minimax/MiniMax-M2.5-lightning": [3e-7, 24e-7, 375e-9, 3e-8, null], "MiniMax-M2.5-lightning": [3e-7, 24e-7, 375e-9, 3e-8, null], "minimax/MiniMax-M2": [3e-7, 12e-7, 375e-9, 3e-8, null], "MiniMax-M2": [3e-7, 12e-7, 375e-9, 3e-8, null], "mistral/codestral-2405": [1e-6, 3e-6, null, null, null], "mistral/codestral-2508": [3e-7, 9e-7, null, null, null], "codestral-2508": [3e-7, 9e-7, null, null, null], "mistral/codestral-latest": [1e-6, 3e-6, null, null, null], "mistral/codestral-mamba-latest": [25e-8, 25e-8, null, null, null], "codestral-mamba-latest": [25e-8, 25e-8, null, null, null], "mistral/devstral-medium-2507": [4e-7, 2e-6, null, null, null], "devstral-medium-2507": [4e-7, 2e-6, null, null, null], "mistral/devstral-small-2505": [1e-7, 3e-7, null, null, null], "devstral-small-2505": [1e-7, 3e-7, null, null, null], "mistral/devstral-small-2507": [1e-7, 3e-7, null, null, null], "devstral-small-2507": [1e-7, 3e-7, null, null, null], "mistral/devstral-small-latest": [1e-7, 3e-7, null, null, null], "devstral-small-latest": [1e-7, 3e-7, null, null, null], "mistral/labs-devstral-small-2512": [1e-7, 3e-7, null, null, null], "labs-devstral-small-2512": [1e-7, 3e-7, null, null, null], "mistral/devstral-latest": [4e-7, 2e-6, null, null, null], "devstral-latest": [4e-7, 2e-6, null, null, null], "mistral/devstral-medium-latest": [4e-7, 2e-6, null, null, null], "devstral-medium-latest": [4e-7, 2e-6, null, null, null], "mistral/devstral-2512": [4e-7, 2e-6, null, null, null], "devstral-2512": [4e-7, 2e-6, null, null, null], "mistral/magistral-medium-2506": [2e-6, 5e-6, null, null, null], "magistral-medium-2506": [2e-6, 5e-6, null, null, null], "mistral/magistral-medium-2509": [2e-6, 5e-6, null, null, null], "magistral-medium-2509": [2e-6, 5e-6, null, null, null], "mistral/magistral-medium-1-2-2509": [2e-6, 5e-6, null, null, null], "magistral-medium-1-2-2509": [2e-6, 5e-6, null, null, null], "mistral/magistral-medium-latest": [2e-6, 5e-6, null, null, null], "magistral-medium-latest": [2e-6, 5e-6, null, null, null], "mistral/magistral-small-2506": [5e-7, 15e-7, null, null, null], "magistral-small-2506": [5e-7, 15e-7, null, null, null], "mistral/magistral-small-latest": [5e-7, 15e-7, null, null, null], "magistral-small-latest": [5e-7, 15e-7, null, null, null], "mistral/magistral-small-1-2-2509": [5e-7, 15e-7, null, null, null], "magistral-small-1-2-2509": [5e-7, 15e-7, null, null, null], "mistral/mistral-large-2402": [4e-6, 12e-6, null, null, null], "mistral/mistral-large-2407": [3e-6, 9e-6, null, null, null], "mistral/mistral-large-2411": [2e-6, 6e-6, null, null, null], "mistral-large-2411": [2e-6, 6e-6, null, null, null], "mistral/mistral-large-latest": [5e-7, 15e-7, null, null, null], "mistral/mistral-large-3": [5e-7, 15e-7, null, null, null], "mistral/mistral-large-2512": [5e-7, 15e-7, null, null, null], "mistral-large-2512": [5e-7, 15e-7, null, null, null], "mistral/mistral-medium": [27e-7, 81e-7, null, null, null], "mistral-medium": [27e-7, 81e-7, null, null, null], "mistral/mistral-medium-2312": [27e-7, 81e-7, null, null, null], "mistral-medium-2312": [27e-7, 81e-7, null, null, null], "mistral/mistral-medium-2505": [4e-7, 2e-6, null, null, null], "mistral/mistral-medium-latest": [4e-7, 2e-6, null, null, null], "mistral-medium-latest": [4e-7, 2e-6, null, null, null], "mistral/mistral-medium-3-1-2508": [4e-7, 2e-6, null, null, null], "mistral-medium-3-1-2508": [4e-7, 2e-6, null, null, null], "mistral/mistral-small": [1e-7, 3e-7, null, null, null], "mistral/mistral-small-latest": [6e-8, 18e-8, null, null, null], "mistral-small-latest": [6e-8, 18e-8, null, null, null], "mistral/mistral-small-3-2-2506": [6e-8, 18e-8, null, null, null], "mistral-small-3-2-2506": [6e-8, 18e-8, null, null, null], "mistral/ministral-3-3b-2512": [1e-7, 1e-7, null, null, null], "ministral-3-3b-2512": [1e-7, 1e-7, null, null, null], "mistral/ministral-3-8b-2512": [15e-8, 15e-8, null, null, null], "ministral-3-8b-2512": [15e-8, 15e-8, null, null, null], "mistral/ministral-3-14b-2512": [2e-7, 2e-7, null, null, null], "ministral-3-14b-2512": [2e-7, 2e-7, null, null, null], "mistral/ministral-8b-2512": [15e-8, 15e-8, null, null, null], "ministral-8b-2512": [15e-8, 15e-8, null, null, null], "mistral/mistral-tiny": [25e-8, 25e-8, null, null, null], "mistral-tiny": [25e-8, 25e-8, null, null, null], "mistral/open-codestral-mamba": [25e-8, 25e-8, null, null, null], "open-codestral-mamba": [25e-8, 25e-8, null, null, null], "mistral/open-mistral-7b": [25e-8, 25e-8, null, null, null], "open-mistral-7b": [25e-8, 25e-8, null, null, null], "mistral/open-mistral-nemo": [3e-7, 3e-7, null, null, null], "open-mistral-nemo": [3e-7, 3e-7, null, null, null], "mistral/open-mistral-nemo-2407": [3e-7, 3e-7, null, null, null], "open-mistral-nemo-2407": [3e-7, 3e-7, null, null, null], "mistral/open-mixtral-8x22b": [2e-6, 6e-6, null, null, null], "open-mixtral-8x22b": [2e-6, 6e-6, null, null, null], "mistral/open-mixtral-8x7b": [7e-7, 7e-7, null, null, null], "open-mixtral-8x7b": [7e-7, 7e-7, null, null, null], "mistral/pixtral-12b-2409": [15e-8, 15e-8, null, null, null], "pixtral-12b-2409": [15e-8, 15e-8, null, null, null], "mistral/pixtral-large-2411": [2e-6, 6e-6, null, null, null], "pixtral-large-2411": [2e-6, 6e-6, null, null, null], "mistral/pixtral-large-latest": [2e-6, 6e-6, null, null, null], "pixtral-large-latest": [2e-6, 6e-6, null, null, null], "moonshot/kimi-k2-0711-preview": [6e-7, 25e-7, null, 15e-8, null], "kimi-k2-0711-preview": [6e-7, 25e-7, null, 15e-8, null], "moonshot/kimi-k2-0905-preview": [6e-7, 25e-7, null, 15e-8, null], "kimi-k2-0905-preview": [6e-7, 25e-7, null, 15e-8, null], "moonshot/kimi-k2-turbo-preview": [115e-8, 8e-6, null, 15e-8, null], "kimi-k2-turbo-preview": [115e-8, 8e-6, null, 15e-8, null], "moonshot/kimi-k2.5": [6e-7, 3e-6, null, 1e-7, null], "moonshot/kimi-k2.6": [95e-8, 4e-6, null, 16e-8, null], "kimi-k2.6": [95e-8, 4e-6, null, 16e-8, null], "moonshot/kimi-latest": [2e-6, 5e-6, null, 15e-8, null], "kimi-latest": [2e-6, 5e-6, null, 15e-8, null], "moonshot/kimi-latest-128k": [2e-6, 5e-6, null, 15e-8, null], "kimi-latest-128k": [2e-6, 5e-6, null, 15e-8, null], "moonshot/kimi-latest-32k": [1e-6, 3e-6, null, 15e-8, null], "kimi-latest-32k": [1e-6, 3e-6, null, 15e-8, null], "moonshot/kimi-latest-8k": [2e-7, 2e-6, null, 15e-8, null], "kimi-latest-8k": [2e-7, 2e-6, null, 15e-8, null], "moonshot/kimi-thinking-preview": [6e-7, 25e-7, null, 15e-8, null], "kimi-thinking-preview": [6e-7, 25e-7, null, 15e-8, null], "moonshot/kimi-k2-thinking": [6e-7, 25e-7, null, 15e-8, null], "kimi-k2-thinking": [6e-7, 25e-7, null, 15e-8, null], "moonshot/kimi-k2-thinking-turbo": [115e-8, 8e-6, null, 15e-8, null], "kimi-k2-thinking-turbo": [115e-8, 8e-6, null, 15e-8, null], "moonshot/moonshot-v1-128k": [2e-6, 5e-6, null, null, null], "moonshot-v1-128k": [2e-6, 5e-6, null, null, null], "moonshot/moonshot-v1-128k-0430": [2e-6, 5e-6, null, null, null], "moonshot-v1-128k-0430": [2e-6, 5e-6, null, null, null], "moonshot/moonshot-v1-128k-vision-preview": [2e-6, 5e-6, null, null, null], "moonshot-v1-128k-vision-preview": [2e-6, 5e-6, null, null, null], "moonshot/moonshot-v1-32k": [1e-6, 3e-6, null, null, null], "moonshot-v1-32k": [1e-6, 3e-6, null, null, null], "moonshot/moonshot-v1-32k-0430": [1e-6, 3e-6, null, null, null], "moonshot-v1-32k-0430": [1e-6, 3e-6, null, null, null], "moonshot/moonshot-v1-32k-vision-preview": [1e-6, 3e-6, null, null, null], "moonshot-v1-32k-vision-preview": [1e-6, 3e-6, null, null, null], "moonshot/moonshot-v1-8k": [2e-7, 2e-6, null, null, null], "moonshot-v1-8k": [2e-7, 2e-6, null, null, null], "moonshot/moonshot-v1-8k-0430": [2e-7, 2e-6, null, null, null], "moonshot-v1-8k-0430": [2e-7, 2e-6, null, null, null], "moonshot/moonshot-v1-8k-vision-preview": [2e-7, 2e-6, null, null, null], "moonshot-v1-8k-vision-preview": [2e-7, 2e-6, null, null, null], "moonshot/moonshot-v1-auto": [2e-6, 5e-6, null, null, null], "moonshot-v1-auto": [2e-6, 5e-6, null, null, null], "morph/morph-v3-fast": [8e-7, 12e-7, null, null, null], "morph-v3-fast": [8e-7, 12e-7, null, null, null], "morph/morph-v3-large": [9e-7, 19e-7, null, null, null], "morph-v3-large": [9e-7, 19e-7, null, null, null], "nscale/Qwen/QwQ-32B": [18e-8, 2e-7, null, null, null], "nscale/Qwen/Qwen2.5-Coder-32B-Instruct": [6e-8, 2e-7, null, null, null], "nscale/Qwen/Qwen2.5-Coder-3B-Instruct": [1e-8, 3e-8, null, null, null], "Qwen/Qwen2.5-Coder-3B-Instruct": [1e-8, 3e-8, null, null, null], "nscale/Qwen/Qwen2.5-Coder-7B-Instruct": [1e-8, 3e-8, null, null, null], "Qwen/Qwen2.5-Coder-7B-Instruct": [1e-8, 3e-8, null, null, null], "nscale/deepseek-ai/DeepSeek-R1-Distill-Llama-70B": [375e-9, 375e-9, null, null, null], "nscale/deepseek-ai/DeepSeek-R1-Distill-Llama-8B": [25e-9, 25e-9, null, null, null], "deepseek-ai/DeepSeek-R1-Distill-Llama-8B": [25e-9, 25e-9, null, null, null], "nscale/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B": [9e-8, 9e-8, null, null, null], "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B": [9e-8, 9e-8, null, null, null], "nscale/deepseek-ai/DeepSeek-R1-Distill-Qwen-14B": [7e-8, 7e-8, null, null, null], "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B": [7e-8, 7e-8, null, null, null], "nscale/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B": [15e-8, 15e-8, null, null, null], "nscale/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B": [2e-7, 2e-7, null, null, null], "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B": [2e-7, 2e-7, null, null, null], "nscale/meta-llama/Llama-3.1-8B-Instruct": [3e-8, 3e-8, null, null, null], "meta-llama/Llama-3.1-8B-Instruct": [3e-8, 3e-8, null, null, null], "nscale/meta-llama/Llama-3.3-70B-Instruct": [2e-7, 2e-7, null, null, null], "nscale/meta-llama/Llama-4-Scout-17B-16E-Instruct": [9e-8, 29e-8, null, null, null], "nscale/mistralai/mixtral-8x22b-instruct-v0.1": [6e-7, 6e-7, null, null, null], "mistralai/mixtral-8x22b-instruct-v0.1": [6e-7, 6e-7, null, null, null], "nebius/deepseek-ai/DeepSeek-R1": [8e-7, 24e-7, null, null, null], "nebius/deepseek-ai/DeepSeek-R1-0528": [8e-7, 24e-7, null, null, null], "nebius/deepseek-ai/DeepSeek-R1-Distill-Llama-70B": [25e-8, 75e-8, null, null, null], "nebius/deepseek-ai/DeepSeek-V3": [5e-7, 15e-7, null, null, null], "nebius/deepseek-ai/DeepSeek-V3-0324": [5e-7, 15e-7, null, null, null], "nebius/google/gemma-3-27b-it": [6e-8, 2e-7, null, null, null], "nebius/meta-llama/Llama-3.3-70B-Instruct": [13e-8, 4e-7, null, null, null], "nebius/meta-llama/Llama-Guard-3-8B": [2e-8, 6e-8, null, null, null], "nebius/meta-llama/Meta-Llama-3.1-8B-Instruct": [2e-8, 6e-8, null, null, null], "nebius/meta-llama/Meta-Llama-3.1-70B-Instruct": [13e-8, 4e-7, null, null, null], "nebius/meta-llama/Meta-Llama-3.1-405B-Instruct": [1e-6, 3e-6, null, null, null], "nebius/mistralai/Mistral-Nemo-Instruct-2407": [4e-8, 12e-8, null, null, null], "nebius/NousResearch/Hermes-3-Llama-3.1-405B": [1e-6, 3e-6, null, null, null], "nebius/nvidia/Llama-3.1-Nemotron-Ultra-253B-v1": [6e-7, 18e-7, null, null, null], "nvidia/Llama-3.1-Nemotron-Ultra-253B-v1": [6e-7, 18e-7, null, null, null], "nebius/nvidia/Llama-3.3-Nemotron-Super-49B-v1": [1e-7, 4e-7, null, null, null], "nvidia/Llama-3.3-Nemotron-Super-49B-v1": [1e-7, 4e-7, null, null, null], "nebius/Qwen/Qwen3-235B-A22B": [2e-7, 6e-7, null, null, null], "nebius/Qwen/Qwen3-32B": [1e-7, 3e-7, null, null, null], "nebius/Qwen/Qwen3-30B-A3B": [1e-7, 3e-7, null, null, null], "nebius/Qwen/Qwen3-14B": [8e-8, 24e-8, null, null, null], "nebius/Qwen/Qwen3-4B": [8e-8, 24e-8, null, null, null], "Qwen/Qwen3-4B": [8e-8, 24e-8, null, null, null], "nebius/Qwen/QwQ-32B": [15e-8, 45e-8, null, null, null], "nebius/Qwen/Qwen2.5-72B-Instruct": [13e-8, 4e-7, null, null, null], "nebius/Qwen/Qwen2.5-32B-Instruct": [6e-8, 2e-7, null, null, null], "Qwen/Qwen2.5-32B-Instruct": [6e-8, 2e-7, null, null, null], "nebius/Qwen/Qwen2.5-Coder-7B": [1e-8, 3e-8, null, null, null], "Qwen/Qwen2.5-Coder-7B": [1e-8, 3e-8, null, null, null], "nebius/Qwen/Qwen2.5-VL-72B-Instruct": [13e-8, 4e-7, null, null, null], "Qwen/Qwen2.5-VL-72B-Instruct": [13e-8, 4e-7, null, null, null], "nebius/Qwen/Qwen2-VL-72B-Instruct": [13e-8, 4e-7, null, null, null], "Qwen/Qwen2-VL-72B-Instruct": [13e-8, 4e-7, null, null, null], "nebius/Qwen/Qwen2-VL-7B-Instruct": [2e-8, 6e-8, null, null, null], "Qwen/Qwen2-VL-7B-Instruct": [2e-8, 6e-8, null, null, null], "nebius/BAAI/bge-en-icl": [1e-8, 0, null, null, null], "BAAI/bge-en-icl": [1e-8, 0, null, null, null], "nebius/BAAI/bge-multilingual-gemma2": [1e-8, 0, null, null, null], "BAAI/bge-multilingual-gemma2": [1e-8, 0, null, null, null], "nebius/intfloat/e5-mistral-7b-instruct": [1e-8, 0, null, null, null], "intfloat/e5-mistral-7b-instruct": [1e-8, 0, null, null, null], "oci/meta.llama-3.1-8b-instruct": [72e-8, 72e-8, null, null, null], "meta.llama-3.1-8b-instruct": [72e-8, 72e-8, null, null, null], "oci/meta.llama-3.1-70b-instruct": [72e-8, 72e-8, null, null, null], "meta.llama-3.1-70b-instruct": [72e-8, 72e-8, null, null, null], "oci/meta.llama-3.1-405b-instruct": [1068e-8, 1068e-8, null, null, null], "meta.llama-3.1-405b-instruct": [1068e-8, 1068e-8, null, null, null], "oci/meta.llama-3.2-90b-vision-instruct": [2e-6, 2e-6, null, null, null], "meta.llama-3.2-90b-vision-instruct": [2e-6, 2e-6, null, null, null], "oci/meta.llama-3.3-70b-instruct": [72e-8, 72e-8, null, null, null], "meta.llama-3.3-70b-instruct": [72e-8, 72e-8, null, null, null], "oci/meta.llama-4-maverick-17b-128e-instruct-fp8": [72e-8, 72e-8, null, null, null], "meta.llama-4-maverick-17b-128e-instruct-fp8": [72e-8, 72e-8, null, null, null], "oci/meta.llama-4-scout-17b-16e-instruct": [72e-8, 72e-8, null, null, null], "meta.llama-4-scout-17b-16e-instruct": [72e-8, 72e-8, null, null, null], "oci/xai.grok-3": [3e-6, 15e-6, null, null, null], "xai.grok-3": [3e-6, 15e-6, null, null, null], "oci/xai.grok-3-fast": [5e-6, 25e-6, null, null, null], "xai.grok-3-fast": [5e-6, 25e-6, null, null, null], "oci/xai.grok-3-mini": [3e-7, 5e-7, null, null, null], "xai.grok-3-mini": [3e-7, 5e-7, null, null, null], "oci/xai.grok-3-mini-fast": [6e-7, 4e-6, null, null, null], "xai.grok-3-mini-fast": [6e-7, 4e-6, null, null, null], "oci/xai.grok-4": [3e-6, 15e-6, null, null, null], "xai.grok-4": [3e-6, 15e-6, null, null, null], "oci/cohere.command-latest": [156e-8, 156e-8, null, null, null], "cohere.command-latest": [156e-8, 156e-8, null, null, null], "oci/cohere.command-a-03-2025": [156e-8, 156e-8, null, null, null], "cohere.command-a-03-2025": [156e-8, 156e-8, null, null, null], "oci/cohere.command-plus-latest": [156e-8, 156e-8, null, null, null], "cohere.command-plus-latest": [156e-8, 156e-8, null, null, null], "oci/google.gemini-2.5-flash": [15e-8, 6e-7, null, null, null], "google.gemini-2.5-flash": [15e-8, 6e-7, null, null, null], "oci/google.gemini-2.5-pro": [125e-8, 1e-5, null, null, null], "google.gemini-2.5-pro": [125e-8, 1e-5, null, null, null], "oci/google.gemini-2.5-flash-lite": [75e-9, 3e-7, null, null, null], "google.gemini-2.5-flash-lite": [75e-9, 3e-7, null, null, null], "oci/cohere.command-a-vision": [156e-8, 156e-8, null, null, null], "cohere.command-a-vision": [156e-8, 156e-8, null, null, null], "oci/cohere.command-a-reasoning": [156e-8, 156e-8, null, null, null], "cohere.command-a-reasoning": [156e-8, 156e-8, null, null, null], "oci/cohere.command-a-reasoning-08-2025": [156e-8, 156e-8, null, null, null], "cohere.command-a-reasoning-08-2025": [156e-8, 156e-8, null, null, null], "oci/cohere.command-a-vision-07-2025": [156e-8, 156e-8, null, null, null], "cohere.command-a-vision-07-2025": [156e-8, 156e-8, null, null, null], "oci/cohere.command-a-translate-08-2025": [9e-8, 9e-8, null, null, null], "cohere.command-a-translate-08-2025": [9e-8, 9e-8, null, null, null], "oci/cohere.command-r-08-2024": [15e-8, 15e-8, null, null, null], "cohere.command-r-08-2024": [15e-8, 15e-8, null, null, null], "oci/cohere.command-r-plus-08-2024": [156e-8, 156e-8, null, null, null], "cohere.command-r-plus-08-2024": [156e-8, 156e-8, null, null, null], "oci/meta.llama-3.2-11b-vision-instruct": [2e-6, 2e-6, null, null, null], "meta.llama-3.2-11b-vision-instruct": [2e-6, 2e-6, null, null, null], "oci/meta.llama-3.3-70b-instruct-fp8-dynamic": [72e-8, 72e-8, null, null, null], "meta.llama-3.3-70b-instruct-fp8-dynamic": [72e-8, 72e-8, null, null, null], "oci/xai.grok-4-fast": [5e-6, 25e-6, null, null, null], "xai.grok-4-fast": [5e-6, 25e-6, null, null, null], "oci/xai.grok-4.1-fast": [5e-6, 25e-6, null, null, null], "xai.grok-4.1-fast": [5e-6, 25e-6, null, null, null], "oci/xai.grok-4.20": [3e-6, 15e-6, null, null, null], "xai.grok-4.20": [3e-6, 15e-6, null, null, null], "oci/xai.grok-4.20-multi-agent": [3e-6, 15e-6, null, null, null], "xai.grok-4.20-multi-agent": [3e-6, 15e-6, null, null, null], "oci/xai.grok-code-fast-1": [5e-6, 25e-6, null, null, null], "xai.grok-code-fast-1": [5e-6, 25e-6, null, null, null], "oci/openai.gpt-5": [125e-8, 1e-5, null, null, null], "openai.gpt-5": [125e-8, 1e-5, null, null, null], "oci/openai.gpt-5-mini": [25e-8, 2e-6, null, null, null], "openai.gpt-5-mini": [25e-8, 2e-6, null, null, null], "oci/openai.gpt-5-nano": [5e-8, 4e-7, null, null, null], "openai.gpt-5-nano": [5e-8, 4e-7, null, null, null], "oci/cohere.embed-english-v3.0": [1e-7, 0, null, null, null], "cohere.embed-english-v3.0": [1e-7, 0, null, null, null], "oci/cohere.embed-english-light-v3.0": [1e-7, 0, null, null, null], "cohere.embed-english-light-v3.0": [1e-7, 0, null, null, null], "oci/cohere.embed-multilingual-v3.0": [1e-7, 0, null, null, null], "cohere.embed-multilingual-v3.0": [1e-7, 0, null, null, null], "oci/cohere.embed-multilingual-light-v3.0": [1e-7, 0, null, null, null], "cohere.embed-multilingual-light-v3.0": [1e-7, 0, null, null, null], "oci/cohere.embed-english-image-v3.0": [1e-7, 0, null, null, null], "cohere.embed-english-image-v3.0": [1e-7, 0, null, null, null], "oci/cohere.embed-english-light-image-v3.0": [1e-7, 0, null, null, null], "cohere.embed-english-light-image-v3.0": [1e-7, 0, null, null, null], "oci/cohere.embed-multilingual-light-image-v3.0": [1e-7, 0, null, null, null], "cohere.embed-multilingual-light-image-v3.0": [1e-7, 0, null, null, null], "oci/cohere.embed-v4.0": [12e-8, 0, null, null, null], "cohere.embed-v4.0": [12e-8, 0, null, null, null], "ollama/codegeex4": [0, 0, null, null, null], codegeex4: [0, 0, null, null, null], "ollama/codegemma": [0, 0, null, null, null], codegemma: [0, 0, null, null, null], "ollama/codellama": [0, 0, null, null, null], codellama: [0, 0, null, null, null], "ollama/deepseek-coder-v2-base": [0, 0, null, null, null], "deepseek-coder-v2-base": [0, 0, null, null, null], "ollama/deepseek-coder-v2-instruct": [0, 0, null, null, null], "deepseek-coder-v2-instruct": [0, 0, null, null, null], "ollama/deepseek-coder-v2-lite-base": [0, 0, null, null, null], "deepseek-coder-v2-lite-base": [0, 0, null, null, null], "ollama/deepseek-coder-v2-lite-instruct": [0, 0, null, null, null], "deepseek-coder-v2-lite-instruct": [0, 0, null, null, null], "ollama/deepseek-v3.1:671b-cloud": [0, 0, null, null, null], "deepseek-v3.1:671b-cloud": [0, 0, null, null, null], "ollama/gpt-oss:120b-cloud": [0, 0, null, null, null], "gpt-oss:120b-cloud": [0, 0, null, null, null], "ollama/gpt-oss:20b-cloud": [0, 0, null, null, null], "gpt-oss:20b-cloud": [0, 0, null, null, null], "ollama/internlm2_5-20b-chat": [0, 0, null, null, null], "internlm2_5-20b-chat": [0, 0, null, null, null], "ollama/llama2": [0, 0, null, null, null], llama2: [0, 0, null, null, null], "ollama/llama2-uncensored": [0, 0, null, null, null], "llama2-uncensored": [0, 0, null, null, null], "ollama/llama2:13b": [0, 0, null, null, null], "llama2:13b": [0, 0, null, null, null], "ollama/llama2:70b": [0, 0, null, null, null], "llama2:70b": [0, 0, null, null, null], "ollama/llama2:7b": [0, 0, null, null, null], "llama2:7b": [0, 0, null, null, null], "ollama/llama3": [0, 0, null, null, null], llama3: [0, 0, null, null, null], "ollama/llama3.1": [0, 0, null, null, null], "llama3.1": [0, 0, null, null, null], "ollama/llama3:70b": [0, 0, null, null, null], "llama3:70b": [0, 0, null, null, null], "ollama/llama3:8b": [0, 0, null, null, null], "llama3:8b": [0, 0, null, null, null], "ollama/mistral": [0, 0, null, null, null], mistral: [0, 0, null, null, null], "ollama/mistral-7B-Instruct-v0.1": [0, 0, null, null, null], "mistral-7B-Instruct-v0.1": [0, 0, null, null, null], "ollama/mistral-7B-Instruct-v0.2": [0, 0, null, null, null], "mistral-7B-Instruct-v0.2": [0, 0, null, null, null], "ollama/mistral-large-instruct-2407": [0, 0, null, null, null], "mistral-large-instruct-2407": [0, 0, null, null, null], "ollama/mixtral-8x22B-Instruct-v0.1": [0, 0, null, null, null], "mixtral-8x22B-Instruct-v0.1": [0, 0, null, null, null], "ollama/mixtral-8x7B-Instruct-v0.1": [0, 0, null, null, null], "mixtral-8x7B-Instruct-v0.1": [0, 0, null, null, null], "ollama/orca-mini": [0, 0, null, null, null], "orca-mini": [0, 0, null, null, null], "ollama/qwen3-coder:480b-cloud": [0, 0, null, null, null], "qwen3-coder:480b-cloud": [0, 0, null, null, null], "ollama/vicuna": [0, 0, null, null, null], vicuna: [0, 0, null, null, null], "openrouter/anthropic/claude-3-haiku": [25e-8, 125e-8, null, null, null], "anthropic/claude-3-haiku": [25e-8, 125e-8, null, null, null], "openrouter/anthropic/claude-3.5-sonnet": [3e-6, 15e-6, null, null, null], "anthropic/claude-3.5-sonnet": [3e-6, 15e-6, null, null, null], "openrouter/anthropic/claude-3.7-sonnet": [3e-6, 15e-6, null, null, null], "anthropic/claude-3.7-sonnet": [3e-6, 15e-6, null, null, null], "openrouter/anthropic/claude-opus-4": [15e-6, 75e-6, 1875e-8, 15e-7, null], "openrouter/anthropic/claude-opus-4.1": [15e-6, 75e-6, 1875e-8, 15e-7, null], "anthropic/claude-opus-4.1": [15e-6, 75e-6, 1875e-8, 15e-7, null], "openrouter/anthropic/claude-sonnet-4": [3e-6, 15e-6, 375e-8, 3e-7, null], "openrouter/anthropic/claude-sonnet-4.6": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic/claude-sonnet-4.6": [3e-6, 15e-6, 375e-8, 3e-7, null], "openrouter/anthropic/claude-opus-4.5": [5e-6, 25e-6, 625e-8, 5e-7, null], "openrouter/anthropic/claude-opus-4.6": [5e-6, 25e-6, 625e-8, 5e-7, null], "anthropic/claude-opus-4.6": [5e-6, 25e-6, 625e-8, 5e-7, null], "openrouter/anthropic/claude-sonnet-4.5": [3e-6, 15e-6, 375e-8, 3e-7, null], "openrouter/anthropic/claude-haiku-4.5": [1e-6, 5e-6, 125e-8, 1e-7, null], "anthropic/claude-haiku-4.5": [1e-6, 5e-6, 125e-8, 1e-7, null], "openrouter/anthropic/claude-opus-4.7": [5e-6, 25e-6, 625e-8, 5e-7, null], "anthropic/claude-opus-4.7": [5e-6, 25e-6, 625e-8, 5e-7, null], "openrouter/bytedance/ui-tars-1.5-7b": [1e-7, 2e-7, null, null, null], "bytedance/ui-tars-1.5-7b": [1e-7, 2e-7, null, null, null], "openrouter/deepseek/deepseek-chat": [14e-8, 28e-8, null, null, null], "openrouter/deepseek/deepseek-chat-v3-0324": [14e-8, 28e-8, null, null, null], "deepseek/deepseek-chat-v3-0324": [14e-8, 28e-8, null, null, null], "openrouter/deepseek/deepseek-chat-v3.1": [2e-7, 8e-7, null, null, null], "deepseek/deepseek-chat-v3.1": [2e-7, 8e-7, null, null, null], "openrouter/deepseek/deepseek-v3.2": [28e-8, 4e-7, null, null, null], "openrouter/deepseek/deepseek-v3.2-exp": [2e-7, 4e-7, null, null, null], "deepseek/deepseek-v3.2-exp": [2e-7, 4e-7, null, null, null], "openrouter/deepseek/deepseek-r1": [55e-8, 219e-8, null, null, null], "openrouter/deepseek/deepseek-r1-0528": [5e-7, 215e-8, null, null, null], "deepseek/deepseek-r1-0528": [5e-7, 215e-8, null, null, null], "openrouter/google/gemini-2.0-flash-001": [1e-7, 4e-7, null, null, null], "openrouter/google/gemini-2.5-flash": [3e-7, 25e-7, null, null, null], "openrouter/google/gemini-2.5-pro": [125e-8, 1e-5, null, null, null], "openrouter/google/gemini-3-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "openrouter/google/gemini-3-flash-preview": [5e-7, 3e-6, null, 5e-8, null], "openrouter/google/gemini-3.1-flash-lite-preview": [25e-8, 15e-7, null, 25e-9, null], "google/gemini-3.1-flash-lite-preview": [25e-8, 15e-7, null, 25e-9, null], "openrouter/google/gemini-3.1-flash-lite": [25e-8, 15e-7, null, 25e-9, null], "google/gemini-3.1-flash-lite": [25e-8, 15e-7, null, 25e-9, null], "openrouter/google/gemini-3.1-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "google/gemini-3.1-pro-preview": [2e-6, 12e-6, null, 2e-7, null], "openrouter/gryphe/mythomax-l2-13b": [1875e-9, 1875e-9, null, null, null], "gryphe/mythomax-l2-13b": [1875e-9, 1875e-9, null, null, null], "openrouter/mancer/weaver": [5625e-9, 5625e-9, null, null, null], "mancer/weaver": [5625e-9, 5625e-9, null, null, null], "openrouter/meta-llama/llama-3-70b-instruct": [59e-8, 79e-8, null, null, null], "meta-llama/llama-3-70b-instruct": [59e-8, 79e-8, null, null, null], "openrouter/minimax/minimax-m2": [255e-9, 102e-8, null, null, null], "minimax/minimax-m2": [255e-9, 102e-8, null, null, null], "openrouter/mistralai/devstral-2512": [15e-8, 6e-7, null, null, null], "mistralai/devstral-2512": [15e-8, 6e-7, null, null, null], "openrouter/mistralai/ministral-3b-2512": [1e-7, 1e-7, null, null, null], "mistralai/ministral-3b-2512": [1e-7, 1e-7, null, null, null], "openrouter/mistralai/ministral-8b-2512": [15e-8, 15e-8, null, null, null], "mistralai/ministral-8b-2512": [15e-8, 15e-8, null, null, null], "openrouter/mistralai/ministral-14b-2512": [2e-7, 2e-7, null, null, null], "mistralai/ministral-14b-2512": [2e-7, 2e-7, null, null, null], "openrouter/mistralai/mistral-large-2512": [5e-7, 15e-7, null, null, null], "mistralai/mistral-large-2512": [5e-7, 15e-7, null, null, null], "openrouter/mistralai/mistral-7b-instruct": [13e-8, 13e-8, null, null, null], "mistralai/mistral-7b-instruct": [13e-8, 13e-8, null, null, null], "openrouter/mistralai/mistral-large": [8e-6, 24e-6, null, null, null], "mistralai/mistral-large": [8e-6, 24e-6, null, null, null], "openrouter/mistralai/mistral-small-3.1-24b-instruct": [1e-7, 3e-7, null, null, null], "mistralai/mistral-small-3.1-24b-instruct": [1e-7, 3e-7, null, null, null], "openrouter/mistralai/mistral-small-3.2-24b-instruct": [1e-7, 3e-7, null, null, null], "mistralai/mistral-small-3.2-24b-instruct": [1e-7, 3e-7, null, null, null], "openrouter/mistralai/mixtral-8x22b-instruct": [65e-8, 65e-8, null, null, null], "mistralai/mixtral-8x22b-instruct": [65e-8, 65e-8, null, null, null], "openrouter/moonshotai/kimi-k2.5": [6e-7, 3e-6, null, 1e-7, null], "moonshotai/kimi-k2.5": [6e-7, 3e-6, null, 1e-7, null], "openrouter/openai/gpt-3.5-turbo": [15e-7, 2e-6, null, null, null], "openai/gpt-3.5-turbo": [15e-7, 2e-6, null, null, null], "openrouter/openai/gpt-3.5-turbo-16k": [3e-6, 4e-6, null, null, null], "openai/gpt-3.5-turbo-16k": [3e-6, 4e-6, null, null, null], "openrouter/openai/gpt-4": [3e-5, 6e-5, null, null, null], "openai/gpt-4": [3e-5, 6e-5, null, null, null], "openrouter/openai/gpt-4.1": [2e-6, 8e-6, null, 5e-7, null], "openai/gpt-4.1": [2e-6, 8e-6, null, 5e-7, null], "openrouter/openai/gpt-4.1-mini": [4e-7, 16e-7, null, 1e-7, null], "openai/gpt-4.1-mini": [4e-7, 16e-7, null, 1e-7, null], "openrouter/openai/gpt-4.1-nano": [1e-7, 4e-7, null, 25e-9, null], "openai/gpt-4.1-nano": [1e-7, 4e-7, null, 25e-9, null], "openrouter/openai/gpt-4o": [25e-7, 1e-5, null, null, null], "openrouter/openai/gpt-4o-2024-05-13": [5e-6, 15e-6, null, null, null], "openai/gpt-4o-2024-05-13": [5e-6, 15e-6, null, null, null], "openrouter/openai/gpt-5-chat": [125e-8, 1e-5, null, 125e-9, null], "openai/gpt-5-chat": [125e-8, 1e-5, null, 125e-9, null], "openrouter/openai/gpt-5-codex": [125e-8, 1e-5, null, 125e-9, null], "openai/gpt-5-codex": [125e-8, 1e-5, null, 125e-9, null], "openrouter/openai/gpt-5.2-codex": [175e-8, 14e-6, null, 175e-9, null], "openai/gpt-5.2-codex": [175e-8, 14e-6, null, 175e-9, null], "openrouter/openai/gpt-5": [125e-8, 1e-5, null, 125e-9, null], "openrouter/openai/gpt-5-mini": [25e-8, 2e-6, null, 25e-9, null], "openai/gpt-5-mini": [25e-8, 2e-6, null, 25e-9, null], "openrouter/openai/gpt-5-nano": [5e-8, 4e-7, null, 5e-9, null], "openai/gpt-5-nano": [5e-8, 4e-7, null, 5e-9, null], "openrouter/openai/gpt-5.1-codex-max": [125e-8, 1e-5, null, 125e-9, null], "openai/gpt-5.1-codex-max": [125e-8, 1e-5, null, 125e-9, null], "openrouter/openai/gpt-5.2": [175e-8, 14e-6, null, 175e-9, null], "openrouter/openai/gpt-5.2-chat": [175e-8, 14e-6, null, 175e-9, null], "openai/gpt-5.2-chat": [175e-8, 14e-6, null, 175e-9, null], "openrouter/openai/gpt-5.2-pro": [21e-6, 168e-6, null, null, null], "openai/gpt-5.2-pro": [21e-6, 168e-6, null, null, null], "openrouter/openai/gpt-oss-120b": [18e-8, 8e-7, null, null, null], "openrouter/openai/gpt-oss-20b": [2e-8, 1e-7, null, null, null], "openrouter/openai/o1": [15e-6, 6e-5, null, 75e-7, null], "openai/o1": [15e-6, 6e-5, null, 75e-7, null], "openrouter/openai/o3-mini": [11e-7, 44e-7, null, null, null], "openai/o3-mini": [11e-7, 44e-7, null, null, null], "openrouter/openai/o3-mini-high": [11e-7, 44e-7, null, null, null], "openai/o3-mini-high": [11e-7, 44e-7, null, null, null], "openrouter/qwen/qwen-2.5-coder-32b-instruct": [18e-8, 18e-8, null, null, null], "qwen/qwen-2.5-coder-32b-instruct": [18e-8, 18e-8, null, null, null], "openrouter/qwen/qwen-vl-plus": [21e-8, 63e-8, null, null, null], "qwen/qwen-vl-plus": [21e-8, 63e-8, null, null, null], "openrouter/qwen/qwen3-coder": [22e-8, 95e-8, null, null, null], "qwen/qwen3-coder": [22e-8, 95e-8, null, null, null], "openrouter/qwen/qwen3-coder-plus": [1e-6, 5e-6, null, null, null], "qwen/qwen3-coder-plus": [1e-6, 5e-6, null, null, null], "openrouter/qwen/qwen3-235b-a22b-2507": [71e-9, 1e-7, null, null, null], "qwen/qwen3-235b-a22b-2507": [71e-9, 1e-7, null, null, null], "openrouter/qwen/qwen3-235b-a22b-thinking-2507": [11e-8, 6e-7, null, null, null], "qwen/qwen3-235b-a22b-thinking-2507": [11e-8, 6e-7, null, null, null], "openrouter/qwen/qwen3.6-plus": [325e-9, 195e-8, null, null, null], "qwen/qwen3.6-plus": [325e-9, 195e-8, null, null, null], "openrouter/qwen/qwen3.5-35b-a3b": [25e-8, 2e-6, null, null, null], "qwen/qwen3.5-35b-a3b": [25e-8, 2e-6, null, null, null], "openrouter/qwen/qwen3.5-27b": [3e-7, 24e-7, null, null, null], "qwen/qwen3.5-27b": [3e-7, 24e-7, null, null, null], "openrouter/qwen/qwen3.5-122b-a10b": [4e-7, 2e-6, null, null, null], "qwen/qwen3.5-122b-a10b": [4e-7, 2e-6, null, null, null], "openrouter/qwen/qwen3.5-flash-02-23": [1e-7, 4e-7, null, null, null], "qwen/qwen3.5-flash-02-23": [1e-7, 4e-7, null, null, null], "openrouter/qwen/qwen3.5-plus-02-15": [4e-7, 24e-7, null, null, null], "qwen/qwen3.5-plus-02-15": [4e-7, 24e-7, null, null, null], "openrouter/qwen/qwen3.5-397b-a17b": [6e-7, 36e-7, null, null, null], "qwen/qwen3.5-397b-a17b": [6e-7, 36e-7, null, null, null], "openrouter/switchpoint/router": [85e-8, 34e-7, null, null, null], "switchpoint/router": [85e-8, 34e-7, null, null, null], "openrouter/undi95/remm-slerp-l2-13b": [1875e-9, 1875e-9, null, null, null], "undi95/remm-slerp-l2-13b": [1875e-9, 1875e-9, null, null, null], "openrouter/x-ai/grok-4": [3e-6, 15e-6, null, null, null], "x-ai/grok-4": [3e-6, 15e-6, null, null, null], "openrouter/z-ai/glm-4.6": [4e-7, 175e-8, null, null, null], "z-ai/glm-4.6": [4e-7, 175e-8, null, null, null], "openrouter/z-ai/glm-4.6:exacto": [45e-8, 19e-7, null, null, null], "z-ai/glm-4.6:exacto": [45e-8, 19e-7, null, null, null], "openrouter/xiaomi/mimo-v2-flash": [1e-7, 3e-7, 0, 1e-8, null], "xiaomi/mimo-v2-flash": [1e-7, 3e-7, 0, 1e-8, null], "openrouter/xiaomi/mimo-v2.5-pro": [1e-6, 3e-6, 0, 2e-7, null], "xiaomi/mimo-v2.5-pro": [1e-6, 3e-6, 0, 2e-7, null], "openrouter/xiaomi/mimo-v2.5": [4e-7, 2e-6, 0, 8e-8, null], "xiaomi/mimo-v2.5": [4e-7, 2e-6, 0, 8e-8, null], "openrouter/z-ai/glm-4.7": [4e-7, 15e-7, 0, 0, null], "z-ai/glm-4.7": [4e-7, 15e-7, 0, 0, null], "openrouter/z-ai/glm-4.7-flash": [7e-8, 4e-7, 0, 0, null], "z-ai/glm-4.7-flash": [7e-8, 4e-7, 0, 0, null], "openrouter/z-ai/glm-5": [8e-7, 256e-8, null, null, null], "z-ai/glm-5": [8e-7, 256e-8, null, null, null], "openrouter/minimax/minimax-m2.1": [27e-8, 12e-7, 0, 0, null], "minimax/minimax-m2.1": [27e-8, 12e-7, 0, 0, null], "openrouter/minimax/minimax-m2.5": [3e-7, 11e-7, null, 15e-8, null], "minimax/minimax-m2.5": [3e-7, 11e-7, null, 15e-8, null], "openrouter/openrouter/auto": [0, 0, null, null, null], "openrouter/auto": [0, 0, null, null, null], "openrouter/openrouter/free": [0, 0, null, null, null], "openrouter/free": [0, 0, null, null, null], "openrouter/openrouter/bodybuilder": [0, 0, null, null, null], "openrouter/bodybuilder": [0, 0, null, null, null], "ovhcloud/DeepSeek-R1-Distill-Llama-70B": [67e-8, 67e-8, null, null, null], "DeepSeek-R1-Distill-Llama-70B": [67e-8, 67e-8, null, null, null], "ovhcloud/Llama-3.1-8B-Instruct": [1e-7, 1e-7, null, null, null], "Llama-3.1-8B-Instruct": [1e-7, 1e-7, null, null, null], "ovhcloud/Meta-Llama-3_1-70B-Instruct": [67e-8, 67e-8, null, null, null], "Meta-Llama-3_1-70B-Instruct": [67e-8, 67e-8, null, null, null], "ovhcloud/Meta-Llama-3_3-70B-Instruct": [67e-8, 67e-8, null, null, null], "Meta-Llama-3_3-70B-Instruct": [67e-8, 67e-8, null, null, null], "ovhcloud/Mistral-7B-Instruct-v0.3": [1e-7, 1e-7, null, null, null], "Mistral-7B-Instruct-v0.3": [1e-7, 1e-7, null, null, null], "ovhcloud/Mistral-Nemo-Instruct-2407": [13e-8, 13e-8, null, null, null], "Mistral-Nemo-Instruct-2407": [13e-8, 13e-8, null, null, null], "ovhcloud/Mistral-Small-3.2-24B-Instruct-2506": [9e-8, 28e-8, null, null, null], "Mistral-Small-3.2-24B-Instruct-2506": [9e-8, 28e-8, null, null, null], "ovhcloud/Mixtral-8x7B-Instruct-v0.1": [63e-8, 63e-8, null, null, null], "Mixtral-8x7B-Instruct-v0.1": [63e-8, 63e-8, null, null, null], "ovhcloud/Qwen2.5-Coder-32B-Instruct": [87e-8, 87e-8, null, null, null], "Qwen2.5-Coder-32B-Instruct": [87e-8, 87e-8, null, null, null], "ovhcloud/Qwen2.5-VL-72B-Instruct": [91e-8, 91e-8, null, null, null], "Qwen2.5-VL-72B-Instruct": [91e-8, 91e-8, null, null, null], "ovhcloud/Qwen3-32B": [8e-8, 23e-8, null, null, null], "Qwen3-32B": [8e-8, 23e-8, null, null, null], "ovhcloud/gpt-oss-120b": [8e-8, 4e-7, null, null, null], "ovhcloud/gpt-oss-20b": [4e-8, 15e-8, null, null, null], "gpt-oss-20b": [4e-8, 15e-8, null, null, null], "ovhcloud/llava-v1.6-mistral-7b-hf": [29e-8, 29e-8, null, null, null], "llava-v1.6-mistral-7b-hf": [29e-8, 29e-8, null, null, null], "ovhcloud/mamba-codestral-7B-v0.1": [19e-8, 19e-8, null, null, null], "mamba-codestral-7B-v0.1": [19e-8, 19e-8, null, null, null], "palm/chat-bison": [125e-9, 125e-9, null, null, null], "chat-bison": [125e-9, 125e-9, null, null, null], "palm/chat-bison-001": [125e-9, 125e-9, null, null, null], "chat-bison-001": [125e-9, 125e-9, null, null, null], "palm/text-bison": [125e-9, 125e-9, null, null, null], "text-bison": [125e-9, 125e-9, null, null, null], "palm/text-bison-001": [125e-9, 125e-9, null, null, null], "text-bison-001": [125e-9, 125e-9, null, null, null], "palm/text-bison-safety-off": [125e-9, 125e-9, null, null, null], "text-bison-safety-off": [125e-9, 125e-9, null, null, null], "palm/text-bison-safety-recitation-off": [125e-9, 125e-9, null, null, null], "text-bison-safety-recitation-off": [125e-9, 125e-9, null, null, null], "perplexity/codellama-34b-instruct": [35e-8, 14e-7, null, null, null], "codellama-34b-instruct": [35e-8, 14e-7, null, null, null], "perplexity/codellama-70b-instruct": [7e-7, 28e-7, null, null, null], "codellama-70b-instruct": [7e-7, 28e-7, null, null, null], "perplexity/llama-2-70b-chat": [7e-7, 28e-7, null, null, null], "llama-2-70b-chat": [7e-7, 28e-7, null, null, null], "perplexity/llama-3.1-70b-instruct": [1e-6, 1e-6, null, null, null], "llama-3.1-70b-instruct": [1e-6, 1e-6, null, null, null], "perplexity/llama-3.1-8b-instruct": [2e-7, 2e-7, null, null, null], "llama-3.1-8b-instruct": [2e-7, 2e-7, null, null, null], "perplexity/mistral-7b-instruct": [7e-8, 28e-8, null, null, null], "mistral-7b-instruct": [7e-8, 28e-8, null, null, null], "perplexity/mixtral-8x7b-instruct": [7e-8, 28e-8, null, null, null], "mixtral-8x7b-instruct": [7e-8, 28e-8, null, null, null], "perplexity/pplx-70b-chat": [7e-7, 28e-7, null, null, null], "pplx-70b-chat": [7e-7, 28e-7, null, null, null], "perplexity/pplx-70b-online": [0, 28e-7, null, null, null], "pplx-70b-online": [0, 28e-7, null, null, null], "perplexity/pplx-7b-chat": [7e-8, 28e-8, null, null, null], "pplx-7b-chat": [7e-8, 28e-8, null, null, null], "perplexity/pplx-7b-online": [0, 28e-8, null, null, null], "pplx-7b-online": [0, 28e-8, null, null, null], "perplexity/sonar": [1e-6, 1e-6, null, null, null], sonar: [1e-6, 1e-6, null, null, null], "perplexity/sonar-deep-research": [2e-6, 8e-6, null, null, null], "sonar-deep-research": [2e-6, 8e-6, null, null, null], "perplexity/sonar-medium-chat": [6e-7, 18e-7, null, null, null], "sonar-medium-chat": [6e-7, 18e-7, null, null, null], "perplexity/sonar-medium-online": [0, 18e-7, null, null, null], "sonar-medium-online": [0, 18e-7, null, null, null], "perplexity/sonar-pro": [3e-6, 15e-6, null, null, null], "sonar-pro": [3e-6, 15e-6, null, null, null], "perplexity/sonar-reasoning": [1e-6, 5e-6, null, null, null], "sonar-reasoning": [1e-6, 5e-6, null, null, null], "perplexity/sonar-reasoning-pro": [2e-6, 8e-6, null, null, null], "sonar-reasoning-pro": [2e-6, 8e-6, null, null, null], "perplexity/sonar-small-chat": [7e-8, 28e-8, null, null, null], "sonar-small-chat": [7e-8, 28e-8, null, null, null], "perplexity/sonar-small-online": [0, 28e-8, null, null, null], "sonar-small-online": [0, 28e-8, null, null, null], "publicai/swiss-ai/apertus-8b-instruct": [0, 0, null, null, null], "swiss-ai/apertus-8b-instruct": [0, 0, null, null, null], "publicai/swiss-ai/apertus-70b-instruct": [0, 0, null, null, null], "swiss-ai/apertus-70b-instruct": [0, 0, null, null, null], "publicai/aisingapore/Gemma-SEA-LION-v4-27B-IT": [0, 0, null, null, null], "aisingapore/Gemma-SEA-LION-v4-27B-IT": [0, 0, null, null, null], "publicai/BSC-LT/salamandra-7b-instruct-tools-16k": [0, 0, null, null, null], "BSC-LT/salamandra-7b-instruct-tools-16k": [0, 0, null, null, null], "publicai/BSC-LT/ALIA-40b-instruct_Q8_0": [0, 0, null, null, null], "BSC-LT/ALIA-40b-instruct_Q8_0": [0, 0, null, null, null], "publicai/allenai/Olmo-3-7B-Instruct": [0, 0, null, null, null], "allenai/Olmo-3-7B-Instruct": [0, 0, null, null, null], "perplexity/pplx-embed-v1-0.6b": [4e-9, 0, null, null, null], "pplx-embed-v1-0.6b": [4e-9, 0, null, null, null], "perplexity/pplx-embed-v1-4b": [3e-8, 0, null, null, null], "pplx-embed-v1-4b": [3e-8, 0, null, null, null], "publicai/aisingapore/Qwen-SEA-LION-v4-32B-IT": [0, 0, null, null, null], "aisingapore/Qwen-SEA-LION-v4-32B-IT": [0, 0, null, null, null], "publicai/allenai/Olmo-3-7B-Think": [0, 0, null, null, null], "allenai/Olmo-3-7B-Think": [0, 0, null, null, null], "publicai/allenai/Olmo-3-32B-Think": [0, 0, null, null, null], "allenai/Olmo-3-32B-Think": [0, 0, null, null, null], "replicate/meta/llama-2-13b": [1e-7, 5e-7, null, null, null], "meta/llama-2-13b": [1e-7, 5e-7, null, null, null], "replicate/meta/llama-2-13b-chat": [1e-7, 5e-7, null, null, null], "meta/llama-2-13b-chat": [1e-7, 5e-7, null, null, null], "replicate/meta/llama-2-70b": [65e-8, 275e-8, null, null, null], "meta/llama-2-70b": [65e-8, 275e-8, null, null, null], "replicate/meta/llama-2-70b-chat": [65e-8, 275e-8, null, null, null], "meta/llama-2-70b-chat": [65e-8, 275e-8, null, null, null], "replicate/meta/llama-2-7b": [5e-8, 25e-8, null, null, null], "meta/llama-2-7b": [5e-8, 25e-8, null, null, null], "replicate/meta/llama-2-7b-chat": [5e-8, 25e-8, null, null, null], "meta/llama-2-7b-chat": [5e-8, 25e-8, null, null, null], "replicate/meta/llama-3-70b": [65e-8, 275e-8, null, null, null], "meta/llama-3-70b": [65e-8, 275e-8, null, null, null], "replicate/meta/llama-3-70b-instruct": [65e-8, 275e-8, null, null, null], "meta/llama-3-70b-instruct": [65e-8, 275e-8, null, null, null], "replicate/meta/llama-3-8b": [5e-8, 25e-8, null, null, null], "meta/llama-3-8b": [5e-8, 25e-8, null, null, null], "replicate/meta/llama-3-8b-instruct": [5e-8, 25e-8, null, null, null], "meta/llama-3-8b-instruct": [5e-8, 25e-8, null, null, null], "replicate/mistralai/mistral-7b-instruct-v0.2": [5e-8, 25e-8, null, null, null], "mistralai/mistral-7b-instruct-v0.2": [5e-8, 25e-8, null, null, null], "replicate/mistralai/mistral-7b-v0.1": [5e-8, 25e-8, null, null, null], "mistralai/mistral-7b-v0.1": [5e-8, 25e-8, null, null, null], "replicate/mistralai/mixtral-8x7b-instruct-v0.1": [3e-7, 1e-6, null, null, null], "mistralai/mixtral-8x7b-instruct-v0.1": [3e-7, 1e-6, null, null, null], "replicate/openai/gpt-5": [125e-8, 1e-5, null, null, null], "replicateopenai/gpt-oss-20b": [9e-8, 36e-8, null, null, null], "replicate/anthropic/claude-4.5-haiku": [1e-6, 5e-6, null, null, null], "anthropic/claude-4.5-haiku": [1e-6, 5e-6, null, null, null], "replicate/ibm-granite/granite-3.3-8b-instruct": [3e-8, 25e-8, null, null, null], "ibm-granite/granite-3.3-8b-instruct": [3e-8, 25e-8, null, null, null], "replicate/openai/gpt-4o": [25e-7, 1e-5, null, null, null], "replicate/openai/o4-mini": [1e-6, 4e-6, null, null, null], "openai/o4-mini": [1e-6, 4e-6, null, null, null], "replicate/openai/o1-mini": [11e-7, 44e-7, null, null, null], "openai/o1-mini": [11e-7, 44e-7, null, null, null], "replicate/openai/o1": [15e-6, 6e-5, null, null, null], "replicate/openai/gpt-4o-mini": [15e-8, 6e-7, null, null, null], "replicate/qwen/qwen3-235b-a22b-instruct-2507": [264e-9, 106e-8, null, null, null], "qwen/qwen3-235b-a22b-instruct-2507": [264e-9, 106e-8, null, null, null], "replicate/anthropic/claude-4-sonnet": [3e-6, 15e-6, null, null, null], "replicate/deepseek-ai/deepseek-v3": [145e-8, 145e-8, null, null, null], "deepseek-ai/deepseek-v3": [145e-8, 145e-8, null, null, null], "replicate/anthropic/claude-3.7-sonnet": [3e-6, 15e-6, null, null, null], "replicate/anthropic/claude-3.5-haiku": [1e-6, 5e-6, null, null, null], "anthropic/claude-3.5-haiku": [1e-6, 5e-6, null, null, null], "replicate/anthropic/claude-3.5-sonnet": [375e-8, 1875e-8, null, null, null], "replicate/google/gemini-3-pro": [2e-6, 12e-6, null, null, null], "google/gemini-3-pro": [2e-6, 12e-6, null, null, null], "replicate/anthropic/claude-4.5-sonnet": [3e-6, 15e-6, null, null, null], "anthropic/claude-4.5-sonnet": [3e-6, 15e-6, null, null, null], "replicate/openai/gpt-4.1": [2e-6, 8e-6, null, null, null], "replicate/openai/gpt-4.1-nano": [1e-7, 4e-7, null, null, null], "replicate/openai/gpt-4.1-mini": [4e-7, 16e-7, null, null, null], "replicate/openai/gpt-5-nano": [5e-8, 4e-7, null, null, null], "replicate/openai/gpt-5-mini": [25e-8, 2e-6, null, null, null], "replicate/google/gemini-2.5-flash": [25e-7, 25e-7, null, null, null], "replicate/openai/gpt-oss-120b": [18e-8, 72e-8, null, null, null], "replicate/deepseek-ai/deepseek-v3.1": [672e-9, 2016e-9, null, null, null], "deepseek-ai/deepseek-v3.1": [672e-9, 2016e-9, null, null, null], "replicate/xai/grok-4": [72e-7, 36e-6, null, null, null], "xai/grok-4": [72e-7, 36e-6, null, null, null], "replicate/deepseek-ai/deepseek-r1": [375e-8, 1e-5, null, null, null], "deepseek-ai/deepseek-r1": [375e-8, 1e-5, null, null, null], "nvidia_nim/nvidia/nv-rerankqa-mistral-4b-v3": [0, 0, null, null, null], "nvidia/nv-rerankqa-mistral-4b-v3": [0, 0, null, null, null], "nvidia_nim/nvidia/llama-3_2-nv-rerankqa-1b-v2": [0, 0, null, null, null], "nvidia/llama-3_2-nv-rerankqa-1b-v2": [0, 0, null, null, null], "nvidia_nim/ranking/nvidia/llama-3.2-nv-rerankqa-1b-v2": [0, 0, null, null, null], "ranking/nvidia/llama-3.2-nv-rerankqa-1b-v2": [0, 0, null, null, null], "sagemaker/meta-textgeneration-llama-2-13b": [0, 0, null, null, null], "meta-textgeneration-llama-2-13b": [0, 0, null, null, null], "sagemaker/meta-textgeneration-llama-2-13b-f": [0, 0, null, null, null], "meta-textgeneration-llama-2-13b-f": [0, 0, null, null, null], "sagemaker/meta-textgeneration-llama-2-70b": [0, 0, null, null, null], "meta-textgeneration-llama-2-70b": [0, 0, null, null, null], "sagemaker/meta-textgeneration-llama-2-70b-b-f": [0, 0, null, null, null], "meta-textgeneration-llama-2-70b-b-f": [0, 0, null, null, null], "sagemaker/meta-textgeneration-llama-2-7b": [0, 0, null, null, null], "meta-textgeneration-llama-2-7b": [0, 0, null, null, null], "sagemaker/meta-textgeneration-llama-2-7b-f": [0, 0, null, null, null], "meta-textgeneration-llama-2-7b-f": [0, 0, null, null, null], "sambanova/MiniMax-M2.7": [3e-7, 12e-7, null, null, null], "MiniMax-M2.7": [3e-7, 12e-7, 375e-9, 6e-8], "sambanova/DeepSeek-R1": [5e-6, 7e-6, null, null, null], "DeepSeek-R1": [5e-6, 7e-6, null, null, null], "sambanova/DeepSeek-R1-Distill-Llama-70B": [7e-7, 14e-7, null, null, null], "sambanova/DeepSeek-V3-0324": [3e-6, 45e-7, null, null, null], "DeepSeek-V3-0324": [3e-6, 45e-7, null, null, null], "sambanova/Llama-4-Maverick-17B-128E-Instruct": [63e-8, 18e-7, null, null, null], "Llama-4-Maverick-17B-128E-Instruct": [63e-8, 18e-7, null, null, null], "sambanova/Llama-4-Scout-17B-16E-Instruct": [4e-7, 7e-7, null, null, null], "sambanova/Meta-Llama-3.1-405B-Instruct": [5e-6, 1e-5, null, null, null], "sambanova/Meta-Llama-3.1-8B-Instruct": [1e-7, 2e-7, null, null, null], "sambanova/Meta-Llama-3.2-1B-Instruct": [4e-8, 8e-8, null, null, null], "Meta-Llama-3.2-1B-Instruct": [4e-8, 8e-8, null, null, null], "sambanova/Meta-Llama-3.2-3B-Instruct": [8e-8, 16e-8, null, null, null], "Meta-Llama-3.2-3B-Instruct": [8e-8, 16e-8, null, null, null], "sambanova/Meta-Llama-3.3-70B-Instruct": [6e-7, 12e-7, null, null, null], "Meta-Llama-3.3-70B-Instruct": [6e-7, 12e-7, null, null, null], "sambanova/Meta-Llama-Guard-3-8B": [3e-7, 3e-7, null, null, null], "Meta-Llama-Guard-3-8B": [3e-7, 3e-7, null, null, null], "sambanova/QwQ-32B": [5e-7, 1e-6, null, null, null], "QwQ-32B": [5e-7, 1e-6, null, null, null], "sambanova/Qwen2-Audio-7B-Instruct": [5e-7, 1e-4, null, null, null], "Qwen2-Audio-7B-Instruct": [5e-7, 1e-4, null, null, null], "sambanova/Qwen3-32B": [4e-7, 8e-7, null, null, null], "sambanova/DeepSeek-V3.1": [3e-6, 45e-7, null, null, null], "DeepSeek-V3.1": [3e-6, 45e-7, null, null, null], "sambanova/gpt-oss-120b": [3e-6, 45e-7, null, null, null], "text-completion-codestral/codestral-2405": [0, 0, null, null, null], "text-completion-codestral/codestral-latest": [0, 0, null, null, null], "together_ai/baai/bge-base-en-v1.5": [8e-9, 0, null, null, null], "baai/bge-base-en-v1.5": [8e-9, 0, null, null, null], "together_ai/BAAI/bge-base-en-v1.5": [8e-9, 0, null, null, null], "BAAI/bge-base-en-v1.5": [8e-9, 0, null, null, null], "together_ai/Qwen/Qwen3-235B-A22B-Instruct-2507-tput": [2e-7, 6e-6, null, null, null], "Qwen/Qwen3-235B-A22B-Instruct-2507-tput": [2e-7, 6e-6, null, null, null], "together_ai/Qwen/Qwen3-235B-A22B-Thinking-2507": [65e-8, 3e-6, null, null, null], "together_ai/Qwen/Qwen3-235B-A22B-fp8-tput": [2e-7, 6e-7, null, null, null], "Qwen/Qwen3-235B-A22B-fp8-tput": [2e-7, 6e-7, null, null, null], "together_ai/Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8": [2e-6, 2e-6, null, null, null], "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8": [2e-6, 2e-6, null, null, null], "together_ai/deepseek-ai/DeepSeek-R1": [3e-6, 7e-6, null, null, null], "together_ai/deepseek-ai/DeepSeek-R1-0528-tput": [55e-8, 219e-8, null, null, null], "deepseek-ai/DeepSeek-R1-0528-tput": [55e-8, 219e-8, null, null, null], "together_ai/deepseek-ai/DeepSeek-V3": [125e-8, 125e-8, null, null, null], "together_ai/deepseek-ai/DeepSeek-V3.1": [6e-7, 17e-7, null, null, null], "together_ai/meta-llama/Llama-3.3-70B-Instruct-Turbo": [88e-8, 88e-8, null, null, null], "together_ai/meta-llama/Llama-3.3-70B-Instruct-Turbo-Free": [0, 0, null, null, null], "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free": [0, 0, null, null, null], "together_ai/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": [27e-8, 85e-8, null, null, null], "together_ai/meta-llama/Llama-4-Scout-17B-16E-Instruct": [18e-8, 59e-8, null, null, null], "together_ai/meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo": [35e-7, 35e-7, null, null, null], "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo": [35e-7, 35e-7, null, null, null], "together_ai/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": [88e-8, 88e-8, null, null, null], "together_ai/meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": [18e-8, 18e-8, null, null, null], "together_ai/mistralai/Mixtral-8x7B-Instruct-v0.1": [6e-7, 6e-7, null, null, null], "together_ai/moonshotai/Kimi-K2-Instruct": [1e-6, 3e-6, null, null, null], "together_ai/openai/gpt-oss-120b": [15e-8, 6e-7, null, null, null], "together_ai/openai/gpt-oss-20b": [5e-8, 2e-7, null, null, null], "together_ai/zai-org/GLM-4.5-Air-FP8": [2e-7, 11e-7, null, null, null], "zai-org/GLM-4.5-Air-FP8": [2e-7, 11e-7, null, null, null], "together_ai/zai-org/GLM-4.6": [6e-7, 22e-7, null, null, null], "together_ai/zai-org/GLM-4.7": [45e-8, 2e-6, null, null, null], "together_ai/moonshotai/Kimi-K2.5": [5e-7, 28e-7, null, null, null], "together_ai/moonshotai/Kimi-K2-Instruct-0905": [1e-6, 3e-6, null, null, null], "together_ai/Qwen/Qwen3-Next-80B-A3B-Instruct": [15e-8, 15e-7, null, null, null], "together_ai/Qwen/Qwen3-Next-80B-A3B-Thinking": [15e-8, 15e-7, null, null, null], "together_ai/Qwen/Qwen3.5-397B-A17B": [6e-7, 36e-7, null, null, null], "Qwen/Qwen3.5-397B-A17B": [6e-7, 36e-7, null, null, null], "v0/v0-1.0-md": [3e-6, 15e-6, null, null, null], "v0-1.0-md": [3e-6, 15e-6, null, null, null], "v0/v0-1.5-lg": [15e-6, 75e-6, null, null, null], "v0-1.5-lg": [15e-6, 75e-6, null, null, null], "v0/v0-1.5-md": [3e-6, 15e-6, null, null, null], "v0-1.5-md": [3e-6, 15e-6, null, null, null], "vercel_ai_gateway/alibaba/qwen-3-14b": [8e-8, 24e-8, null, null, null], "alibaba/qwen-3-14b": [8e-8, 24e-8, null, null, null], "vercel_ai_gateway/alibaba/qwen-3-235b": [2e-7, 6e-7, null, null, null], "alibaba/qwen-3-235b": [2e-7, 6e-7, null, null, null], "vercel_ai_gateway/alibaba/qwen-3-30b": [1e-7, 3e-7, null, null, null], "alibaba/qwen-3-30b": [1e-7, 3e-7, null, null, null], "vercel_ai_gateway/alibaba/qwen-3-32b": [1e-7, 3e-7, null, null, null], "alibaba/qwen-3-32b": [1e-7, 3e-7, null, null, null], "vercel_ai_gateway/alibaba/qwen3-coder": [4e-7, 16e-7, null, null, null], "alibaba/qwen3-coder": [4e-7, 16e-7, null, null, null], "vercel_ai_gateway/amazon/nova-lite": [6e-8, 24e-8, null, null, null], "amazon/nova-lite": [6e-8, 24e-8, null, null, null], "vercel_ai_gateway/amazon/nova-micro": [35e-9, 14e-8, null, null, null], "amazon/nova-micro": [35e-9, 14e-8, null, null, null], "vercel_ai_gateway/amazon/nova-pro": [8e-7, 32e-7, null, null, null], "amazon/nova-pro": [8e-7, 32e-7, null, null, null], "vercel_ai_gateway/amazon/titan-embed-text-v2": [2e-8, 0, null, null, null], "amazon/titan-embed-text-v2": [2e-8, 0, null, null, null], "vercel_ai_gateway/anthropic/claude-3-haiku": [25e-8, 125e-8, 3e-7, 3e-8, null], "vercel_ai_gateway/anthropic/claude-3-opus": [15e-6, 75e-6, 1875e-8, 15e-7, null], "anthropic/claude-3-opus": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vercel_ai_gateway/anthropic/claude-3.5-haiku": [8e-7, 4e-6, 1e-6, 8e-8, null], "vercel_ai_gateway/anthropic/claude-3.5-sonnet": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/anthropic/claude-3.7-sonnet": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/anthropic/claude-4-opus": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vercel_ai_gateway/anthropic/claude-4-sonnet": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/anthropic/claude-3-5-sonnet": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic/claude-3-5-sonnet": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/anthropic/claude-3-5-sonnet-20241022": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic/claude-3-5-sonnet-20241022": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/anthropic/claude-3-7-sonnet": [3e-6, 15e-6, 375e-8, 3e-7, null], "anthropic/claude-3-7-sonnet": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/anthropic/claude-haiku-4.5": [1e-6, 5e-6, 125e-8, 1e-7, null], "vercel_ai_gateway/anthropic/claude-opus-4": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vercel_ai_gateway/anthropic/claude-opus-4.1": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vercel_ai_gateway/anthropic/claude-opus-4.5": [5e-6, 25e-6, 625e-8, 5e-7, null], "vercel_ai_gateway/anthropic/claude-opus-4.6": [5e-6, 25e-6, 625e-8, 5e-7, null], "vercel_ai_gateway/anthropic/claude-sonnet-4": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/anthropic/claude-sonnet-4.5": [3e-6, 15e-6, 375e-8, 3e-7, null], "vercel_ai_gateway/cohere/command-a": [25e-7, 1e-5, null, null, null], "cohere/command-a": [25e-7, 1e-5, null, null, null], "vercel_ai_gateway/cohere/command-r": [15e-8, 6e-7, null, null, null], "cohere/command-r": [15e-8, 6e-7, null, null, null], "vercel_ai_gateway/cohere/command-r-plus": [25e-7, 1e-5, null, null, null], "cohere/command-r-plus": [25e-7, 1e-5, null, null, null], "vercel_ai_gateway/cohere/embed-v4.0": [12e-8, 0, null, null, null], "vercel_ai_gateway/deepseek/deepseek-r1": [55e-8, 219e-8, null, null, null], "vercel_ai_gateway/deepseek/deepseek-r1-distill-llama-70b": [75e-8, 99e-8, null, null, null], "deepseek/deepseek-r1-distill-llama-70b": [75e-8, 99e-8, null, null, null], "vercel_ai_gateway/deepseek/deepseek-v3": [9e-7, 9e-7, null, null, null], "vercel_ai_gateway/google/gemini-2.0-flash": [15e-8, 6e-7, null, null, null], "google/gemini-2.0-flash": [15e-8, 6e-7, null, null, null], "vercel_ai_gateway/google/gemini-2.0-flash-lite": [75e-9, 3e-7, null, null, null], "google/gemini-2.0-flash-lite": [75e-9, 3e-7, null, null, null], "vercel_ai_gateway/google/gemini-2.5-flash": [3e-7, 25e-7, null, null, null], "vercel_ai_gateway/google/gemini-2.5-pro": [25e-7, 1e-5, null, null, null], "vercel_ai_gateway/google/gemini-embedding-001": [15e-8, 0, null, null, null], "google/gemini-embedding-001": [15e-8, 0, null, null, null], "vercel_ai_gateway/google/gemma-2-9b": [2e-7, 2e-7, null, null, null], "google/gemma-2-9b": [2e-7, 2e-7, null, null, null], "vercel_ai_gateway/google/text-embedding-005": [25e-9, 0, null, null, null], "google/text-embedding-005": [25e-9, 0, null, null, null], "vercel_ai_gateway/google/text-multilingual-embedding-002": [25e-9, 0, null, null, null], "google/text-multilingual-embedding-002": [25e-9, 0, null, null, null], "vercel_ai_gateway/inception/mercury-coder-small": [25e-8, 1e-6, null, null, null], "inception/mercury-coder-small": [25e-8, 1e-6, null, null, null], "vercel_ai_gateway/meta/llama-3-70b": [59e-8, 79e-8, null, null, null], "vercel_ai_gateway/meta/llama-3-8b": [5e-8, 8e-8, null, null, null], "vercel_ai_gateway/meta/llama-3.1-70b": [72e-8, 72e-8, null, null, null], "meta/llama-3.1-70b": [72e-8, 72e-8, null, null, null], "vercel_ai_gateway/meta/llama-3.1-8b": [5e-8, 8e-8, null, null, null], "meta/llama-3.1-8b": [5e-8, 8e-8, null, null, null], "vercel_ai_gateway/meta/llama-3.2-11b": [16e-8, 16e-8, null, null, null], "meta/llama-3.2-11b": [16e-8, 16e-8, null, null, null], "vercel_ai_gateway/meta/llama-3.2-1b": [1e-7, 1e-7, null, null, null], "meta/llama-3.2-1b": [1e-7, 1e-7, null, null, null], "vercel_ai_gateway/meta/llama-3.2-3b": [15e-8, 15e-8, null, null, null], "meta/llama-3.2-3b": [15e-8, 15e-8, null, null, null], "vercel_ai_gateway/meta/llama-3.2-90b": [72e-8, 72e-8, null, null, null], "meta/llama-3.2-90b": [72e-8, 72e-8, null, null, null], "vercel_ai_gateway/meta/llama-3.3-70b": [72e-8, 72e-8, null, null, null], "meta/llama-3.3-70b": [72e-8, 72e-8, null, null, null], "vercel_ai_gateway/meta/llama-4-maverick": [2e-7, 6e-7, null, null, null], "meta/llama-4-maverick": [2e-7, 6e-7, null, null, null], "vercel_ai_gateway/meta/llama-4-scout": [1e-7, 3e-7, null, null, null], "meta/llama-4-scout": [1e-7, 3e-7, null, null, null], "vercel_ai_gateway/mistral/codestral": [3e-7, 9e-7, null, null, null], "mistral/codestral": [3e-7, 9e-7, null, null, null], "vercel_ai_gateway/mistral/codestral-embed": [15e-8, 0, null, null, null], "mistral/codestral-embed": [15e-8, 0, null, null, null], "vercel_ai_gateway/mistral/devstral-small": [7e-8, 28e-8, null, null, null], "mistral/devstral-small": [7e-8, 28e-8, null, null, null], "vercel_ai_gateway/mistral/magistral-medium": [2e-6, 5e-6, null, null, null], "mistral/magistral-medium": [2e-6, 5e-6, null, null, null], "vercel_ai_gateway/mistral/magistral-small": [5e-7, 15e-7, null, null, null], "mistral/magistral-small": [5e-7, 15e-7, null, null, null], "vercel_ai_gateway/mistral/ministral-3b": [4e-8, 4e-8, null, null, null], "mistral/ministral-3b": [4e-8, 4e-8, null, null, null], "vercel_ai_gateway/mistral/ministral-8b": [1e-7, 1e-7, null, null, null], "mistral/ministral-8b": [1e-7, 1e-7, null, null, null], "vercel_ai_gateway/mistral/mistral-embed": [1e-7, 0, null, null, null], "mistral/mistral-embed": [1e-7, 0, null, null, null], "vercel_ai_gateway/mistral/mistral-large": [2e-6, 6e-6, null, null, null], "mistral/mistral-large": [2e-6, 6e-6, null, null, null], "vercel_ai_gateway/mistral/mistral-saba-24b": [79e-8, 79e-8, null, null, null], "mistral/mistral-saba-24b": [79e-8, 79e-8, null, null, null], "vercel_ai_gateway/mistral/mistral-small": [1e-7, 3e-7, null, null, null], "vercel_ai_gateway/mistral/mixtral-8x22b-instruct": [12e-7, 12e-7, null, null, null], "mistral/mixtral-8x22b-instruct": [12e-7, 12e-7, null, null, null], "vercel_ai_gateway/mistral/pixtral-12b": [15e-8, 15e-8, null, null, null], "mistral/pixtral-12b": [15e-8, 15e-8, null, null, null], "vercel_ai_gateway/mistral/pixtral-large": [2e-6, 6e-6, null, null, null], "mistral/pixtral-large": [2e-6, 6e-6, null, null, null], "vercel_ai_gateway/moonshotai/kimi-k2": [55e-8, 22e-7, null, null, null], "moonshotai/kimi-k2": [55e-8, 22e-7, null, null, null], "vercel_ai_gateway/morph/morph-v3-fast": [8e-7, 12e-7, null, null, null], "vercel_ai_gateway/morph/morph-v3-large": [9e-7, 19e-7, null, null, null], "vercel_ai_gateway/openai/gpt-3.5-turbo": [5e-7, 15e-7, null, null, null], "vercel_ai_gateway/openai/gpt-3.5-turbo-instruct": [15e-7, 2e-6, null, null, null], "openai/gpt-3.5-turbo-instruct": [15e-7, 2e-6, null, null, null], "vercel_ai_gateway/openai/gpt-4-turbo": [1e-5, 3e-5, null, null, null], "openai/gpt-4-turbo": [1e-5, 3e-5, null, null, null], "vercel_ai_gateway/openai/gpt-4.1": [2e-6, 8e-6, 0, 5e-7, null], "vercel_ai_gateway/openai/gpt-4.1-mini": [4e-7, 16e-7, 0, 1e-7, null], "vercel_ai_gateway/openai/gpt-4.1-nano": [1e-7, 4e-7, 0, 25e-9, null], "vercel_ai_gateway/openai/gpt-4o": [25e-7, 1e-5, 0, 125e-8, null], "vercel_ai_gateway/openai/gpt-4o-mini": [15e-8, 6e-7, 0, 75e-9, null], "vercel_ai_gateway/openai/o1": [15e-6, 6e-5, 0, 75e-7, null], "vercel_ai_gateway/openai/o3": [2e-6, 8e-6, 0, 5e-7, null], "openai/o3": [2e-6, 8e-6, 0, 5e-7, null], "vercel_ai_gateway/openai/o3-mini": [11e-7, 44e-7, 0, 55e-8, null], "vercel_ai_gateway/openai/o4-mini": [11e-7, 44e-7, 0, 275e-9, null], "vercel_ai_gateway/openai/text-embedding-3-large": [13e-8, 0, null, null, null], "openai/text-embedding-3-large": [13e-8, 0, null, null, null], "vercel_ai_gateway/openai/text-embedding-3-small": [2e-8, 0, null, null, null], "openai/text-embedding-3-small": [2e-8, 0, null, null, null], "vercel_ai_gateway/openai/text-embedding-ada-002": [1e-7, 0, null, null, null], "openai/text-embedding-ada-002": [1e-7, 0, null, null, null], "vercel_ai_gateway/perplexity/sonar": [1e-6, 1e-6, null, null, null], "vercel_ai_gateway/perplexity/sonar-pro": [3e-6, 15e-6, null, null, null], "vercel_ai_gateway/perplexity/sonar-reasoning": [1e-6, 5e-6, null, null, null], "vercel_ai_gateway/perplexity/sonar-reasoning-pro": [2e-6, 8e-6, null, null, null], "vercel_ai_gateway/vercel/v0-1.0-md": [3e-6, 15e-6, null, null, null], "vercel/v0-1.0-md": [3e-6, 15e-6, null, null, null], "vercel_ai_gateway/vercel/v0-1.5-md": [3e-6, 15e-6, null, null, null], "vercel/v0-1.5-md": [3e-6, 15e-6, null, null, null], "vercel_ai_gateway/xai/grok-2": [2e-6, 1e-5, null, null, null], "xai/grok-2": [2e-6, 1e-5, null, null, null], "vercel_ai_gateway/xai/grok-2-vision": [2e-6, 1e-5, null, null, null], "xai/grok-2-vision": [2e-6, 1e-5, null, null, null], "vercel_ai_gateway/xai/grok-3": [3e-6, 15e-6, null, null, null], "xai/grok-3": [3e-6, 15e-6, null, null, null], "vercel_ai_gateway/xai/grok-3-fast": [5e-6, 25e-6, null, null, null], "xai/grok-3-fast": [5e-6, 25e-6, null, null, null], "vercel_ai_gateway/xai/grok-3-mini": [3e-7, 5e-7, null, null, null], "xai/grok-3-mini": [3e-7, 5e-7, null, null, null], "vercel_ai_gateway/xai/grok-3-mini-fast": [6e-7, 4e-6, null, null, null], "xai/grok-3-mini-fast": [6e-7, 4e-6, null, null, null], "vercel_ai_gateway/xai/grok-4": [3e-6, 15e-6, null, null, null], "vercel_ai_gateway/zai/glm-4.5": [6e-7, 22e-7, null, null, null], "zai/glm-4.5": [6e-7, 22e-7, null, null, null], "vercel_ai_gateway/zai/glm-4.5-air": [2e-7, 11e-7, null, null, null], "zai/glm-4.5-air": [2e-7, 11e-7, null, null, null], "vercel_ai_gateway/zai/glm-4.6": [45e-8, 18e-7, null, 11e-8, null], "zai/glm-4.6": [45e-8, 18e-7, null, 11e-8, null], "vertex_ai/claude-3-5-haiku": [1e-6, 5e-6, null, null, null], "claude-3-5-haiku": [1e-6, 5e-6, null, null, null], "vertex_ai/claude-3-5-haiku@20241022": [1e-6, 5e-6, null, null, null], "claude-3-5-haiku@20241022": [1e-6, 5e-6, null, null, null], "vertex_ai/claude-haiku-4-5": [1e-6, 5e-6, 125e-8, 1e-7, null], "vertex_ai/claude-haiku-4-5@20251001": [1e-6, 5e-6, 125e-8, 1e-7, null], "claude-haiku-4-5@20251001": [1e-6, 5e-6, 125e-8, 1e-7, null], "vertex_ai/claude-3-5-sonnet": [3e-6, 15e-6, null, null, null], "claude-3-5-sonnet": [3e-6, 15e-6, null, null, null], "vertex_ai/claude-3-5-sonnet@20240620": [3e-6, 15e-6, null, null, null], "claude-3-5-sonnet@20240620": [3e-6, 15e-6, null, null, null], "vertex_ai/claude-3-7-sonnet@20250219": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-3-7-sonnet@20250219": [3e-6, 15e-6, 375e-8, 3e-7, null], "vertex_ai/claude-3-haiku": [25e-8, 125e-8, null, null, null], "claude-3-haiku": [25e-8, 125e-8, null, null, null], "vertex_ai/claude-3-haiku@20240307": [25e-8, 125e-8, null, null, null], "claude-3-haiku@20240307": [25e-8, 125e-8, null, null, null], "vertex_ai/claude-3-opus": [15e-6, 75e-6, null, null, null], "claude-3-opus": [15e-6, 75e-6, null, null, null], "vertex_ai/claude-3-opus@20240229": [15e-6, 75e-6, null, null, null], "claude-3-opus@20240229": [15e-6, 75e-6, null, null, null], "vertex_ai/claude-3-sonnet": [3e-6, 15e-6, null, null, null], "claude-3-sonnet": [3e-6, 15e-6, null, null, null], "vertex_ai/claude-3-sonnet@20240229": [3e-6, 15e-6, null, null, null], "claude-3-sonnet@20240229": [3e-6, 15e-6, null, null, null], "vertex_ai/claude-opus-4": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-opus-4": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vertex_ai/claude-opus-4-1": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vertex_ai/claude-opus-4-1@20250805": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-opus-4-1@20250805": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vertex_ai/claude-opus-4-5": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-opus-4-5@20251101": [5e-6, 25e-6, 625e-8, 5e-7, null], "claude-opus-4-5@20251101": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-opus-4-6": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-opus-4-6@default": [5e-6, 25e-6, 625e-8, 5e-7, null], "claude-opus-4-6@default": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-opus-4-7": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-opus-4-7@default": [5e-6, 25e-6, 625e-8, 5e-7, null], "claude-opus-4-7@default": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-opus-4-8": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-opus-4-8@default": [5e-6, 25e-6, 625e-8, 5e-7, null], "claude-opus-4-8@default": [5e-6, 25e-6, 625e-8, 5e-7, null], "vertex_ai/claude-sonnet-4-5": [3e-6, 15e-6, 375e-8, 3e-7, null], "vertex_ai/claude-sonnet-4-6": [3e-6, 15e-6, 375e-8, 3e-7, null], "vertex_ai/claude-sonnet-4-5@20250929": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4-5@20250929": [3e-6, 15e-6, 375e-8, 3e-7, null], "vertex_ai/claude-opus-4@20250514": [15e-6, 75e-6, 1875e-8, 15e-7, null], "claude-opus-4@20250514": [15e-6, 75e-6, 1875e-8, 15e-7, null], "vertex_ai/claude-sonnet-4": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4": [3e-6, 15e-6, 375e-8, 3e-7, null], "vertex_ai/claude-sonnet-4@20250514": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4@20250514": [3e-6, 15e-6, 375e-8, 3e-7, null], "vertex_ai/mistralai/codestral-2@001": [3e-7, 9e-7, null, null, null], "mistralai/codestral-2@001": [3e-7, 9e-7, null, null, null], "vertex_ai/codestral-2": [3e-7, 9e-7, null, null, null], "codestral-2": [3e-7, 9e-7, null, null, null], "vertex_ai/codestral-2@001": [3e-7, 9e-7, null, null, null], "codestral-2@001": [3e-7, 9e-7, null, null, null], "vertex_ai/mistralai/codestral-2": [3e-7, 9e-7, null, null, null], "mistralai/codestral-2": [3e-7, 9e-7, null, null, null], "vertex_ai/codestral-2501": [2e-7, 6e-7, null, null, null], "codestral-2501": [2e-7, 6e-7, null, null, null], "vertex_ai/codestral@2405": [2e-7, 6e-7, null, null, null], "codestral@2405": [2e-7, 6e-7, null, null, null], "vertex_ai/codestral@latest": [2e-7, 6e-7, null, null, null], "codestral@latest": [2e-7, 6e-7, null, null, null], "vertex_ai/deepseek-ai/deepseek-v3.1-maas": [135e-8, 54e-7, null, null, null], "deepseek-ai/deepseek-v3.1-maas": [135e-8, 54e-7, null, null, null], "vertex_ai/deepseek-ai/deepseek-v3.2-maas": [56e-8, 168e-8, null, null, null], "deepseek-ai/deepseek-v3.2-maas": [56e-8, 168e-8, null, null, null], "vertex_ai/deepseek-ai/deepseek-r1-0528-maas": [135e-8, 54e-7, null, null, null], "deepseek-ai/deepseek-r1-0528-maas": [135e-8, 54e-7, null, null, null], "vertex_ai/gemini-2.5-flash-image": [3e-7, 25e-7, null, 3e-8, null], "vertex_ai/gemini-3-pro-image-preview": [2e-6, 12e-6, null, null, null], "vertex_ai/gemini-3.1-flash-image-preview": [5e-7, 3e-6, null, null, null], "vertex_ai/gemini-3.1-flash-lite-preview": [25e-8, 15e-7, null, 25e-9, null], "vertex_ai/gemini-3.1-flash-lite": [25e-8, 15e-7, null, 25e-9, null], "vertex_ai/deep-research-pro-preview-12-2025": [2e-6, 12e-6, null, null, null], "vertex_ai/jamba-1.5": [2e-7, 4e-7, null, null, null], "vertex_ai/jamba-1.5-large": [2e-6, 8e-6, null, null, null], "vertex_ai/jamba-1.5-large@001": [2e-6, 8e-6, null, null, null], "vertex_ai/jamba-1.5-mini": [2e-7, 4e-7, null, null, null], "vertex_ai/jamba-1.5-mini@001": [2e-7, 4e-7, null, null, null], "vertex_ai/meta/llama-3.1-405b-instruct-maas": [5e-6, 16e-6, null, null, null], "meta/llama-3.1-405b-instruct-maas": [5e-6, 16e-6, null, null, null], "vertex_ai/meta/llama-3.1-70b-instruct-maas": [0, 0, null, null, null], "meta/llama-3.1-70b-instruct-maas": [0, 0, null, null, null], "vertex_ai/meta/llama-3.1-8b-instruct-maas": [0, 0, null, null, null], "meta/llama-3.1-8b-instruct-maas": [0, 0, null, null, null], "vertex_ai/meta/llama-3.2-90b-vision-instruct-maas": [0, 0, null, null, null], "meta/llama-3.2-90b-vision-instruct-maas": [0, 0, null, null, null], "vertex_ai/meta/llama-4-maverick-17b-128e-instruct-maas": [35e-8, 115e-8, null, null, null], "meta/llama-4-maverick-17b-128e-instruct-maas": [35e-8, 115e-8, null, null, null], "vertex_ai/meta/llama-4-maverick-17b-16e-instruct-maas": [35e-8, 115e-8, null, null, null], "meta/llama-4-maverick-17b-16e-instruct-maas": [35e-8, 115e-8, null, null, null], "vertex_ai/meta/llama-4-scout-17b-128e-instruct-maas": [25e-8, 7e-7, null, null, null], "meta/llama-4-scout-17b-128e-instruct-maas": [25e-8, 7e-7, null, null, null], "vertex_ai/meta/llama-4-scout-17b-16e-instruct-maas": [25e-8, 7e-7, null, null, null], "meta/llama-4-scout-17b-16e-instruct-maas": [25e-8, 7e-7, null, null, null], "vertex_ai/meta/llama3-405b-instruct-maas": [0, 0, null, null, null], "meta/llama3-405b-instruct-maas": [0, 0, null, null, null], "vertex_ai/meta/llama3-70b-instruct-maas": [0, 0, null, null, null], "meta/llama3-70b-instruct-maas": [0, 0, null, null, null], "vertex_ai/meta/llama3-8b-instruct-maas": [0, 0, null, null, null], "meta/llama3-8b-instruct-maas": [0, 0, null, null, null], "vertex_ai/minimaxai/minimax-m2-maas": [3e-7, 12e-7, null, null, null], "minimaxai/minimax-m2-maas": [3e-7, 12e-7, null, null, null], "vertex_ai/moonshotai/kimi-k2-thinking-maas": [6e-7, 25e-7, null, null, null], "moonshotai/kimi-k2-thinking-maas": [6e-7, 25e-7, null, null, null], "vertex_ai/zai-org/glm-4.7-maas": [6e-7, 22e-7, null, null, null], "zai-org/glm-4.7-maas": [6e-7, 22e-7, null, null, null], "vertex_ai/zai-org/glm-5-maas": [1e-6, 32e-7, null, 1e-7, null], "zai-org/glm-5-maas": [1e-6, 32e-7, null, 1e-7, null], "vertex_ai/mistral-medium-3": [4e-7, 2e-6, null, null, null], "mistral-medium-3": [4e-7, 2e-6, null, null, null], "vertex_ai/mistral-medium-3@001": [4e-7, 2e-6, null, null, null], "mistral-medium-3@001": [4e-7, 2e-6, null, null, null], "vertex_ai/mistralai/mistral-medium-3": [4e-7, 2e-6, null, null, null], "mistralai/mistral-medium-3": [4e-7, 2e-6, null, null, null], "vertex_ai/mistralai/mistral-medium-3@001": [4e-7, 2e-6, null, null, null], "mistralai/mistral-medium-3@001": [4e-7, 2e-6, null, null, null], "vertex_ai/mistral-large-2411": [2e-6, 6e-6, null, null, null], "vertex_ai/mistral-large@2407": [2e-6, 6e-6, null, null, null], "mistral-large@2407": [2e-6, 6e-6, null, null, null], "vertex_ai/mistral-large@2411-001": [2e-6, 6e-6, null, null, null], "mistral-large@2411-001": [2e-6, 6e-6, null, null, null], "vertex_ai/mistral-large@latest": [2e-6, 6e-6, null, null, null], "mistral-large@latest": [2e-6, 6e-6, null, null, null], "vertex_ai/mistral-nemo@2407": [3e-6, 3e-6, null, null, null], "mistral-nemo@2407": [3e-6, 3e-6, null, null, null], "vertex_ai/mistral-nemo@latest": [15e-8, 15e-8, null, null, null], "mistral-nemo@latest": [15e-8, 15e-8, null, null, null], "vertex_ai/mistral-small-2503": [1e-6, 3e-6, null, null, null], "vertex_ai/mistral-small-2503@001": [1e-6, 3e-6, null, null, null], "mistral-small-2503@001": [1e-6, 3e-6, null, null, null], "vertex_ai/deepseek-ai/deepseek-ocr-maas": [3e-7, 12e-7, null, null, null], "deepseek-ai/deepseek-ocr-maas": [3e-7, 12e-7, null, null, null], "vertex_ai/openai/gpt-oss-120b-maas": [15e-8, 6e-7, null, null, null], "openai/gpt-oss-120b-maas": [15e-8, 6e-7, null, null, null], "vertex_ai/openai/gpt-oss-20b-maas": [75e-9, 3e-7, null, null, null], "openai/gpt-oss-20b-maas": [75e-9, 3e-7, null, null, null], "vertex_ai/xai/grok-4.1-fast-non-reasoning": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4.1-fast-non-reasoning": [2e-7, 5e-7, null, 5e-8, null], "vertex_ai/xai/grok-4.1-fast-reasoning": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4.1-fast-reasoning": [2e-7, 5e-7, null, 5e-8, null], "vertex_ai/xai/grok-4.20-non-reasoning": [2e-6, 6e-6, null, 2e-7, null], "xai/grok-4.20-non-reasoning": [2e-6, 6e-6, null, 2e-7, null], "vertex_ai/xai/grok-4.20-reasoning": [2e-6, 6e-6, null, 2e-7, null], "xai/grok-4.20-reasoning": [2e-6, 6e-6, null, 2e-7, null], "vertex_ai/qwen/qwen3-235b-a22b-instruct-2507-maas": [25e-8, 1e-6, null, null, null], "qwen/qwen3-235b-a22b-instruct-2507-maas": [25e-8, 1e-6, null, null, null], "vertex_ai/qwen/qwen3-coder-480b-a35b-instruct-maas": [1e-6, 4e-6, null, null, null], "qwen/qwen3-coder-480b-a35b-instruct-maas": [1e-6, 4e-6, null, null, null], "vertex_ai/qwen/qwen3-next-80b-a3b-instruct-maas": [15e-8, 12e-7, null, null, null], "qwen/qwen3-next-80b-a3b-instruct-maas": [15e-8, 12e-7, null, null, null], "vertex_ai/qwen/qwen3-next-80b-a3b-thinking-maas": [15e-8, 12e-7, null, null, null], "qwen/qwen3-next-80b-a3b-thinking-maas": [15e-8, 12e-7, null, null, null], "voyage/rerank-2": [5e-8, 0, null, null, null], "rerank-2": [5e-8, 0, null, null, null], "voyage/rerank-2-lite": [2e-8, 0, null, null, null], "rerank-2-lite": [2e-8, 0, null, null, null], "voyage/rerank-2.5": [5e-8, 0, null, null, null], "rerank-2.5": [5e-8, 0, null, null, null], "voyage/rerank-2.5-lite": [2e-8, 0, null, null, null], "rerank-2.5-lite": [2e-8, 0, null, null, null], "voyage/voyage-2": [1e-7, 0, null, null, null], "voyage-2": [1e-7, 0, null, null, null], "voyage/voyage-3": [6e-8, 0, null, null, null], "voyage-3": [6e-8, 0, null, null, null], "voyage/voyage-3-large": [18e-8, 0, null, null, null], "voyage-3-large": [18e-8, 0, null, null, null], "voyage/voyage-3-lite": [2e-8, 0, null, null, null], "voyage-3-lite": [2e-8, 0, null, null, null], "voyage/voyage-3.5": [6e-8, 0, null, null, null], "voyage-3.5": [6e-8, 0, null, null, null], "voyage/voyage-3.5-lite": [2e-8, 0, null, null, null], "voyage-3.5-lite": [2e-8, 0, null, null, null], "voyage/voyage-code-2": [12e-8, 0, null, null, null], "voyage-code-2": [12e-8, 0, null, null, null], "voyage/voyage-code-3": [18e-8, 0, null, null, null], "voyage-code-3": [18e-8, 0, null, null, null], "voyage/voyage-context-3": [18e-8, 0, null, null, null], "voyage-context-3": [18e-8, 0, null, null, null], "voyage/voyage-finance-2": [12e-8, 0, null, null, null], "voyage-finance-2": [12e-8, 0, null, null, null], "voyage/voyage-large-2": [12e-8, 0, null, null, null], "voyage-large-2": [12e-8, 0, null, null, null], "voyage/voyage-law-2": [12e-8, 0, null, null, null], "voyage-law-2": [12e-8, 0, null, null, null], "voyage/voyage-lite-01": [1e-7, 0, null, null, null], "voyage-lite-01": [1e-7, 0, null, null, null], "voyage/voyage-lite-02-instruct": [1e-7, 0, null, null, null], "voyage-lite-02-instruct": [1e-7, 0, null, null, null], "voyage/voyage-multimodal-3": [12e-8, 0, null, null, null], "voyage-multimodal-3": [12e-8, 0, null, null, null], "wandb/openai/gpt-oss-120b": [0.015, 0.06, null, null, null], "wandb/openai/gpt-oss-20b": [5e-3, 0.02, null, null, null], "wandb/zai-org/GLM-4.5": [0.055, 0.2, null, null, null], "wandb/Qwen/Qwen3-235B-A22B-Instruct-2507": [0.01, 0.01, null, null, null], "wandb/Qwen/Qwen3-Coder-480B-A35B-Instruct": [0.1, 0.15, null, null, null], "wandb/Qwen/Qwen3-235B-A22B-Thinking-2507": [0.01, 0.01, null, null, null], "wandb/moonshotai/Kimi-K2-Instruct": [6e-7, 25e-7, null, null, null], "wandb/moonshotai/Kimi-K2.5": [6e-7, 3e-6, null, 1e-7, null], "wandb/MiniMaxAI/MiniMax-M2.5": [3e-7, 12e-7, null, null, null], "wandb/meta-llama/Llama-3.1-8B-Instruct": [0.022, 0.022, null, null, null], "wandb/deepseek-ai/DeepSeek-V3.1": [0.055, 0.165, null, null, null], "wandb/deepseek-ai/DeepSeek-R1-0528": [0.135, 0.54, null, null, null], "wandb/deepseek-ai/DeepSeek-V3-0324": [0.114, 0.275, null, null, null], "wandb/meta-llama/Llama-3.3-70B-Instruct": [0.071, 0.071, null, null, null], "wandb/meta-llama/Llama-4-Scout-17B-16E-Instruct": [0.017, 0.066, null, null, null], "wandb/microsoft/Phi-4-mini-instruct": [8e-3, 0.035, null, null, null], "microsoft/Phi-4-mini-instruct": [8e-3, 0.035, null, null, null], "watsonx/ibm/granite-3-8b-instruct": [2e-7, 2e-7, null, null, null], "ibm/granite-3-8b-instruct": [2e-7, 2e-7, null, null, null], "watsonx/mistralai/mistral-large": [3e-6, 1e-5, null, null, null], "watsonx/bigscience/mt0-xxl-13b": [5e-4, 2e-3, null, null, null], "bigscience/mt0-xxl-13b": [5e-4, 2e-3, null, null, null], "watsonx/core42/jais-13b-chat": [5e-4, 2e-3, null, null, null], "core42/jais-13b-chat": [5e-4, 2e-3, null, null, null], "watsonx/google/flan-t5-xl-3b": [6e-7, 6e-7, null, null, null], "google/flan-t5-xl-3b": [6e-7, 6e-7, null, null, null], "watsonx/ibm/granite-13b-chat-v2": [6e-7, 6e-7, null, null, null], "ibm/granite-13b-chat-v2": [6e-7, 6e-7, null, null, null], "watsonx/ibm/granite-13b-instruct-v2": [6e-7, 6e-7, null, null, null], "ibm/granite-13b-instruct-v2": [6e-7, 6e-7, null, null, null], "watsonx/ibm/granite-3-3-8b-instruct": [2e-7, 2e-7, null, null, null], "ibm/granite-3-3-8b-instruct": [2e-7, 2e-7, null, null, null], "watsonx/ibm/granite-4-h-small": [6e-8, 25e-8, null, null, null], "ibm/granite-4-h-small": [6e-8, 25e-8, null, null, null], "watsonx/ibm/granite-guardian-3-2-2b": [1e-7, 1e-7, null, null, null], "ibm/granite-guardian-3-2-2b": [1e-7, 1e-7, null, null, null], "watsonx/ibm/granite-guardian-3-3-8b": [2e-7, 2e-7, null, null, null], "ibm/granite-guardian-3-3-8b": [2e-7, 2e-7, null, null, null], "watsonx/ibm/granite-ttm-1024-96-r2": [38e-8, 38e-8, null, null, null], "ibm/granite-ttm-1024-96-r2": [38e-8, 38e-8, null, null, null], "watsonx/ibm/granite-ttm-1536-96-r2": [38e-8, 38e-8, null, null, null], "ibm/granite-ttm-1536-96-r2": [38e-8, 38e-8, null, null, null], "watsonx/ibm/granite-ttm-512-96-r2": [38e-8, 38e-8, null, null, null], "ibm/granite-ttm-512-96-r2": [38e-8, 38e-8, null, null, null], "watsonx/ibm/granite-vision-3-2-2b": [1e-7, 1e-7, null, null, null], "ibm/granite-vision-3-2-2b": [1e-7, 1e-7, null, null, null], "watsonx/meta-llama/llama-3-2-11b-vision-instruct": [35e-8, 35e-8, null, null, null], "meta-llama/llama-3-2-11b-vision-instruct": [35e-8, 35e-8, null, null, null], "watsonx/meta-llama/llama-3-2-1b-instruct": [1e-7, 1e-7, null, null, null], "meta-llama/llama-3-2-1b-instruct": [1e-7, 1e-7, null, null, null], "watsonx/meta-llama/llama-3-2-3b-instruct": [15e-8, 15e-8, null, null, null], "meta-llama/llama-3-2-3b-instruct": [15e-8, 15e-8, null, null, null], "watsonx/meta-llama/llama-3-2-90b-vision-instruct": [2e-6, 2e-6, null, null, null], "meta-llama/llama-3-2-90b-vision-instruct": [2e-6, 2e-6, null, null, null], "watsonx/meta-llama/llama-3-3-70b-instruct": [71e-8, 71e-8, null, null, null], "meta-llama/llama-3-3-70b-instruct": [71e-8, 71e-8, null, null, null], "watsonx/meta-llama/llama-4-maverick-17b": [35e-8, 14e-7, null, null, null], "meta-llama/llama-4-maverick-17b": [35e-8, 14e-7, null, null, null], "watsonx/meta-llama/llama-guard-3-11b-vision": [35e-8, 35e-8, null, null, null], "meta-llama/llama-guard-3-11b-vision": [35e-8, 35e-8, null, null, null], "watsonx/mistralai/mistral-medium-2505": [3e-6, 1e-5, null, null, null], "mistralai/mistral-medium-2505": [3e-6, 1e-5, null, null, null], "watsonx/mistralai/mistral-small-2503": [1e-7, 3e-7, null, null, null], "mistralai/mistral-small-2503": [1e-7, 3e-7, null, null, null], "watsonx/mistralai/mistral-small-3-1-24b-instruct-2503": [1e-7, 3e-7, null, null, null], "mistralai/mistral-small-3-1-24b-instruct-2503": [1e-7, 3e-7, null, null, null], "watsonx/mistralai/pixtral-12b-2409": [35e-8, 35e-8, null, null, null], "mistralai/pixtral-12b-2409": [35e-8, 35e-8, null, null, null], "watsonx/openai/gpt-oss-120b": [15e-8, 6e-7, null, null, null], "watsonx/sdaia/allam-1-13b-instruct": [18e-7, 18e-7, null, null, null], "sdaia/allam-1-13b-instruct": [18e-7, 18e-7, null, null, null], "grok-2": [2e-6, 1e-5, null, null, null], "xai/grok-2-1212": [2e-6, 1e-5, null, null, null], "grok-2-1212": [2e-6, 1e-5, null, null, null], "xai/grok-2-latest": [2e-6, 1e-5, null, null, null], "grok-2-latest": [2e-6, 1e-5, null, null, null], "grok-2-vision": [2e-6, 1e-5, null, null, null], "xai/grok-2-vision-1212": [2e-6, 1e-5, null, null, null], "grok-2-vision-1212": [2e-6, 1e-5, null, null, null], "xai/grok-2-vision-latest": [2e-6, 1e-5, null, null, null], "grok-2-vision-latest": [2e-6, 1e-5, null, null, null], "xai/grok-3-beta": [3e-6, 15e-6, null, 75e-8, null], "grok-3-beta": [3e-6, 15e-6, null, 75e-8, null], "xai/grok-3-fast-beta": [5e-6, 25e-6, null, 125e-8, null], "grok-3-fast-beta": [5e-6, 25e-6, null, 125e-8, null], "xai/grok-3-fast-latest": [5e-6, 25e-6, null, 125e-8, null], "grok-3-fast-latest": [5e-6, 25e-6, null, 125e-8, null], "xai/grok-3-latest": [3e-6, 15e-6, null, 75e-8, null], "grok-3-latest": [3e-6, 15e-6, null, 75e-8, null], "xai/grok-3-mini-beta": [3e-7, 5e-7, null, 75e-9, null], "grok-3-mini-beta": [3e-7, 5e-7, null, 75e-9, null], "grok-3-mini-fast": [6e-7, 4e-6, null, 15e-8, null], "xai/grok-3-mini-fast-beta": [6e-7, 4e-6, null, 15e-8, null], "grok-3-mini-fast-beta": [6e-7, 4e-6, null, 15e-8, null], "xai/grok-3-mini-fast-latest": [6e-7, 4e-6, null, 15e-8, null], "grok-3-mini-fast-latest": [6e-7, 4e-6, null, 15e-8, null], "xai/grok-3-mini-latest": [3e-7, 5e-7, null, 75e-9, null], "grok-3-mini-latest": [3e-7, 5e-7, null, 75e-9, null], "xai/grok-4-fast-reasoning": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4-fast-non-reasoning": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4-0709": [3e-6, 15e-6, null, null, null], "grok-4-0709": [3e-6, 15e-6, null, null, null], "xai/grok-4-latest": [3e-6, 15e-6, null, null, null], "grok-4-latest": [3e-6, 15e-6, null, null, null], "xai/grok-4-1-fast": [2e-7, 5e-7, null, 5e-8, null], "grok-4-1-fast": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4-1-fast-reasoning": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4-1-fast-reasoning-latest": [2e-7, 5e-7, null, 5e-8, null], "grok-4-1-fast-reasoning-latest": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4-1-fast-non-reasoning": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4-1-fast-non-reasoning-latest": [2e-7, 5e-7, null, 5e-8, null], "grok-4-1-fast-non-reasoning-latest": [2e-7, 5e-7, null, 5e-8, null], "xai/grok-4.20-multi-agent-beta-0309": [2e-6, 6e-6, null, 2e-7, null], "grok-4.20-multi-agent-beta-0309": [2e-6, 6e-6, null, 2e-7, null], "xai/grok-4.20-beta-0309-reasoning": [2e-6, 6e-6, null, 2e-7, null], "grok-4.20-beta-0309-reasoning": [2e-6, 6e-6, null, 2e-7, null], "xai/grok-4.20-0309-reasoning": [2e-6, 6e-6, null, 2e-7, null], "grok-4.20-0309-reasoning": [2e-6, 6e-6, null, 2e-7, null], "xai/grok-4.20-beta-0309-non-reasoning": [2e-6, 6e-6, null, 2e-7, null], "grok-4.20-beta-0309-non-reasoning": [2e-6, 6e-6, null, 2e-7, null], "xai/grok-4.3": [125e-8, 25e-7, null, 2e-7, null], "grok-4.3": [125e-8, 25e-7, null, 2e-7, null], "xai/grok-4.3-latest": [125e-8, 25e-7, null, 2e-7, null], "grok-4.3-latest": [125e-8, 25e-7, null, 2e-7, null], "xai/grok-beta": [5e-6, 15e-6, null, null, null], "grok-beta": [5e-6, 15e-6, null, null, null], "xai/grok-code-fast": [2e-7, 15e-7, null, 2e-8, null], "grok-code-fast": [2e-7, 15e-7, null, 2e-8, null], "xai/grok-code-fast-1": [2e-7, 15e-7, null, 2e-8, null], "xai/grok-code-fast-1-0825": [2e-7, 15e-7, null, 2e-8, null], "grok-code-fast-1-0825": [2e-7, 15e-7, null, 2e-8, null], "xai/grok-vision-beta": [5e-6, 15e-6, null, null, null], "grok-vision-beta": [5e-6, 15e-6, null, null, null], "zai/glm-5": [1e-6, 32e-7, 0, 2e-7, null], "glm-5": [1e-6, 32e-7, 0, 2e-7, null], "zai/glm-5-code": [12e-7, 5e-6, 0, 3e-7, null], "glm-5-code": [12e-7, 5e-6, 0, 3e-7, null], "zai/glm-4.7": [6e-7, 22e-7, 0, 11e-8, null], "glm-4.7": [6e-7, 22e-7, 0, 11e-8, null], "glm-4.6": [6e-7, 22e-7, 0, 11e-8, null], "glm-4.5": [6e-7, 22e-7, null, null, null], "zai/glm-4.5v": [6e-7, 18e-7, null, null, null], "glm-4.5v": [6e-7, 18e-7, null, null, null], "zai/glm-4.5-x": [22e-7, 89e-7, null, null, null], "glm-4.5-x": [22e-7, 89e-7, null, null, null], "glm-4.5-air": [2e-7, 11e-7, null, null, null], "zai/glm-4.5-airx": [11e-7, 45e-7, null, null, null], "glm-4.5-airx": [11e-7, 45e-7, null, null, null], "zai/glm-4-32b-0414-128k": [1e-7, 1e-7, null, null, null], "glm-4-32b-0414-128k": [1e-7, 1e-7, null, null, null], "zai/glm-4.5-flash": [0, 0, null, null, null], "glm-4.5-flash": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-coder-480b-a35b-instruct": [45e-8, 18e-7, null, null, null], "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct": [45e-8, 18e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/flux-kontext-pro": [4e-8, 4e-8, null, null, null], "accounts/fireworks/models/flux-kontext-pro": [4e-8, 4e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/SSD-1B": [13e-11, 13e-11, null, null, null], "accounts/fireworks/models/SSD-1B": [13e-11, 13e-11, null, null, null], "fireworks_ai/accounts/fireworks/models/chronos-hermes-13b-v2": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/chronos-hermes-13b-v2": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-13b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/code-llama-13b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-13b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/code-llama-13b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-13b-python": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/code-llama-13b-python": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-34b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/code-llama-34b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-34b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/code-llama-34b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-34b-python": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/code-llama-34b-python": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-70b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/code-llama-70b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-70b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/code-llama-70b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-70b-python": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/code-llama-70b-python": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/code-llama-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-7b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/code-llama-7b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-llama-7b-python": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/code-llama-7b-python": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/code-qwen-1p5-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/code-qwen-1p5-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/codegemma-2b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/codegemma-2b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/codegemma-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/codegemma-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/cogito-671b-v2-p1": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/cogito-671b-v2-p1": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/cogito-v1-preview-llama-3b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/cogito-v1-preview-llama-3b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/cogito-v1-preview-llama-70b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/cogito-v1-preview-llama-70b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/cogito-v1-preview-llama-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/cogito-v1-preview-llama-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/cogito-v1-preview-qwen-14b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/cogito-v1-preview-qwen-14b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/cogito-v1-preview-qwen-32b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/cogito-v1-preview-qwen-32b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/flux-kontext-max": [8e-8, 8e-8, null, null, null], "accounts/fireworks/models/flux-kontext-max": [8e-8, 8e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/dbrx-instruct": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/dbrx-instruct": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-1b-base": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-1b-base": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-33b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-33b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-7b-base": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-7b-base": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-7b-base-v1p5": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-7b-base-v1p5": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-7b-instruct-v1p5": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-7b-instruct-v1p5": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-v2-lite-base": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-v2-lite-base": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-coder-v2-lite-instruct": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/deepseek-coder-v2-lite-instruct": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-prover-v2": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/deepseek-prover-v2": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-0528-distill-qwen3-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/deepseek-r1-0528-distill-qwen3-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-distill-llama-70b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/deepseek-r1-distill-llama-70b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-distill-llama-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/deepseek-r1-distill-llama-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-distill-qwen-14b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/deepseek-r1-distill-qwen-14b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-distill-qwen-1p5b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/deepseek-r1-distill-qwen-1p5b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-distill-qwen-32b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/deepseek-r1-distill-qwen-32b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-r1-distill-qwen-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/deepseek-r1-distill-qwen-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-v2-lite-chat": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/deepseek-v2-lite-chat": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/deepseek-v2p5": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/deepseek-v2p5": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/devstral-small-2505": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/devstral-small-2505": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/dobby-mini-unhinged-plus-llama-3-1-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/dobby-mini-unhinged-plus-llama-3-1-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/dobby-unhinged-llama-3-3-70b-new": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/dobby-unhinged-llama-3-3-70b-new": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/dolphin-2-9-2-qwen2-72b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/dolphin-2-9-2-qwen2-72b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/dolphin-2p6-mixtral-8x7b": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/dolphin-2p6-mixtral-8x7b": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/ernie-4p5-21b-a3b-pt": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/ernie-4p5-21b-a3b-pt": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/ernie-4p5-300b-a47b-pt": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/ernie-4p5-300b-a47b-pt": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/fare-20b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/fare-20b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/firefunction-v1": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/firefunction-v1": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/firellava-13b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/firellava-13b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/firesearch-ocr-v6": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/firesearch-ocr-v6": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/fireworks-asr-large": [0, 0, null, null, null], "accounts/fireworks/models/fireworks-asr-large": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/fireworks-asr-v2": [0, 0, null, null, null], "accounts/fireworks/models/fireworks-asr-v2": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/flux-1-dev": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/flux-1-dev": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/flux-1-dev-controlnet-union": [1e-9, 1e-9, null, null, null], "accounts/fireworks/models/flux-1-dev-controlnet-union": [1e-9, 1e-9, null, null, null], "fireworks_ai/accounts/fireworks/models/flux-1-dev-fp8": [5e-10, 5e-10, null, null, null], "accounts/fireworks/models/flux-1-dev-fp8": [5e-10, 5e-10, null, null, null], "fireworks_ai/accounts/fireworks/models/flux-1-schnell": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/flux-1-schnell": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/flux-1-schnell-fp8": [35e-11, 35e-11, null, null, null], "accounts/fireworks/models/flux-1-schnell-fp8": [35e-11, 35e-11, null, null, null], "fireworks_ai/accounts/fireworks/models/gemma-2b-it": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/gemma-2b-it": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/gemma-3-27b-it": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/gemma-3-27b-it": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/gemma-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/gemma-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/gemma-7b-it": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/gemma-7b-it": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/gemma2-9b-it": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/gemma2-9b-it": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/glm-4p5v": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/glm-4p5v": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/gpt-oss-safeguard-120b": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/gpt-oss-safeguard-120b": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/gpt-oss-safeguard-20b": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/gpt-oss-safeguard-20b": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/hermes-2-pro-mistral-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/hermes-2-pro-mistral-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/internvl3-38b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/internvl3-38b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/internvl3-78b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/internvl3-78b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/internvl3-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/internvl3-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/japanese-stable-diffusion-xl": [13e-11, 13e-11, null, null, null], "accounts/fireworks/models/japanese-stable-diffusion-xl": [13e-11, 13e-11, null, null, null], "fireworks_ai/accounts/fireworks/models/kat-coder": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/kat-coder": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/kat-dev-32b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/kat-dev-32b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/kat-dev-72b-exp": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/kat-dev-72b-exp": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-guard-2-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-guard-2-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-guard-3-1b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-guard-3-1b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-guard-3-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-guard-3-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v2-13b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-v2-13b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v2-13b-chat": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-v2-13b-chat": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v2-70b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v2-70b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v2-70b-chat": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llama-v2-70b-chat": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v2-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-v2-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v2-7b-chat": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-v2-7b-chat": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3-70b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llama-v3-70b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3-70b-instruct-hf": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llama-v3-70b-instruct-hf": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-v3-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3-8b-instruct-hf": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llama-v3-8b-instruct-hf": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p1-405b-instruct-long": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v3p1-405b-instruct-long": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p1-70b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llama-v3p1-70b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p1-70b-instruct-1b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v3p1-70b-instruct-1b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p1-nemotron-70b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llama-v3p1-nemotron-70b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p2-1b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v3p2-1b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p2-3b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/llama-v3p2-3b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llama-v3p3-70b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llama-v3p3-70b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llamaguard-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/llamaguard-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/llava-yi-34b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/llava-yi-34b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/minimax-m1-80k": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/minimax-m1-80k": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/minimax-m2": [3e-7, 12e-7, null, null, null], "accounts/fireworks/models/minimax-m2": [3e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/ministral-3-14b-instruct-2512": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/ministral-3-14b-instruct-2512": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/ministral-3-3b-instruct-2512": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/ministral-3-3b-instruct-2512": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/ministral-3-8b-instruct-2512": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/ministral-3-8b-instruct-2512": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mistral-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-7b-instruct-4k": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mistral-7b-instruct-4k": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-7b-instruct-v0p2": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mistral-7b-instruct-v0p2": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-7b-instruct-v3": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mistral-7b-instruct-v3": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-7b-v0p2": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mistral-7b-v0p2": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-large-3-fp8": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/mistral-large-3-fp8": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-nemo-base-2407": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mistral-nemo-base-2407": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-nemo-instruct-2407": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mistral-nemo-instruct-2407": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mistral-small-24b-instruct-2501": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/mistral-small-24b-instruct-2501": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mixtral-8x22b": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/mixtral-8x22b": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mixtral-8x22b-instruct": [12e-7, 12e-7, null, null, null], "accounts/fireworks/models/mixtral-8x22b-instruct": [12e-7, 12e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mixtral-8x7b": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/mixtral-8x7b": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mixtral-8x7b-instruct": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/mixtral-8x7b-instruct": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mixtral-8x7b-instruct-hf": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/mixtral-8x7b-instruct-hf": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/mythomax-l2-13b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/mythomax-l2-13b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nemotron-nano-v2-12b-vl": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/nemotron-nano-v2-12b-vl": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nous-capybara-7b-v1p9": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/nous-capybara-7b-v1p9": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nous-hermes-2-mixtral-8x7b-dpo": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/nous-hermes-2-mixtral-8x7b-dpo": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nous-hermes-2-yi-34b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/nous-hermes-2-yi-34b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nous-hermes-llama2-13b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/nous-hermes-llama2-13b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nous-hermes-llama2-70b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/nous-hermes-llama2-70b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nous-hermes-llama2-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/nous-hermes-llama2-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nvidia-nemotron-nano-12b-v2": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/nvidia-nemotron-nano-12b-v2": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/nvidia-nemotron-nano-9b-v2": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/nvidia-nemotron-nano-9b-v2": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/openchat-3p5-0106-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/openchat-3p5-0106-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/openhermes-2-mistral-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/openhermes-2-mistral-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/openhermes-2p5-mistral-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/openhermes-2p5-mistral-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/openorca-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/openorca-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/phi-2-3b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/phi-2-3b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/phi-3-mini-128k-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/phi-3-mini-128k-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/phi-3-vision-128k-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/phi-3-vision-128k-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/phind-code-llama-34b-python-v1": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/phind-code-llama-34b-python-v1": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/phind-code-llama-34b-v1": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/phind-code-llama-34b-v1": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/phind-code-llama-34b-v2": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/phind-code-llama-34b-v2": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/playground-v2-1024px-aesthetic": [13e-11, 13e-11, null, null, null], "accounts/fireworks/models/playground-v2-1024px-aesthetic": [13e-11, 13e-11, null, null, null], "fireworks_ai/accounts/fireworks/models/playground-v2-5-1024px-aesthetic": [13e-11, 13e-11, null, null, null], "accounts/fireworks/models/playground-v2-5-1024px-aesthetic": [13e-11, 13e-11, null, null, null], "fireworks_ai/accounts/fireworks/models/pythia-12b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/pythia-12b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen-qwq-32b-preview": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen-qwq-32b-preview": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen-v2p5-14b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen-v2p5-14b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen-v2p5-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen-v2p5-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen1p5-72b-chat": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen1p5-72b-chat": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2-7b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2-7b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2-vl-2b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2-vl-2b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2-vl-72b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2-vl-72b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2-vl-7b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2-vl-7b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-0p5b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-0p5b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-14b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-14b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-1p5b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-1p5b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-32b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-32b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-32b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-32b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-72b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-72b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-72b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-72b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-7b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-7b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-0p5b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-0p5b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-0p5b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-0p5b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-14b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-14b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-14b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-14b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-1p5b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-1p5b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-1p5b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-1p5b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-32b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-32b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-32b-instruct-128k": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-32b-instruct-128k": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-32b-instruct-32k-rope": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-32b-instruct-32k-rope": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-32b-instruct-64k": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-32b-instruct-64k": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-3b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-3b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-3b-instruct": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-3b-instruct": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-coder-7b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-coder-7b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-math-72b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-math-72b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-vl-32b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-vl-32b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-vl-3b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-vl-3b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-vl-72b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen2p5-vl-72b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen2p5-vl-7b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen2p5-vl-7b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-0p6b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen3-0p6b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-14b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen3-14b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-1p7b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen3-1p7b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-1p7b-fp8-draft": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen3-1p7b-fp8-draft": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-1p7b-fp8-draft-131072": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen3-1p7b-fp8-draft-131072": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-1p7b-fp8-draft-40960": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/qwen3-1p7b-fp8-draft-40960": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-235b-a22b": [22e-8, 88e-8, null, null, null], "accounts/fireworks/models/qwen3-235b-a22b": [22e-8, 88e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-235b-a22b-instruct-2507": [22e-8, 88e-8, null, null, null], "accounts/fireworks/models/qwen3-235b-a22b-instruct-2507": [22e-8, 88e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-235b-a22b-thinking-2507": [22e-8, 88e-8, null, null, null], "accounts/fireworks/models/qwen3-235b-a22b-thinking-2507": [22e-8, 88e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-30b-a3b": [15e-8, 6e-7, null, null, null], "accounts/fireworks/models/qwen3-30b-a3b": [15e-8, 6e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-30b-a3b-instruct-2507": [5e-7, 5e-7, null, null, null], "accounts/fireworks/models/qwen3-30b-a3b-instruct-2507": [5e-7, 5e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-30b-a3b-thinking-2507": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen3-30b-a3b-thinking-2507": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-32b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen3-32b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-4b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen3-4b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-4b-instruct-2507": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen3-4b-instruct-2507": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-8b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen3-8b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-coder-30b-a3b-instruct": [15e-8, 6e-7, null, null, null], "accounts/fireworks/models/qwen3-coder-30b-a3b-instruct": [15e-8, 6e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-coder-480b-instruct-bf16": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen3-coder-480b-instruct-bf16": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-embedding-0p6b": [0, 0, null, null, null], "accounts/fireworks/models/qwen3-embedding-0p6b": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-embedding-4b": [0, 0, null, null, null], "accounts/fireworks/models/qwen3-embedding-4b": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/": [1e-7, 0, null, null, null], "accounts/fireworks/models/": [1e-7, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-next-80b-a3b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen3-next-80b-a3b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-next-80b-a3b-thinking": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen3-next-80b-a3b-thinking": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-reranker-0p6b": [0, 0, null, null, null], "accounts/fireworks/models/qwen3-reranker-0p6b": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-reranker-4b": [0, 0, null, null, null], "accounts/fireworks/models/qwen3-reranker-4b": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-reranker-8b": [0, 0, null, null, null], "accounts/fireworks/models/qwen3-reranker-8b": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-vl-235b-a22b-instruct": [22e-8, 88e-8, null, null, null], "accounts/fireworks/models/qwen3-vl-235b-a22b-instruct": [22e-8, 88e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-vl-235b-a22b-thinking": [22e-8, 88e-8, null, null, null], "accounts/fireworks/models/qwen3-vl-235b-a22b-thinking": [22e-8, 88e-8, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-vl-30b-a3b-instruct": [15e-8, 6e-7, null, null, null], "accounts/fireworks/models/qwen3-vl-30b-a3b-instruct": [15e-8, 6e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-vl-30b-a3b-thinking": [15e-8, 6e-7, null, null, null], "accounts/fireworks/models/qwen3-vl-30b-a3b-thinking": [15e-8, 6e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-vl-32b-instruct": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwen3-vl-32b-instruct": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwen3-vl-8b-instruct": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/qwen3-vl-8b-instruct": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/qwq-32b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/qwq-32b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/rolm-ocr": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/rolm-ocr": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/snorkel-mistral-7b-pairrm-dpo": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/snorkel-mistral-7b-pairrm-dpo": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/stable-diffusion-xl-1024-v1-0": [13e-11, 13e-11, null, null, null], "accounts/fireworks/models/stable-diffusion-xl-1024-v1-0": [13e-11, 13e-11, null, null, null], "fireworks_ai/accounts/fireworks/models/stablecode-3b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/stablecode-3b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/starcoder-16b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/starcoder-16b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/starcoder-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/starcoder-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/starcoder2-15b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/starcoder2-15b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/starcoder2-3b": [1e-7, 1e-7, null, null, null], "accounts/fireworks/models/starcoder2-3b": [1e-7, 1e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/starcoder2-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/starcoder2-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/toppy-m-7b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/toppy-m-7b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/whisper-v3": [0, 0, null, null, null], "accounts/fireworks/models/whisper-v3": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/whisper-v3-turbo": [0, 0, null, null, null], "accounts/fireworks/models/whisper-v3-turbo": [0, 0, null, null, null], "fireworks_ai/accounts/fireworks/models/yi-34b": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/yi-34b": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/yi-34b-200k-capybara": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/yi-34b-200k-capybara": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/yi-34b-chat": [9e-7, 9e-7, null, null, null], "accounts/fireworks/models/yi-34b-chat": [9e-7, 9e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/yi-6b": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/yi-6b": [2e-7, 2e-7, null, null, null], "fireworks_ai/accounts/fireworks/models/zephyr-7b-beta": [2e-7, 2e-7, null, null, null], "accounts/fireworks/models/zephyr-7b-beta": [2e-7, 2e-7, null, null, null], "novita/deepseek/deepseek-v3.2": [269e-9, 4e-7, null, 1345e-10, null], "novita/minimax/minimax-m2.1": [3e-7, 12e-7, null, 3e-8, null], "novita/zai-org/glm-4.7": [6e-7, 22e-7, null, 11e-8, null], "zai-org/glm-4.7": [6e-7, 22e-7, null, 11e-8, null], "novita/xiaomimimo/mimo-v2-flash": [1e-7, 3e-7, null, 2e-8, null], "xiaomimimo/mimo-v2-flash": [1e-7, 3e-7, null, 2e-8, null], "novita/zai-org/autoglm-phone-9b-multilingual": [35e-9, 138e-9, null, null, null], "zai-org/autoglm-phone-9b-multilingual": [35e-9, 138e-9, null, null, null], "novita/moonshotai/kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "moonshotai/kimi-k2-thinking": [6e-7, 25e-7, null, null, null], "novita/minimax/minimax-m2": [3e-7, 12e-7, null, 3e-8, null], "novita/paddlepaddle/paddleocr-vl": [2e-8, 2e-8, null, null, null], "paddlepaddle/paddleocr-vl": [2e-8, 2e-8, null, null, null], "novita/deepseek/deepseek-v3.2-exp": [27e-8, 41e-8, null, null, null], "novita/qwen/qwen3-vl-235b-a22b-thinking": [98e-8, 395e-8, null, null, null], "qwen/qwen3-vl-235b-a22b-thinking": [98e-8, 395e-8, null, null, null], "novita/zai-org/glm-4.6v": [3e-7, 9e-7, null, 55e-9, null], "zai-org/glm-4.6v": [3e-7, 9e-7, null, 55e-9, null], "novita/zai-org/glm-4.6": [55e-8, 22e-7, null, 11e-8, null], "zai-org/glm-4.6": [55e-8, 22e-7, null, 11e-8, null], "novita/kwaipilot/kat-coder-pro": [3e-7, 12e-7, null, 6e-8, null], "kwaipilot/kat-coder-pro": [3e-7, 12e-7, null, 6e-8, null], "novita/qwen/qwen3-next-80b-a3b-instruct": [15e-8, 15e-7, null, null, null], "qwen/qwen3-next-80b-a3b-instruct": [15e-8, 15e-7, null, null, null], "novita/qwen/qwen3-next-80b-a3b-thinking": [15e-8, 15e-7, null, null, null], "qwen/qwen3-next-80b-a3b-thinking": [15e-8, 15e-7, null, null, null], "novita/deepseek/deepseek-ocr": [3e-8, 3e-8, null, null, null], "deepseek/deepseek-ocr": [3e-8, 3e-8, null, null, null], "novita/deepseek/deepseek-v3.1-terminus": [27e-8, 1e-6, null, 135e-9, null], "deepseek/deepseek-v3.1-terminus": [27e-8, 1e-6, null, 135e-9, null], "novita/qwen/qwen3-vl-235b-a22b-instruct": [3e-7, 15e-7, null, null, null], "qwen/qwen3-vl-235b-a22b-instruct": [3e-7, 15e-7, null, null, null], "novita/qwen/qwen3-max": [211e-8, 845e-8, null, null, null], "qwen/qwen3-max": [211e-8, 845e-8, null, null, null], "novita/skywork/r1v4-lite": [2e-7, 6e-7, null, null, null], "skywork/r1v4-lite": [2e-7, 6e-7, null, null, null], "novita/deepseek/deepseek-v3.1": [27e-8, 1e-6, null, 135e-9, null], "deepseek/deepseek-v3.1": [27e-8, 1e-6, null, 135e-9, null], "novita/moonshotai/kimi-k2-0905": [6e-7, 25e-7, null, null, null], "moonshotai/kimi-k2-0905": [6e-7, 25e-7, null, null, null], "novita/qwen/qwen3-coder-480b-a35b-instruct": [3e-7, 13e-7, null, null, null], "qwen/qwen3-coder-480b-a35b-instruct": [3e-7, 13e-7, null, null, null], "novita/qwen/qwen3-coder-30b-a3b-instruct": [7e-8, 27e-8, null, null, null], "qwen/qwen3-coder-30b-a3b-instruct": [7e-8, 27e-8, null, null, null], "novita/openai/gpt-oss-120b": [5e-8, 25e-8, null, null, null], "novita/moonshotai/kimi-k2-instruct": [57e-8, 23e-7, null, null, null], "moonshotai/kimi-k2-instruct": [57e-8, 23e-7, null, null, null], "novita/deepseek/deepseek-v3-0324": [27e-8, 112e-8, null, 135e-9, null], "deepseek/deepseek-v3-0324": [27e-8, 112e-8, null, 135e-9, null], "novita/zai-org/glm-4.5": [6e-7, 22e-7, null, 11e-8, null], "zai-org/glm-4.5": [6e-7, 22e-7, null, 11e-8, null], "novita/qwen/qwen3-235b-a22b-thinking-2507": [3e-7, 3e-6, null, null, null], "novita/meta-llama/llama-3.1-8b-instruct": [2e-8, 5e-8, null, null, null], "meta-llama/llama-3.1-8b-instruct": [2e-8, 5e-8, null, null, null], "novita/google/gemma-3-12b-it": [5e-8, 1e-7, null, null, null], "novita/zai-org/glm-4.5v": [6e-7, 18e-7, null, 11e-8, null], "zai-org/glm-4.5v": [6e-7, 18e-7, null, 11e-8, null], "novita/openai/gpt-oss-20b": [4e-8, 15e-8, null, null, null], "novita/qwen/qwen3-235b-a22b-instruct-2507": [9e-8, 58e-8, null, null, null], "novita/deepseek/deepseek-r1-distill-qwen-14b": [15e-8, 15e-8, null, null, null], "deepseek/deepseek-r1-distill-qwen-14b": [15e-8, 15e-8, null, null, null], "novita/meta-llama/llama-3.3-70b-instruct": [135e-9, 4e-7, null, null, null], "meta-llama/llama-3.3-70b-instruct": [135e-9, 4e-7, null, null, null], "novita/qwen/qwen-2.5-72b-instruct": [38e-8, 4e-7, null, null, null], "qwen/qwen-2.5-72b-instruct": [38e-8, 4e-7, null, null, null], "novita/mistralai/mistral-nemo": [4e-8, 17e-8, null, null, null], "mistralai/mistral-nemo": [4e-8, 17e-8, null, null, null], "novita/minimaxai/minimax-m1-80k": [55e-8, 22e-7, null, null, null], "minimaxai/minimax-m1-80k": [55e-8, 22e-7, null, null, null], "novita/deepseek/deepseek-r1-0528": [7e-7, 25e-7, null, 35e-8, null], "novita/deepseek/deepseek-r1-distill-qwen-32b": [3e-7, 3e-7, null, null, null], "deepseek/deepseek-r1-distill-qwen-32b": [3e-7, 3e-7, null, null, null], "novita/meta-llama/llama-3-8b-instruct": [4e-8, 4e-8, null, null, null], "meta-llama/llama-3-8b-instruct": [4e-8, 4e-8, null, null, null], "novita/microsoft/wizardlm-2-8x22b": [62e-8, 62e-8, null, null, null], "microsoft/wizardlm-2-8x22b": [62e-8, 62e-8, null, null, null], "novita/deepseek/deepseek-r1-0528-qwen3-8b": [6e-8, 9e-8, null, null, null], "deepseek/deepseek-r1-0528-qwen3-8b": [6e-8, 9e-8, null, null, null], "novita/deepseek/deepseek-r1-distill-llama-70b": [8e-7, 8e-7, null, null, null], "novita/meta-llama/llama-3-70b-instruct": [51e-8, 74e-8, null, null, null], "novita/qwen/qwen3-235b-a22b-fp8": [2e-7, 8e-7, null, null, null], "qwen/qwen3-235b-a22b-fp8": [2e-7, 8e-7, null, null, null], "novita/meta-llama/llama-4-maverick-17b-128e-instruct-fp8": [27e-8, 85e-8, null, null, null], "meta-llama/llama-4-maverick-17b-128e-instruct-fp8": [27e-8, 85e-8, null, null, null], "novita/meta-llama/llama-4-scout-17b-16e-instruct": [18e-8, 59e-8, null, null, null], "novita/nousresearch/hermes-2-pro-llama-3-8b": [14e-8, 14e-8, null, null, null], "nousresearch/hermes-2-pro-llama-3-8b": [14e-8, 14e-8, null, null, null], "novita/qwen/qwen2.5-vl-72b-instruct": [8e-7, 8e-7, null, null, null], "qwen/qwen2.5-vl-72b-instruct": [8e-7, 8e-7, null, null, null], "novita/sao10k/l3-70b-euryale-v2.1": [148e-8, 148e-8, null, null, null], "sao10k/l3-70b-euryale-v2.1": [148e-8, 148e-8, null, null, null], "novita/baidu/ernie-4.5-21B-a3b-thinking": [7e-8, 28e-8, null, null, null], "baidu/ernie-4.5-21B-a3b-thinking": [7e-8, 28e-8, null, null, null], "novita/sao10k/l3-8b-lunaris": [5e-8, 5e-8, null, null, null], "sao10k/l3-8b-lunaris": [5e-8, 5e-8, null, null, null], "novita/baichuan/baichuan-m2-32b": [7e-8, 7e-8, null, null, null], "baichuan/baichuan-m2-32b": [7e-8, 7e-8, null, null, null], "novita/baidu/ernie-4.5-vl-424b-a47b": [42e-8, 125e-8, null, null, null], "baidu/ernie-4.5-vl-424b-a47b": [42e-8, 125e-8, null, null, null], "novita/baidu/ernie-4.5-300b-a47b-paddle": [28e-8, 11e-7, null, null, null], "baidu/ernie-4.5-300b-a47b-paddle": [28e-8, 11e-7, null, null, null], "novita/deepseek/deepseek-prover-v2-671b": [7e-7, 25e-7, null, null, null], "deepseek/deepseek-prover-v2-671b": [7e-7, 25e-7, null, null, null], "novita/qwen/qwen3-32b-fp8": [1e-7, 45e-8, null, null, null], "qwen/qwen3-32b-fp8": [1e-7, 45e-8, null, null, null], "novita/qwen/qwen3-30b-a3b-fp8": [9e-8, 45e-8, null, null, null], "qwen/qwen3-30b-a3b-fp8": [9e-8, 45e-8, null, null, null], "novita/google/gemma-3-27b-it": [119e-9, 2e-7, null, null, null], "novita/deepseek/deepseek-v3-turbo": [4e-7, 13e-7, null, null, null], "deepseek/deepseek-v3-turbo": [4e-7, 13e-7, null, null, null], "novita/deepseek/deepseek-r1-turbo": [7e-7, 25e-7, null, null, null], "deepseek/deepseek-r1-turbo": [7e-7, 25e-7, null, null, null], "novita/Sao10K/L3-8B-Stheno-v3.2": [5e-8, 5e-8, null, null, null], "Sao10K/L3-8B-Stheno-v3.2": [5e-8, 5e-8, null, null, null], "novita/gryphe/mythomax-l2-13b": [9e-8, 9e-8, null, null, null], "novita/baidu/ernie-4.5-vl-28b-a3b-thinking": [39e-8, 39e-8, null, null, null], "baidu/ernie-4.5-vl-28b-a3b-thinking": [39e-8, 39e-8, null, null, null], "novita/qwen/qwen3-vl-8b-instruct": [8e-8, 5e-7, null, null, null], "qwen/qwen3-vl-8b-instruct": [8e-8, 5e-7, null, null, null], "novita/zai-org/glm-4.5-air": [13e-8, 85e-8, null, null, null], "zai-org/glm-4.5-air": [13e-8, 85e-8, null, null, null], "novita/qwen/qwen3-vl-30b-a3b-instruct": [2e-7, 7e-7, null, null, null], "qwen/qwen3-vl-30b-a3b-instruct": [2e-7, 7e-7, null, null, null], "novita/qwen/qwen3-vl-30b-a3b-thinking": [2e-7, 1e-6, null, null, null], "qwen/qwen3-vl-30b-a3b-thinking": [2e-7, 1e-6, null, null, null], "novita/qwen/qwen3-omni-30b-a3b-thinking": [25e-8, 97e-8, null, null, null], "qwen/qwen3-omni-30b-a3b-thinking": [25e-8, 97e-8, null, null, null], "novita/qwen/qwen3-omni-30b-a3b-instruct": [25e-8, 97e-8, null, null, null], "qwen/qwen3-omni-30b-a3b-instruct": [25e-8, 97e-8, null, null, null], "novita/qwen/qwen-mt-plus": [25e-8, 75e-8, null, null, null], "qwen/qwen-mt-plus": [25e-8, 75e-8, null, null, null], "novita/baidu/ernie-4.5-vl-28b-a3b": [14e-8, 56e-8, null, null, null], "baidu/ernie-4.5-vl-28b-a3b": [14e-8, 56e-8, null, null, null], "novita/baidu/ernie-4.5-21B-a3b": [7e-8, 28e-8, null, null, null], "baidu/ernie-4.5-21B-a3b": [7e-8, 28e-8, null, null, null], "novita/qwen/qwen3-8b-fp8": [35e-9, 138e-9, null, null, null], "qwen/qwen3-8b-fp8": [35e-9, 138e-9, null, null, null], "novita/qwen/qwen3-4b-fp8": [3e-8, 3e-8, null, null, null], "qwen/qwen3-4b-fp8": [3e-8, 3e-8, null, null, null], "novita/qwen/qwen2.5-7b-instruct": [7e-8, 7e-8, null, null, null], "qwen/qwen2.5-7b-instruct": [7e-8, 7e-8, null, null, null], "novita/meta-llama/llama-3.2-3b-instruct": [3e-8, 5e-8, null, null, null], "meta-llama/llama-3.2-3b-instruct": [3e-8, 5e-8, null, null, null], "novita/sao10k/l31-70b-euryale-v2.2": [148e-8, 148e-8, null, null, null], "sao10k/l31-70b-euryale-v2.2": [148e-8, 148e-8, null, null, null], "novita/qwen/qwen3-embedding-0.6b": [7e-8, 0, null, null, null], "qwen/qwen3-embedding-0.6b": [7e-8, 0, null, null, null], "novita/qwen/qwen3-embedding-8b": [7e-8, 0, null, null, null], "qwen/qwen3-embedding-8b": [7e-8, 0, null, null, null], "novita/baai/bge-m3": [1e-8, 1e-8, null, null, null], "baai/bge-m3": [1e-8, 1e-8, null, null, null], "novita/qwen/qwen3-reranker-8b": [5e-8, 5e-8, null, null, null], "qwen/qwen3-reranker-8b": [5e-8, 5e-8, null, null, null], "novita/baai/bge-reranker-v2-m3": [1e-8, 1e-8, null, null, null], "baai/bge-reranker-v2-m3": [1e-8, 1e-8, null, null, null], "llamagate/llama-3.1-8b": [3e-8, 5e-8, null, null, null], "llama-3.1-8b": [3e-8, 5e-8, null, null, null], "llamagate/llama-3.2-3b": [4e-8, 8e-8, null, null, null], "llama-3.2-3b": [4e-8, 8e-8, null, null, null], "llamagate/mistral-7b-v0.3": [1e-7, 15e-8, null, null, null], "mistral-7b-v0.3": [1e-7, 15e-8, null, null, null], "llamagate/qwen3-8b": [4e-8, 14e-8, null, null, null], "qwen3-8b": [4e-8, 14e-8, null, null, null], "llamagate/dolphin3-8b": [8e-8, 15e-8, null, null, null], "dolphin3-8b": [8e-8, 15e-8, null, null, null], "llamagate/deepseek-r1-8b": [1e-7, 2e-7, null, null, null], "deepseek-r1-8b": [1e-7, 2e-7, null, null, null], "llamagate/deepseek-r1-7b-qwen": [8e-8, 15e-8, null, null, null], "deepseek-r1-7b-qwen": [8e-8, 15e-8, null, null, null], "llamagate/openthinker-7b": [8e-8, 15e-8, null, null, null], "openthinker-7b": [8e-8, 15e-8, null, null, null], "llamagate/qwen2.5-coder-7b": [6e-8, 12e-8, null, null, null], "qwen2.5-coder-7b": [6e-8, 12e-8, null, null, null], "llamagate/deepseek-coder-6.7b": [6e-8, 12e-8, null, null, null], "deepseek-coder-6.7b": [6e-8, 12e-8, null, null, null], "llamagate/codellama-7b": [6e-8, 12e-8, null, null, null], "codellama-7b": [6e-8, 12e-8, null, null, null], "llamagate/qwen3-vl-8b": [15e-8, 55e-8, null, null, null], "qwen3-vl-8b": [15e-8, 55e-8, null, null, null], "llamagate/llava-7b": [1e-7, 2e-7, null, null, null], "llava-7b": [1e-7, 2e-7, null, null, null], "llamagate/gemma3-4b": [3e-8, 8e-8, null, null, null], "gemma3-4b": [3e-8, 8e-8, null, null, null], "llamagate/nomic-embed-text": [2e-8, 0, null, null, null], "nomic-embed-text": [2e-8, 0, null, null, null], "llamagate/qwen3-embedding-8b": [2e-8, 0, null, null, null], "qwen3-embedding-8b": [2e-8, 0, null, null, null], "sarvam/sarvam-m": [0, 0, 0, 0, null], "sarvam-m": [0, 0, 0, 0, null], "gemini/gemini-2.0-flash-exp-image-generation": [0, 0, null, null, null], "gemini/gemini-2.0-flash-lite-001": [75e-9, 3e-7, null, 1875e-11, null], "gemini/gemini-2.5-flash-native-audio-latest": [3e-7, 25e-7, null, null, null], "gemini/gemini-2.5-flash-native-audio-preview-09-2025": [3e-7, 25e-7, null, null, null], "gemini/gemini-2.5-flash-native-audio-preview-12-2025": [3e-7, 25e-7, null, null, null], "gemini/gemini-3.1-flash-live-preview": [75e-8, 45e-7, null, null, null], "gemini/gemini-pro-latest": [125e-8, 1e-5, null, 125e-9, null], "vertex_ai/claude-sonnet-4-6@default": [3e-6, 15e-6, 375e-8, 3e-7, null], "claude-sonnet-4-6@default": [3e-6, 15e-6, 375e-8, 3e-7, null], "bedrock_mantle/openai.gpt-oss-120b": [15e-8, 6e-7, null, null, null], "openai.gpt-oss-120b": [15e-8, 6e-7, null, null, null], "bedrock_mantle/openai.gpt-oss-20b": [75e-9, 3e-7, null, null, null], "openai.gpt-oss-20b": [75e-9, 3e-7, null, null, null], "bedrock_mantle/openai.gpt-oss-safeguard-120b": [15e-8, 6e-7, null, null, null], "bedrock_mantle/openai.gpt-oss-safeguard-20b": [75e-9, 3e-7, null, null, null], "bedrock/us-east-1/zai.glm-5": [1e-6, 32e-7, null, null, null], "us-east-1/zai.glm-5": [1e-6, 32e-7, null, null, null], "bedrock/us-west-2/zai.glm-5": [1e-6, 32e-7, null, null, null], "us-west-2/zai.glm-5": [1e-6, 32e-7, null, null, null], "bedrock/us-gov-east-1/anthropic.claude-haiku-4-5-20251001-v1:0": [12e-7, 6e-6, 15e-7, 12e-8, null], "us-gov-east-1/anthropic.claude-haiku-4-5-20251001-v1:0": [12e-7, 6e-6, 15e-7, 12e-8, null], "bedrock/us-gov-west-1/anthropic.claude-haiku-4-5-20251001-v1:0": [12e-7, 6e-6, 15e-7, 12e-8, null], "us-gov-west-1/anthropic.claude-haiku-4-5-20251001-v1:0": [12e-7, 6e-6, 15e-7, 12e-8, null], "MiniMax-M2.7-highspeed": [6e-7, 24e-7, 375e-9, 6e-8], "deepseek-v4-flash": [14e-8, 28e-8, 0, 28e-10], "deepseek-v4-pro": [435e-9, 87e-8, 0, 3625e-12] };
  }
});

// src/models.ts
import { readFile as readFile4, writeFile as writeFile4, mkdir as mkdir4 } from "fs/promises";
import { join as join5 } from "path";
import { homedir as homedir4 } from "os";
function loadSnapshot() {
  const map = /* @__PURE__ */ new Map();
  for (const [name, raw] of Object.entries(litellm_snapshot_default)) {
    const [input, output, cacheWrite, cacheRead, fast] = raw;
    map.set(name, {
      inputCostPerToken: input,
      outputCostPerToken: output,
      cacheWriteCostPerToken: cacheWrite ?? input * 1.25,
      cacheReadCostPerToken: cacheRead ?? input * 0.1,
      webSearchCostPerRequest: WEB_SEARCH_COST,
      fastMultiplier: fast ?? 1
    });
  }
  return map;
}
function getSortedPricingKeys() {
  if (sortedPricingKeys === null) {
    sortedPricingKeys = Array.from(pricingCache.keys()).sort((a, b) => b.length - a.length);
  }
  return sortedPricingKeys;
}
function getCacheDir2() {
  if (process.env["CODEBURN_CACHE_DIR"]) return process.env["CODEBURN_CACHE_DIR"];
  return join5(homedir4(), ".cache", "codeburn");
}
function getCachePath() {
  return join5(getCacheDir2(), "litellm-pricing.json");
}
function safePerTokenRate(n) {
  if (n === void 0 || !Number.isFinite(n) || n < 0) return null;
  if (n > 1) return 1;
  return n;
}
function parseLiteLLMEntry(entry) {
  const inputCost = safePerTokenRate(entry.input_cost_per_token);
  const outputCost = safePerTokenRate(entry.output_cost_per_token);
  if (inputCost === null || outputCost === null) return null;
  const cacheWrite = safePerTokenRate(entry.cache_creation_input_token_cost) ?? inputCost * 1.25;
  const cacheRead = safePerTokenRate(entry.cache_read_input_token_cost) ?? inputCost * 0.1;
  return {
    inputCostPerToken: inputCost,
    outputCostPerToken: outputCost,
    cacheWriteCostPerToken: cacheWrite,
    cacheReadCostPerToken: cacheRead,
    webSearchCostPerRequest: WEB_SEARCH_COST,
    fastMultiplier: entry.provider_specific_entry?.fast ?? 1
  };
}
async function fetchAndCachePricing() {
  const response = await fetch(LITELLM_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const pricing = /* @__PURE__ */ new Map();
  for (const [name, entry] of Object.entries(data)) {
    const costs = parseLiteLLMEntry(entry);
    if (!costs) continue;
    pricing.set(name, costs);
    const stripped = name.replace(/^[^/]+\//, "");
    if (stripped !== name && !pricing.has(stripped)) pricing.set(stripped, costs);
  }
  await mkdir4(getCacheDir2(), { recursive: true });
  await writeFile4(getCachePath(), JSON.stringify({
    timestamp: Date.now(),
    data: Object.fromEntries(pricing)
  }));
  return pricing;
}
async function loadCachedPricing() {
  try {
    const raw = await readFile4(getCachePath(), "utf-8");
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS2) return null;
    return new Map(Object.entries(cached.data));
  } catch {
    return null;
  }
}
function mergeSnapshotFallbacks(pricing) {
  for (const [name, costs] of loadSnapshot()) {
    if (!pricing.has(name)) pricing.set(name, costs);
  }
  return pricing;
}
async function loadPricing() {
  const cached = await loadCachedPricing();
  if (cached) {
    pricingCache = mergeSnapshotFallbacks(cached);
    sortedPricingKeys = null;
    return;
  }
  try {
    pricingCache = mergeSnapshotFallbacks(await fetchAndCachePricing());
    sortedPricingKeys = null;
  } catch {
  }
}
function setModelAliases(aliases) {
  userAliases = aliases;
}
function resolveAlias(model) {
  if (Object.hasOwn(userAliases, model)) return userAliases[model];
  if (Object.hasOwn(BUILTIN_ALIASES, model)) return BUILTIN_ALIASES[model];
  return model;
}
function getCanonicalName(model) {
  return model.replace(/@.*$/, "").replace(/-\d{8}$/, "").replace(/^[^/]+\//, "");
}
function getModelCosts(model) {
  const withPrefix = model.replace(/@.*$/, "").replace(/-\d{8}$/, "");
  if (pricingCache.has(withPrefix)) return pricingCache.get(withPrefix);
  const canonical = resolveAlias(getCanonicalName(model));
  if (pricingCache.has(canonical)) return pricingCache.get(canonical);
  for (const key of getSortedPricingKeys()) {
    if (canonical.startsWith(key + "-") || canonical === key) {
      return pricingCache.get(key);
    }
  }
  return null;
}
function looksLikeLocalModel(name) {
  if (name.includes(":") && !name.startsWith("http")) return true;
  if (/[-_](q[2-8](_[a-z0-9]+)?|bf16|fp16|gguf|f16|f32)$/i.test(name)) return true;
  return false;
}
function shouldWarnAboutUnknownModel(name) {
  if (!name || name === "<synthetic>") return false;
  if (warnedUnknownModels.has(name)) return false;
  if (looksLikeLocalModel(name)) return false;
  if (process.env["CODEBURN_VERBOSE"] !== "1") return false;
  return true;
}
function calculateCost(model, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, webSearchRequests, speed = "standard", oneHourCacheCreationTokens = 0) {
  const costs = getModelCosts(model);
  if (!costs) {
    if (shouldWarnAboutUnknownModel(model)) {
      warnedUnknownModels.add(model);
      const safeName = model.replace(/[\x00-\x1F\x7F-\x9F]/g, "?").slice(0, 200);
      const aliasHint = `Map it with: codeburn model-alias "${safeName}" <known-model>`;
      process.stderr.write(
        `codeburn: no pricing data for model "${safeName}" \u2014 costs for this model will show $0. ${aliasHint}, or update with: npx codeburn@latest.
`
      );
    }
    return 0;
  }
  const multiplier = speed === "fast" ? costs.fastMultiplier : 1;
  const safe = (n) => Number.isFinite(n) && n > 0 ? n : 0;
  const safeOneHourCacheCreation = safe(oneHourCacheCreationTokens);
  const safeCacheCreation = Math.max(safe(cacheCreationTokens), safeOneHourCacheCreation);
  const safeFiveMinuteCacheCreation = Math.max(0, safeCacheCreation - safeOneHourCacheCreation);
  return multiplier * (safe(inputTokens) * costs.inputCostPerToken + safe(outputTokens) * costs.outputCostPerToken + safeFiveMinuteCacheCreation * costs.cacheWriteCostPerToken + safeOneHourCacheCreation * costs.cacheWriteCostPerToken * ONE_HOUR_CACHE_WRITE_MULTIPLIER_FROM_FIVE_MINUTE_RATE + safe(cacheReadTokens) * costs.cacheReadCostPerToken + safe(webSearchRequests) * costs.webSearchCostPerRequest);
}
function deriveClaudeShortName(canonical) {
  const m = canonical.match(/^claude-(opus|sonnet|haiku)-(\d+)(?:-(\d+))?/);
  if (!m) return void 0;
  const [, family, major, minor] = m;
  return `${CLAUDE_FAMILY[family]} ${major}${minor ? `.${minor}` : ""}`;
}
function getShortModelName(model) {
  if (autoModelNames[model]) return autoModelNames[model];
  const canonical = resolveAlias(getCanonicalName(model));
  const claude2 = deriveClaudeShortName(canonical);
  if (claude2) return claude2;
  for (const [key, name] of SORTED_SHORT_NAMES) {
    if (canonical === key || canonical.startsWith(key + "-")) return name;
  }
  return canonical;
}
var LITELLM_URL, CACHE_TTL_MS2, WEB_SEARCH_COST, ONE_HOUR_CACHE_WRITE_MULTIPLIER_FROM_FIVE_MINUTE_RATE, pricingCache, sortedPricingKeys, BUILTIN_ALIASES, userAliases, warnedUnknownModels, autoModelNames, SHORT_NAMES, SORTED_SHORT_NAMES, CLAUDE_FAMILY;
var init_models = __esm({
  "src/models.ts"() {
    "use strict";
    init_litellm_snapshot();
    LITELLM_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
    CACHE_TTL_MS2 = 24 * 60 * 60 * 1e3;
    WEB_SEARCH_COST = 0.01;
    ONE_HOUR_CACHE_WRITE_MULTIPLIER_FROM_FIVE_MINUTE_RATE = 1.6;
    pricingCache = loadSnapshot();
    sortedPricingKeys = null;
    BUILTIN_ALIASES = {
      "anthropic--claude-4.6-opus": "claude-opus-4-6",
      "anthropic--claude-4.6-sonnet": "claude-sonnet-4-6",
      "anthropic--claude-4.5-opus": "claude-opus-4-5",
      "anthropic--claude-4.5-sonnet": "claude-sonnet-4-5",
      "anthropic--claude-4.5-haiku": "claude-haiku-4-5",
      "claude-sonnet-4.6": "claude-sonnet-4-6",
      "claude-sonnet-4.5": "claude-sonnet-4-5",
      "claude-opus-4.7": "claude-opus-4-7",
      "claude-opus-4.6": "claude-opus-4-6",
      "claude-opus-4.5": "claude-opus-4-5",
      "cursor-auto": "claude-sonnet-4-5",
      "cursor-agent-auto": "claude-sonnet-4-5",
      "copilot-auto": "claude-sonnet-4-5",
      "copilot-openai-auto": "gpt-5.3-codex",
      "copilot-anthropic-auto": "claude-sonnet-4-5",
      "ibm-bob-auto": "claude-sonnet-4-5",
      "kiro-auto": "claude-sonnet-4-5",
      "cline-auto": "claude-sonnet-4-5",
      "openclaw-auto": "claude-sonnet-4-5",
      "warp-auto-efficient": "gpt-5.3-codex",
      "warp-auto-powerful": "claude-opus-4-6",
      "GPT-5.3 Codex (low reasoning)": "gpt-5.3-codex",
      "GPT-5.3 Codex (medium reasoning)": "gpt-5.3-codex",
      "GPT-5.3 Codex (high reasoning)": "gpt-5.3-codex",
      "GPT-5.3 Codex (extra high reasoning)": "gpt-5.3-codex",
      "Claude Sonnet 4.6": "claude-sonnet-4-6",
      "Claude Sonnet 4.5": "claude-sonnet-4-5",
      "Claude Haiku 4.5": "claude-haiku-4-5",
      "Claude Opus 4.6": "claude-opus-4-6",
      "claude-4-6-sonnet-high": "claude-sonnet-4-6",
      "claude-4-6-sonnet-low": "claude-sonnet-4-6",
      "claude-4-6-sonnet-medium": "claude-sonnet-4-6",
      "claude-4-6-sonnet-high-fast": "claude-sonnet-4-6",
      "claude-4-7-opus-xhigh": "claude-opus-4-7",
      "claude-4-7-opus-xhigh-fast": "claude-opus-4-7",
      "qwen-auto": "claude-sonnet-4-5",
      "kimi-auto": "kimi-k2-thinking",
      "kimi-code": "kimi-k2-thinking",
      "kimi-for-coding": "kimi-k2-thinking",
      // Cursor emits dot-version tier-last names plus tier/reasoning suffixes
      // that LiteLLM does not index (`-high`, `-low`, `-medium`, `-thinking`,
      // `-high-thinking`, `-fast-mode`). Missing aliases here surface as $0 in
      // the dashboard for users on non-Auto models (issue #159). Sources: the
      // display map at `src/providers/cursor.ts:modelDisplayNames`, Cursor's
      // public model docs at https://cursor.com/docs/models, and forum bug
      // reports that quote literal slugs (e.g. forum.cursor.com/t/154933).
      "claude-4-sonnet": "claude-sonnet-4",
      "claude-4-sonnet-1m": "claude-sonnet-4",
      "claude-4-sonnet-thinking": "claude-sonnet-4-5",
      "claude-4.5-sonnet": "claude-sonnet-4-5",
      "claude-4.5-sonnet-thinking": "claude-sonnet-4-5",
      "claude-4.6-sonnet": "claude-sonnet-4-6",
      "claude-4.6-sonnet-high": "claude-sonnet-4-6",
      "claude-4.6-sonnet-low": "claude-sonnet-4-6",
      "claude-4.6-sonnet-thinking": "claude-sonnet-4-6",
      "claude-4.6-sonnet-high-thinking": "claude-sonnet-4-6",
      "claude-4-opus": "claude-opus-4",
      "claude-4.5-opus": "claude-opus-4-5",
      "claude-4.5-opus-high": "claude-opus-4-5",
      "claude-4.5-opus-low": "claude-opus-4-5",
      "claude-4.5-opus-medium": "claude-opus-4-5",
      "claude-4.5-opus-high-thinking": "claude-opus-4-5",
      "claude-4.6-opus": "claude-opus-4-6",
      "claude-4.6-opus-fast-mode": "claude-opus-4-6",
      "claude-4.6-opus-high": "claude-opus-4-6",
      "claude-4.6-opus-low": "claude-opus-4-6",
      "claude-4.6-opus-medium": "claude-opus-4-6",
      "claude-4.6-opus-high-thinking": "claude-opus-4-6",
      "claude-4.7-opus": "claude-opus-4-7",
      // Dash form (NOT dot) seen in forum.cursor.com/t/158597.
      "claude-opus-4-7-thinking-high": "claude-opus-4-7",
      "claude-4.5-haiku": "claude-haiku-4-5",
      "claude-4.6-haiku": "claude-haiku-4-5",
      // Cursor's house models have no LiteLLM pricing entry. composer-1 is
      // sonnet-4.5-class per Cursor docs; composer-2 is built on Sonnet 4.6
      // per cursor.com/blog/composer-2.
      "composer-1": "claude-sonnet-4-5",
      "composer-1.5": "claude-sonnet-4-5",
      "composer-2": "claude-sonnet-4-6",
      // Cursor's "fast" routing variant of GPT-5 is the same model behind a
      // lower-latency endpoint; price as base GPT-5 until LiteLLM tracks it.
      "gpt-5-fast": "gpt-5",
      "gpt-4.1": "gpt-4.1",
      "gpt-5.2-low": "gpt-5",
      "gpt-5.1-codex-high": "gpt-5.3-codex",
      // Antigravity Gemini model IDs resolve to preview-priced entries.
      "gemini-3.1-pro": "gemini-3.1-pro-preview",
      "gemini-3-flash": "gemini-3-flash-preview",
      "gemini-3.1-pro-high": "gemini-3.1-pro-preview",
      "gemini-3.1-pro-low": "gemini-3.1-pro-preview",
      "gemini-3-flash-agent": "gemini-3-flash-preview",
      "gemini-3.5-flash-high": "gemini-3.5-flash",
      "gemini-3.5-flash-medium": "gemini-3.5-flash",
      "gemini-3.5-flash-low": "gemini-3.5-flash",
      "Gemini 3.5 Flash (High)": "gemini-3.5-flash",
      "Gemini 3.5 Flash (Medium)": "gemini-3.5-flash",
      "Gemini 3.5 Flash (Low)": "gemini-3.5-flash",
      "gemini-3-pro": "gemini-3-pro-preview",
      "gemini-3.1-flash-image": "gemini-3.1-flash-image-preview",
      "gemini-3.1-flash-lite": "gemini-3.1-flash-lite-preview"
    };
    userAliases = {};
    warnedUnknownModels = /* @__PURE__ */ new Set();
    autoModelNames = {
      "cursor-auto": "Cursor (auto)",
      "cursor-agent-auto": "Cursor (auto)",
      "copilot-auto": "Copilot (auto)",
      "copilot-openai-auto": "Copilot (OpenAI)",
      "copilot-anthropic-auto": "Copilot (Anthropic)",
      "ibm-bob-auto": "IBM Bob (auto)",
      "kiro-auto": "Kiro (auto)",
      "cline-auto": "Cline (auto)",
      "openclaw-auto": "OpenClaw (auto)",
      "qwen-auto": "Qwen (auto)",
      "kimi-auto": "Kimi (auto)"
    };
    SHORT_NAMES = {
      // Modern claude-<family>-<major>-<minor> ids are derived in deriveClaudeShortName.
      // Only the legacy 3.x ids (family-last) need explicit mapping.
      "claude-3-7-sonnet": "Sonnet 3.7",
      "claude-3-5-sonnet": "Sonnet 3.5",
      "claude-3-5-haiku": "Haiku 3.5",
      "gpt-4o-mini": "GPT-4o Mini",
      "gpt-4o": "GPT-4o",
      "gpt-4.1-nano": "GPT-4.1 Nano",
      "gpt-4.1-mini": "GPT-4.1 Mini",
      "gpt-4.1": "GPT-4.1",
      "codex-auto-review": "Codex Auto Review",
      "gpt-5.5-pro": "GPT-5.5 Pro",
      "gpt-5.5": "GPT-5.5",
      "gpt-5.4-pro": "GPT-5.4 Pro",
      "gpt-5.4-nano": "GPT-5.4 Nano",
      "gpt-5.4-mini": "GPT-5.4 Mini",
      "gpt-5.4": "GPT-5.4",
      "gpt-5.3-codex": "GPT-5.3 Codex",
      "gpt-5.3": "GPT-5.3",
      "gpt-5.2-pro": "GPT-5.2 Pro",
      "gpt-5.2-low": "GPT-5.2 Low",
      "gpt-5.2": "GPT-5.2",
      "gpt-5.1-codex-mini": "GPT-5.1 Codex Mini",
      "gpt-5.1-codex": "GPT-5.1 Codex",
      "gpt-5.1": "GPT-5.1",
      "gpt-5-pro": "GPT-5 Pro",
      "gpt-5-nano": "GPT-5 Nano",
      "gpt-5-mini": "GPT-5 Mini",
      "gpt-5": "GPT-5",
      "gemini-3.5-flash": "Gemini 3.5 Flash",
      "gemini-3.1-pro-preview": "Gemini 3.1 Pro",
      "gemini-3-flash-preview": "Gemini 3 Flash",
      "gemini-2.5-pro": "Gemini 2.5 Pro",
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "kimi-k2-thinking-turbo": "Kimi K2 Thinking Turbo",
      "kimi-k2-thinking": "Kimi K2 Thinking",
      "kimi-thinking-preview": "Kimi Thinking",
      "kimi-k2.6": "Kimi K2.6",
      "kimi-k2.5": "Kimi K2.5",
      "kimi-k2p5": "Kimi K2.5",
      "kimi-k2-instruct": "Kimi K2 Instruct",
      "kimi-k2-0905": "Kimi K2",
      "kimi-k2": "Kimi K2",
      "kimi-latest": "Kimi Latest",
      "moonshot-v1": "Moonshot v1",
      "deepseek-v4-pro": "DeepSeek v4 Pro",
      "deepseek-v4-flash": "DeepSeek v4 Flash",
      "deepseek-coder-max": "DeepSeek Coder Max",
      "deepseek-coder": "DeepSeek Coder",
      "deepseek-r1": "DeepSeek R1",
      "o4-mini": "o4-mini",
      "o3": "o3",
      "MiniMax-M2.7-highspeed": "MiniMax M2.7 Highspeed",
      "MiniMax-M2.7": "MiniMax M2.7"
    };
    SORTED_SHORT_NAMES = Object.entries(SHORT_NAMES).sort((a, b) => b[0].length - a[0].length);
    CLAUDE_FAMILY = { opus: "Opus", sonnet: "Sonnet", haiku: "Haiku" };
  }
});

// src/fs-utils.ts
import { readFile as readFile5, stat as stat3 } from "fs/promises";
import { readFileSync, statSync, createReadStream } from "fs";
function verbose() {
  return process.env.CODEBURN_VERBOSE === "1";
}
function warn(msg) {
  if (verbose()) process.stderr.write(`codeburn: ${msg}
`);
}
async function readSessionFile(filePath) {
  let size;
  try {
    size = (await stat3(filePath)).size;
  } catch (err) {
    warn(`stat failed for ${filePath}: ${err.code ?? "unknown"}`);
    return null;
  }
  if (size > MAX_SESSION_FILE_BYTES) {
    warn(`skipped oversize file ${filePath} (${size} bytes > cap ${MAX_SESSION_FILE_BYTES})`);
    return null;
  }
  try {
    return await readFile5(filePath, "utf-8");
  } catch (err) {
    warn(`read failed for ${filePath}: ${err.code ?? "unknown"}`);
    return null;
  }
}
function readSessionFileSync(filePath) {
  let size;
  try {
    size = statSync(filePath).size;
  } catch (err) {
    warn(`stat failed for ${filePath}: ${err.code ?? "unknown"}`);
    return null;
  }
  if (size > MAX_SESSION_FILE_BYTES) {
    warn(`skipped oversize file ${filePath} (${size} bytes > cap ${MAX_SESSION_FILE_BYTES})`);
    return null;
  }
  try {
    return readFileSync(filePath, "utf-8");
  } catch (err) {
    warn(`read failed for ${filePath}: ${err.code ?? "unknown"}`);
    return null;
  }
}
async function* readSessionLines(filePath, shouldSkipHead, options = {}) {
  let size;
  try {
    size = (await stat3(filePath)).size;
  } catch (err) {
    warn(`stat failed for ${filePath}: ${err.code ?? "unknown"}`);
    return;
  }
  if (size > MAX_STREAM_SESSION_FILE_BYTES) {
    warn(
      `skipped oversize file ${filePath} (${size} bytes > stream cap ${MAX_STREAM_SESSION_FILE_BYTES})`
    );
    return;
  }
  const stream = createReadStream(
    filePath,
    options.startByteOffset !== void 0 ? { start: options.startByteOffset } : void 0
  );
  const SKIP_HEAD = 2048;
  const largeLineThreshold = options.largeLineThresholdBytes ?? LARGE_STREAM_LINE_BYTES;
  const formatLine = (buf, lineLen, head) => {
    if (options.largeLineAsBuffer && lineLen > largeLineThreshold) return buf;
    return head !== void 0 && lineLen <= SKIP_HEAD ? head : buf.toString("utf-8");
  };
  let parts = [];
  let len = 0;
  let skipping = false;
  let headChecked = false;
  let chunkBase = options.startByteOffset ?? 0;
  const tracker = options.byteOffsetTracker;
  try {
    for await (const raw of stream) {
      const chunk = raw;
      let pos = 0;
      while (pos < chunk.length) {
        const nl = chunk.indexOf(10, pos);
        if (skipping) {
          if (nl === -1) {
            pos = chunk.length;
          } else {
            if (tracker) tracker.lastCompleteLineOffset = chunkBase + nl + 1;
            skipping = false;
            pos = nl + 1;
          }
          continue;
        }
        if (nl !== -1) {
          if (pos < nl) {
            parts.push(chunk.subarray(pos, nl));
            len += nl - pos;
          }
          pos = nl + 1;
          if (tracker) tracker.lastCompleteLineOffset = chunkBase + pos;
          if (len === 0) {
            parts = [];
            headChecked = false;
            continue;
          }
          const buf = parts.length === 1 ? parts[0] : Buffer.concat(parts, len);
          const lineLen = len;
          parts = [];
          len = 0;
          headChecked = false;
          if (shouldSkipHead) {
            const head = lineLen > SKIP_HEAD ? buf.subarray(0, SKIP_HEAD).toString("utf-8") : buf.toString("utf-8");
            if (shouldSkipHead(head)) continue;
            yield formatLine(buf, lineLen, head);
          } else {
            yield formatLine(buf, lineLen);
          }
        } else {
          const slice = chunk.subarray(pos);
          parts.push(slice);
          len += slice.length;
          pos = chunk.length;
          if (shouldSkipHead && !headChecked && len >= SKIP_HEAD) {
            headChecked = true;
            const headBuf = parts.length === 1 ? parts[0].subarray(0, SKIP_HEAD) : Buffer.concat(parts, len).subarray(0, SKIP_HEAD);
            if (shouldSkipHead(headBuf.toString("utf-8"))) {
              skipping = true;
              parts = [];
              len = 0;
            }
          }
        }
      }
      chunkBase += chunk.length;
    }
    if (!skipping && len > 0) {
      const buf = parts.length === 1 ? parts[0] : Buffer.concat(parts, len);
      const lineLen = len;
      if (shouldSkipHead) {
        const head = lineLen > SKIP_HEAD ? buf.subarray(0, SKIP_HEAD).toString("utf-8") : buf.toString("utf-8");
        if (!shouldSkipHead(head)) {
          yield formatLine(buf, lineLen, head);
        }
      } else {
        yield formatLine(buf, lineLen);
      }
    }
  } catch (err) {
    warn(`stream read failed for ${filePath}: ${err.code ?? "unknown"}`);
  } finally {
    stream.destroy();
  }
}
var MAX_SESSION_FILE_BYTES, LARGE_STREAM_LINE_BYTES, MAX_STREAM_SESSION_FILE_BYTES;
var init_fs_utils = __esm({
  "src/fs-utils.ts"() {
    "use strict";
    MAX_SESSION_FILE_BYTES = 128 * 1024 * 1024;
    LARGE_STREAM_LINE_BYTES = 32 * 1024;
    MAX_STREAM_SESSION_FILE_BYTES = 2 * 1024 * 1024 * 1024;
  }
});

// src/providers/claude.ts
import { readFile as readFile6, readdir as readdir2, stat as stat4 } from "fs/promises";
import { basename, delimiter as pathDelimiter, join as join7, resolve as resolve2 } from "path";
import { homedir as homedir5 } from "os";
function expandHome(p) {
  if (p === "~") return homedir5();
  if (p.startsWith("~/") || p.startsWith("~\\")) return join7(homedir5(), p.slice(2));
  return p;
}
function getClaudeConfigDirs() {
  const multi = process.env["CLAUDE_CONFIG_DIRS"];
  if (multi !== void 0 && multi !== "") {
    const dirs = multi.split(pathDelimiter).map((s) => s.trim()).filter((s) => s.length > 0).map((s) => resolve2(expandHome(s)));
    if (dirs.length > 0) {
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const d of dirs) {
        if (!seen.has(d)) {
          seen.add(d);
          out.push(d);
        }
      }
      return out;
    }
  }
  const single = process.env["CLAUDE_CONFIG_DIR"];
  if (single !== void 0 && single !== "") return [resolve2(expandHome(single))];
  return [join7(homedir5(), ".claude")];
}
function getDesktopSessionsDir() {
  const override = process.env["CODEBURN_DESKTOP_SESSIONS_DIR"];
  if (override) return override;
  if (process.platform === "darwin") return join7(homedir5(), "Library", "Application Support", "Claude", "local-agent-mode-sessions");
  if (process.platform === "win32") return join7(homedir5(), "AppData", "Roaming", "Claude", "local-agent-mode-sessions");
  return join7(homedir5(), ".config", "Claude", "local-agent-mode-sessions");
}
async function findDesktopProjectDirs(base) {
  const results = [];
  async function walk(dir, depth) {
    if (depth > 8) return;
    const entries = await readdir2(dir).catch(() => []);
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git") continue;
      const full = join7(dir, entry);
      const s = await stat4(full).catch(() => null);
      if (!s?.isDirectory()) continue;
      if (entry === "projects") {
        const projectDirs = await readdir2(full).catch(() => []);
        for (const pd of projectDirs) {
          const pdFull = join7(full, pd);
          const pdStat = await stat4(pdFull).catch(() => null);
          if (pdStat?.isDirectory()) results.push(pdFull);
        }
      } else {
        await walk(full, depth + 1);
      }
    }
  }
  await walk(base, 0);
  return results;
}
async function loadSpacesJson(workspaceDir) {
  if (spacesJsonCache.has(workspaceDir)) return spacesJsonCache.get(workspaceDir) ?? null;
  try {
    const raw = await readFile6(join7(workspaceDir, "spaces.json"), "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && "spaces" in parsed && Array.isArray(parsed.spaces)) {
      const result = parsed;
      spacesJsonCache.set(workspaceDir, result);
      return result;
    }
  } catch {
  }
  spacesJsonCache.set(workspaceDir, null);
  return null;
}
async function resolveCoworkSpaceName(workspaceDir, sessionId) {
  const [spacesFile, sessionMetaRaw] = await Promise.all([
    loadSpacesJson(workspaceDir),
    readFile6(join7(workspaceDir, `${sessionId}.json`), "utf-8").catch(() => null)
  ]);
  if (!sessionMetaRaw) return null;
  let sessionMeta;
  try {
    sessionMeta = JSON.parse(sessionMetaRaw);
  } catch {
    return null;
  }
  if (sessionMeta === null || typeof sessionMeta !== "object") return null;
  const meta = sessionMeta;
  const spaceId = meta["spaceId"];
  if (typeof spaceId === "string" && spacesFile) {
    const spaceName = spacesFile.spaces.find((s) => s.id === spaceId)?.name;
    if (spaceName) return spaceName;
  }
  const folders = meta["userSelectedFolders"];
  if (Array.isArray(folders) && folders.length > 0 && typeof folders[0] === "string") {
    return basename(folders[0]);
  }
  const title = meta["title"];
  if (typeof title === "string" && title.trim().length > 0) return title.trim();
  return null;
}
var spacesJsonCache, claude;
var init_claude = __esm({
  "src/providers/claude.ts"() {
    "use strict";
    init_models();
    spacesJsonCache = /* @__PURE__ */ new Map();
    claude = {
      name: "claude",
      displayName: "Claude",
      modelDisplayName(model) {
        return getShortModelName(model);
      },
      toolDisplayName(rawTool) {
        return rawTool;
      },
      async discoverSessions() {
        const sources = [];
        const seenProjectDirs = /* @__PURE__ */ new Set();
        const configDirs = getClaudeConfigDirs();
        let anyDirReadable = false;
        for (const claudeDir of configDirs) {
          const projectsDir = join7(claudeDir, "projects");
          let entries;
          try {
            entries = await readdir2(projectsDir);
            anyDirReadable = true;
          } catch {
            continue;
          }
          for (const dirName of entries) {
            const dirPath = join7(projectsDir, dirName);
            const resolved = resolve2(dirPath);
            if (seenProjectDirs.has(resolved)) continue;
            const dirStat = await stat4(dirPath).catch(() => null);
            if (!dirStat?.isDirectory()) continue;
            seenProjectDirs.add(resolved);
            sources.push({ path: dirPath, project: dirName, provider: "claude" });
          }
        }
        const explicitMulti = process.env["CLAUDE_CONFIG_DIRS"];
        if (!anyDirReadable && explicitMulti !== void 0 && explicitMulti !== "" && configDirs.length > 0) {
          process.stderr.write(
            `codeburn: CLAUDE_CONFIG_DIRS was set but no listed directory could be read. Tried: ${configDirs.join(", ")}. Use "${pathDelimiter}" as the separator on this platform.
`
          );
        }
        const desktopBase = getDesktopSessionsDir();
        const desktopDirs = await findDesktopProjectDirs(desktopBase);
        const sep2 = desktopBase.includes("\\") ? "\\" : "/";
        for (const dirPath of desktopDirs) {
          const resolved = resolve2(dirPath);
          if (seenProjectDirs.has(resolved)) continue;
          seenProjectDirs.add(resolved);
          let projectName = basename(dirPath);
          const resolvedBase = resolve2(desktopBase);
          if (resolved.startsWith(resolvedBase + sep2) || resolved.startsWith(resolvedBase + "/")) {
            const rel = resolved.slice(resolvedBase.length + 1);
            const parts = rel.split(/[/\\]/);
            if (parts.length >= 6 && parts[2]?.startsWith("local_") && parts[3] === ".claude" && parts[4] === "projects") {
              const workspaceDir = join7(resolvedBase, parts[0], parts[1]);
              const sessionId = parts[2];
              const spaceName = await resolveCoworkSpaceName(workspaceDir, sessionId);
              if (spaceName) projectName = spaceName;
            }
          }
          sources.push({ path: dirPath, project: projectName, provider: "claude" });
        }
        return sources;
      },
      createSessionParser() {
        return {
          async *parse() {
          }
        };
      }
    };
  }
});

// src/providers/vscode-cline-parser.ts
import { readdir as readdir3, readFile as readFile7, stat as stat5 } from "fs/promises";
import { basename as basename2, join as join8, posix, win32 } from "path";
import { homedir as homedir6 } from "os";
function getVSCodeGlobalStoragePaths(extensionId, homeDir = homedir6(), platform4 = process.platform) {
  const pathJoin = platform4 === "win32" ? win32.join : posix.join;
  if (platform4 === "darwin") {
    return [
      pathJoin(homeDir, "Library", "Application Support", "Code", "User", "globalStorage", extensionId),
      pathJoin(homeDir, "Library", "Application Support", "Code - Insiders", "User", "globalStorage", extensionId),
      pathJoin(homeDir, "Library", "Application Support", "VSCodium", "User", "globalStorage", extensionId)
    ];
  }
  if (platform4 === "win32") {
    return [
      pathJoin(homeDir, "AppData", "Roaming", "Code", "User", "globalStorage", extensionId),
      pathJoin(homeDir, "AppData", "Roaming", "Code - Insiders", "User", "globalStorage", extensionId),
      pathJoin(homeDir, "AppData", "Roaming", "VSCodium", "User", "globalStorage", extensionId)
    ];
  }
  return [
    pathJoin(homeDir, ".config", "Code", "User", "globalStorage", extensionId),
    pathJoin(homeDir, ".config", "Code - Insiders", "User", "globalStorage", extensionId),
    pathJoin(homeDir, ".config", "VSCodium", "User", "globalStorage", extensionId)
  ];
}
function getVSCodeGlobalStoragePath(extensionId) {
  return getVSCodeGlobalStoragePaths(extensionId)[0];
}
async function discoverClineTasks(extensionId, providerName, displayName, overrideDir) {
  const baseDirs = overrideDir ? Array.isArray(overrideDir) ? overrideDir : [overrideDir] : getVSCodeGlobalStoragePaths(extensionId);
  return discoverClineTasksInBaseDirs(baseDirs, providerName, displayName);
}
async function discoverClineTasksInBaseDirs(baseDirs, providerName, displayName) {
  const sources = [];
  const seen = /* @__PURE__ */ new Set();
  for (const baseDir of baseDirs) {
    for (const source of await discoverClineTasksInBaseDir(baseDir, providerName, displayName)) {
      if (seen.has(source.path)) continue;
      seen.add(source.path);
      sources.push(source);
    }
  }
  return sources;
}
async function discoverClineTasksInBaseDir(baseDir, providerName, displayName) {
  const tasksDir = join8(baseDir, "tasks");
  const sources = [];
  let taskDirs;
  try {
    taskDirs = await readdir3(tasksDir);
  } catch {
    return sources;
  }
  for (const taskId of taskDirs) {
    const taskDir = join8(tasksDir, taskId);
    const dirStat = await stat5(taskDir).catch(() => null);
    if (!dirStat?.isDirectory()) continue;
    const uiPath = join8(taskDir, "ui_messages.json");
    const uiStat = await stat5(uiPath).catch(() => null);
    if (!uiStat?.isFile()) continue;
    sources.push({ path: taskDir, project: displayName, provider: providerName });
  }
  return sources;
}
function extractHistoryMeta(taskDir, fallbackModel) {
  return readFile7(join8(taskDir, "api_conversation_history.json"), "utf-8").then((raw) => {
    const msgs = JSON.parse(raw);
    if (!Array.isArray(msgs)) return { model: fallbackModel, workspace: null };
    let model = null;
    let workspace = null;
    for (const msg of msgs) {
      if (msg.role !== "user" || !Array.isArray(msg.content)) continue;
      for (const block of msg.content) {
        if (typeof block.text !== "string") continue;
        if (!model) {
          const mm = MODEL_TAG_RE.exec(block.text);
          if (mm) model = mm[1].includes("/") ? mm[1].split("/").pop() : mm[1];
        }
        if (!workspace) {
          const wm = WORKSPACE_DIR_RE.exec(block.text);
          if (wm) workspace = wm[1];
        }
        if (model && workspace) break;
      }
      if (model && workspace) break;
    }
    return { model: model ?? fallbackModel, workspace };
  }).catch(() => ({ model: fallbackModel, workspace: null }));
}
function workspaceToProject(workspace) {
  return basename2(workspace) || workspace;
}
function createClineParser(source, seenKeys, providerName, fallbackModel = "cline-auto") {
  return {
    async *parse() {
      const taskDir = source.path;
      const taskId = basename2(taskDir);
      let uiRaw;
      try {
        uiRaw = await readFile7(join8(taskDir, "ui_messages.json"), "utf-8");
      } catch {
        return;
      }
      let uiMessages;
      try {
        uiMessages = JSON.parse(uiRaw);
      } catch {
        return;
      }
      if (!Array.isArray(uiMessages)) return;
      const meta = await extractHistoryMeta(taskDir, fallbackModel);
      const model = meta.model;
      const project = meta.workspace ? workspaceToProject(meta.workspace) : void 0;
      const projectPath = meta.workspace ?? void 0;
      let userMessage = "";
      for (const msg of uiMessages) {
        if (msg.type === "say" && (msg.say === "user_feedback" || msg.say === "text")) {
          userMessage = (msg.text ?? "").slice(0, 500);
          break;
        }
      }
      const apiReqEntries = uiMessages.filter((m) => m.type === "say" && m.say === "api_req_started");
      for (const [index, entry] of apiReqEntries.entries()) {
        const dedupKey = `${providerName}:${taskId}:${index}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);
        let tokensIn = 0;
        let tokensOut = 0;
        let cacheReads = 0;
        let cacheWrites = 0;
        let cost;
        if (entry.text) {
          try {
            const parsed = JSON.parse(entry.text);
            tokensIn = parsed.tokensIn ?? 0;
            tokensOut = parsed.tokensOut ?? 0;
            cacheReads = parsed.cacheReads ?? 0;
            cacheWrites = parsed.cacheWrites ?? 0;
            cost = parsed.cost;
          } catch {
          }
        }
        if (tokensIn === 0 && tokensOut === 0) continue;
        const timestamp = entry.ts ? new Date(entry.ts).toISOString() : "";
        const costUSD = cost ?? calculateCost(model, tokensIn, tokensOut, cacheWrites, cacheReads, 0);
        yield {
          provider: providerName,
          model,
          inputTokens: tokensIn,
          outputTokens: tokensOut,
          cacheCreationInputTokens: cacheWrites,
          cacheReadInputTokens: cacheReads,
          cachedInputTokens: cacheReads,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools: [],
          bashCommands: [],
          timestamp,
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: index === 0 ? userMessage : "",
          sessionId: taskId,
          project,
          projectPath
        };
      }
    }
  };
}
var MODEL_TAG_RE, WORKSPACE_DIR_RE;
var init_vscode_cline_parser = __esm({
  "src/providers/vscode-cline-parser.ts"() {
    "use strict";
    init_models();
    MODEL_TAG_RE = /<model>([^<]+)<\/model>/;
    WORKSPACE_DIR_RE = /Current Workspace Directory \(([^)]+)\)/;
  }
});

// src/providers/cline.ts
import { stat as stat6 } from "fs/promises";
import { homedir as homedir7 } from "os";
import { basename as basename3, join as join9 } from "path";
function getClineDataPath() {
  return join9(homedir7(), ".cline", "data");
}
function normalizeOverrideDirs(overrideDirs) {
  if (overrideDirs === void 0) return void 0;
  return Array.isArray(overrideDirs) ? overrideDirs : [overrideDirs];
}
async function dedupeTaskSources(sources) {
  const candidates = await Promise.all(sources.map(async (source) => ({
    source,
    mtimeMs: (await stat6(join9(source.path, "ui_messages.json")).catch(() => null))?.mtimeMs ?? 0
  })));
  const seenTaskIds = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const { source } of candidates.sort((a, b) => b.mtimeMs - a.mtimeMs)) {
    const taskId = basename3(source.path);
    if (seenTaskIds.has(taskId)) continue;
    seenTaskIds.add(taskId);
    deduped.push(source);
  }
  return deduped;
}
function createClineProvider(overrideDirs) {
  const configuredDirs = normalizeOverrideDirs(overrideDirs);
  return {
    name: "cline",
    displayName: "Cline",
    modelDisplayName(model) {
      return model;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      const baseDirs = configuredDirs ?? [
        getVSCodeGlobalStoragePath(EXTENSION_ID),
        getClineDataPath()
      ];
      const sources = await Promise.all(
        baseDirs.map((dir) => discoverClineTasks(EXTENSION_ID, "cline", "Cline", dir))
      );
      return dedupeTaskSources(sources.flat());
    },
    createSessionParser(source, seenKeys) {
      return createClineParser(source, seenKeys, "cline");
    }
  };
}
var EXTENSION_ID, cline;
var init_cline = __esm({
  "src/providers/cline.ts"() {
    "use strict";
    init_vscode_cline_parser();
    EXTENSION_ID = "saoudrizwan.claude-dev";
    cline = createClineProvider();
  }
});

// node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;
  const csi = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";
  const pattern = `${osc}|${csi}`;
  return new RegExp(pattern, onlyFirst ? void 0 : "g");
}
var init_ansi_regex = __esm({
  "node_modules/ansi-regex/index.js"() {
    "use strict";
  }
});

// node_modules/strip-ansi/index.js
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  if (!string.includes("\x1B") && !string.includes("\x9B")) {
    return string;
  }
  return string.replace(regex, "");
}
var regex;
var init_strip_ansi = __esm({
  "node_modules/strip-ansi/index.js"() {
    "use strict";
    init_ansi_regex();
    regex = ansiRegex();
  }
});

// src/bash-utils.ts
import { basename as basename4 } from "path";
function stripQuotedStrings(command) {
  return command.replace(/"[^"]*"|'[^']*'/g, (match) => " ".repeat(match.length));
}
function extractBashCommands(rawCommand) {
  if (!rawCommand || !rawCommand.trim()) return [];
  const command = stripAnsi(rawCommand);
  const stripped = stripQuotedStrings(command);
  const separatorRegex = /\s*(?:&&|;|\|)\s*/g;
  const separators = [];
  let match;
  while ((match = separatorRegex.exec(stripped)) !== null) {
    separators.push({ start: match.index, end: match.index + match[0].length });
  }
  const ranges = [];
  let cursor2 = 0;
  for (const sep2 of separators) {
    ranges.push([cursor2, sep2.start]);
    cursor2 = sep2.end;
  }
  ranges.push([cursor2, command.length]);
  const commands = [];
  for (const [start, end] of ranges) {
    const segment = command.slice(start, end).trim();
    if (!segment) continue;
    const tokens = segment.split(/\s+/);
    let i = 0;
    while (i < tokens.length && /^\w+=/.test(tokens[i])) i++;
    const base = i < tokens.length ? basename4(tokens[i]) : "";
    if (base && base !== "cd" && base !== "true" && base !== "false") {
      commands.push(base);
    }
  }
  return commands;
}
var init_bash_utils = __esm({
  "src/bash-utils.ts"() {
    "use strict";
    init_strip_ansi();
  }
});

// src/providers/codebuff.ts
import { readdir as readdir4, readFile as readFile8, stat as stat7 } from "fs/promises";
import { basename as basename5, dirname as dirname2, join as join10 } from "path";
import { homedir as homedir8 } from "os";
function getCodebuffBaseDir(override) {
  if (override && override.trim()) return override;
  const envPath = process.env["CODEBUFF_DATA_DIR"];
  if (envPath && envPath.trim()) return envPath;
  return join10(homedir8(), ".config", "manicode");
}
function pickNumber(...vals) {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return void 0;
}
function normalizeUsage(u) {
  if (!u) return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  return {
    input: pickNumber(u.inputTokens, u.input_tokens, u.promptTokens, u.prompt_tokens) ?? 0,
    output: pickNumber(u.outputTokens, u.output_tokens, u.completionTokens, u.completion_tokens) ?? 0,
    cacheRead: pickNumber(
      u.cacheReadInputTokens,
      u.cache_read_input_tokens,
      u.promptTokensDetails?.cachedTokens,
      u.prompt_tokens_details?.cached_tokens
    ) ?? 0,
    cacheWrite: pickNumber(u.cacheCreationInputTokens, u.cache_creation_input_tokens) ?? 0
  };
}
function coerceTimestamp(value) {
  if (value == null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? new Date(value).toISOString() : "";
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value;
}
function parseChatIdToIso(chatId) {
  const iso = chatId.replace(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})/, "$1:$2:$3");
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}
function extractCwd(meta) {
  const rs = meta?.runState;
  if (!rs) return null;
  return rs.sessionState?.projectContext?.cwd ?? rs.sessionState?.fileContext?.cwd ?? rs.sessionState?.cwd ?? rs.cwd ?? null;
}
function extractAgentType(meta) {
  return meta?.runState?.sessionState?.mainAgentState?.agentType ?? null;
}
function collectBlockTools(blocks, acc) {
  if (!Array.isArray(blocks)) return;
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    if (block.type === "tool" && typeof block.toolName === "string") {
      const raw = block.toolName;
      if (!IGNORED_TOOLS.has(raw)) {
        acc.tools.push(toolNameMap[raw] ?? raw);
      }
      if ((raw === "run_terminal_command" || raw === "terminal") && block.input) {
        const cmd = block.input["command"];
        if (typeof cmd === "string") {
          acc.bash.push(...extractBashCommands(cmd));
        }
      }
    }
    if (block.type === "agent" && Array.isArray(block.blocks)) {
      collectBlockTools(block.blocks, acc);
    }
  }
}
function resolveModel(meta, stashedModel) {
  const direct = meta?.model ?? meta?.modelId ?? meta?.codebuff?.model;
  if (direct) return direct;
  if (stashedModel) return stashedModel;
  const agentType = extractAgentType(meta);
  if (agentType) return `codebuff-${agentType}`;
  return "codebuff";
}
function usageFromHistory(meta) {
  const hist = meta?.runState?.sessionState?.mainAgentState?.messageHistory;
  if (!Array.isArray(hist)) return { model: null, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  for (let i = hist.length - 1; i >= 0; i--) {
    const entry = hist[i];
    if (!entry || entry.role !== "assistant" || !entry.providerOptions) continue;
    const u = normalizeUsage(entry.providerOptions.usage ?? entry.providerOptions.codebuff?.usage);
    if (u.input > 0 || u.output > 0 || u.cacheRead > 0 || u.cacheWrite > 0) {
      return { model: entry.providerOptions.codebuff?.model ?? null, ...u };
    }
  }
  return { model: null, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
}
async function readJson(filePath) {
  try {
    const raw = await readFile8(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function discoverChannel(root) {
  const sources = [];
  const projectsDir = join10(root, "projects");
  let projectNames;
  try {
    projectNames = await readdir4(projectsDir);
  } catch {
    return sources;
  }
  for (const projectName of projectNames) {
    const chatsDir = join10(projectsDir, projectName, "chats");
    let chatIds;
    try {
      chatIds = await readdir4(chatsDir);
    } catch {
      continue;
    }
    for (const chatId of chatIds) {
      const chatDir = join10(chatsDir, chatId);
      const dirStat = await stat7(chatDir).catch(() => null);
      if (!dirStat?.isDirectory()) continue;
      const messagesPath = join10(chatDir, "chat-messages.json");
      const messagesStat = await stat7(messagesPath).catch(() => null);
      if (!messagesStat?.isFile()) continue;
      const runState = await readJson(
        join10(chatDir, "run-state.json")
      );
      const cwd = extractCwd({ runState: runState ?? void 0 });
      const project = cwd ? basename5(cwd) : projectName;
      sources.push({ path: chatDir, project, provider: "codebuff" });
    }
  }
  return sources;
}
async function discoverSessionsInBase(baseDir) {
  const results = [];
  if (process.env["CODEBUFF_DATA_DIR"] || baseDir !== join10(homedir8(), ".config", "manicode")) {
    const rootStat = await stat7(baseDir).catch(() => null);
    if (!rootStat?.isDirectory()) return results;
    results.push(...await discoverChannel(baseDir));
    return results;
  }
  const configDir = join10(homedir8(), ".config");
  for (const channel of CHANNELS) {
    const root = join10(configDir, channel);
    const rootStat = await stat7(root).catch(() => null);
    if (!rootStat?.isDirectory()) continue;
    results.push(...await discoverChannel(root));
  }
  return results;
}
function extractChannelFromChatDir(chatDir) {
  const chatsDir = dirname2(chatDir);
  if (basename5(chatsDir) !== "chats") return null;
  const projectDir = dirname2(chatsDir);
  const projectsDir = dirname2(projectDir);
  if (basename5(projectsDir) !== "projects") return null;
  const channel = basename5(dirname2(projectsDir));
  return channel ? channel : null;
}
function createParser(source, seenKeys) {
  return {
    async *parse() {
      const chatDir = source.path;
      const chatId = basename5(chatDir);
      const channel = extractChannelFromChatDir(chatDir);
      const sessionId = channel ? `${channel}/${chatId}` : chatId;
      const fallbackTs = parseChatIdToIso(chatId);
      const messages = await readJson(
        join10(chatDir, "chat-messages.json")
      );
      if (!Array.isArray(messages)) return;
      let pendingUserMessage = "";
      for (const [idx, msg] of messages.entries()) {
        if (!msg || typeof msg !== "object") continue;
        const variant = msg.variant ?? msg.role;
        if (variant === "user") {
          if (typeof msg.content === "string" && msg.content.length > 0) {
            pendingUserMessage = msg.content;
          }
          continue;
        }
        if (variant !== "ai" && variant !== "agent" && variant !== "assistant") continue;
        const credits = typeof msg.credits === "number" && Number.isFinite(msg.credits) ? msg.credits : 0;
        const directUsage = normalizeUsage(msg.metadata?.usage ?? msg.metadata?.codebuff?.usage);
        const stashedUsage = usageFromHistory(msg.metadata);
        const hasDirect = directUsage.input > 0 || directUsage.output > 0 || directUsage.cacheRead > 0 || directUsage.cacheWrite > 0;
        const usage = hasDirect ? directUsage : stashedUsage;
        const stashedModel = stashedUsage.model;
        if (credits === 0 && usage.input === 0 && usage.output === 0 && usage.cacheRead === 0 && usage.cacheWrite === 0) {
          continue;
        }
        const model = resolveModel(msg.metadata, stashedModel);
        const timestamp = coerceTimestamp(msg.timestamp ?? msg.metadata?.timestamp) || fallbackTs;
        const dedupId = msg.id ?? String(idx);
        const dedupKey = `codebuff:${chatDir}:${dedupId}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);
        const acc = { tools: [], bash: [] };
        collectBlockTools(msg.blocks, acc);
        let costUSD = calculateCost(model, usage.input, usage.output, usage.cacheWrite, usage.cacheRead, 0);
        if (costUSD === 0 && credits > 0) {
          costUSD = credits * USD_PER_CREDIT;
        }
        yield {
          provider: "codebuff",
          model,
          inputTokens: usage.input,
          outputTokens: usage.output,
          cacheCreationInputTokens: usage.cacheWrite,
          cacheReadInputTokens: usage.cacheRead,
          cachedInputTokens: usage.cacheRead,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools: acc.tools,
          bashCommands: acc.bash,
          timestamp,
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: pendingUserMessage,
          sessionId
        };
        pendingUserMessage = "";
      }
    }
  };
}
function createCodebuffProvider(baseDir) {
  const dir = getCodebuffBaseDir(baseDir);
  return {
    name: "codebuff",
    displayName: "Codebuff",
    modelDisplayName(model) {
      return modelDisplayNames[model] ?? model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSessionsInBase(dir);
    },
    createSessionParser(source, seenKeys) {
      return createParser(source, seenKeys);
    }
  };
}
var USD_PER_CREDIT, CHANNELS, modelDisplayNames, toolNameMap, IGNORED_TOOLS, codebuff;
var init_codebuff = __esm({
  "src/providers/codebuff.ts"() {
    "use strict";
    init_models();
    init_bash_utils();
    USD_PER_CREDIT = 0.01;
    CHANNELS = ["manicode", "manicode-dev", "manicode-staging"];
    modelDisplayNames = {
      codebuff: "Codebuff",
      "codebuff-base": "Codebuff Base",
      "codebuff-base2": "Codebuff Base 2",
      "codebuff-lite": "Codebuff Lite",
      "codebuff-max": "Codebuff Max"
    };
    toolNameMap = {
      read_files: "Read",
      read_file: "Read",
      code_search: "Grep",
      glob: "Glob",
      find_files: "Glob",
      str_replace: "Edit",
      edit_file: "Edit",
      write_file: "Write",
      run_terminal_command: "Bash",
      terminal: "Bash",
      spawn_agents: "Agent",
      spawn_agent: "Agent",
      write_todos: "TodoWrite",
      create_plan: "TodoWrite",
      browser_logs: "WebFetch",
      web_search: "WebSearch",
      fetch_url: "WebFetch"
    };
    IGNORED_TOOLS = /* @__PURE__ */ new Set(["suggest_followups", "end_turn"]);
    codebuff = createCodebuffProvider();
  }
});

// src/codex-cache.ts
import { readFile as readFile9, mkdir as mkdir6, stat as stat8, open as open2, rename as rename3, unlink } from "fs/promises";
import { existsSync } from "fs";
import { randomBytes as randomBytes2 } from "crypto";
import { join as join11 } from "path";
import { homedir as homedir9 } from "os";
function getCacheDir3() {
  return process.env["CODEBURN_CACHE_DIR"] ?? join11(homedir9(), ".cache", "codeburn");
}
function getCachePath2() {
  return join11(getCacheDir3(), CACHE_FILE);
}
async function loadCache() {
  if (memCache) return memCache;
  try {
    const raw = await readFile9(getCachePath2(), "utf-8");
    const cache = JSON.parse(raw);
    if (cache.version === CODEX_CACHE_VERSION && cache.files && typeof cache.files === "object") {
      memCache = cache;
      return cache;
    }
  } catch {
  }
  memCache = { version: CODEX_CACHE_VERSION, files: {} };
  return memCache;
}
function getEntry(cache, filePath, fp) {
  if (!Object.hasOwn(cache.files, filePath)) return null;
  const entry = cache.files[filePath];
  if (entry && entry.mtimeMs === fp.mtimeMs && entry.sizeBytes === fp.sizeBytes) {
    return entry;
  }
  return null;
}
async function readCachedCodexResults(filePath) {
  try {
    const s = await stat8(filePath);
    const cache = await loadCache();
    const entry = getEntry(cache, filePath, { mtimeMs: s.mtimeMs, sizeBytes: s.size });
    return entry?.calls ?? null;
  } catch {
  }
  return null;
}
async function getCachedCodexProject(filePath) {
  try {
    const s = await stat8(filePath);
    const cache = await loadCache();
    const entry = getEntry(cache, filePath, { mtimeMs: s.mtimeMs, sizeBytes: s.size });
    return entry?.project ?? null;
  } catch {
  }
  return null;
}
async function fingerprintFile(filePath) {
  try {
    const s = await stat8(filePath);
    return { mtimeMs: s.mtimeMs, sizeBytes: s.size };
  } catch {
    return null;
  }
}
async function writeCachedCodexResults(filePath, project, calls, fingerprint) {
  try {
    const cache = await loadCache();
    cache.files[filePath] = {
      mtimeMs: fingerprint.mtimeMs,
      sizeBytes: fingerprint.sizeBytes,
      project,
      calls
    };
  } catch {
  }
}
async function flushCodexCache() {
  if (!memCache) return;
  try {
    const paths = Object.keys(memCache.files);
    for (const p of paths) {
      try {
        await stat8(p);
      } catch {
        delete memCache.files[p];
      }
    }
    const dir = getCacheDir3();
    if (!existsSync(dir)) await mkdir6(dir, { recursive: true });
    const finalPath = getCachePath2();
    const tempPath = `${finalPath}.${randomBytes2(8).toString("hex")}.tmp`;
    const payload = JSON.stringify(memCache);
    const handle = await open2(tempPath, "w", 384);
    try {
      await handle.writeFile(payload, { encoding: "utf-8" });
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await rename3(tempPath, finalPath);
    } catch (err) {
      try {
        await unlink(tempPath);
      } catch {
      }
      throw err;
    }
  } catch {
  }
}
var CODEX_CACHE_VERSION, CACHE_FILE, memCache;
var init_codex_cache = __esm({
  "src/codex-cache.ts"() {
    "use strict";
    CODEX_CACHE_VERSION = 3;
    CACHE_FILE = "codex-results.json";
    memCache = null;
  }
});

// src/providers/codex.ts
import { readdir as readdir5, stat as stat9 } from "fs/promises";
import { createReadStream as createReadStream2 } from "fs";
import { createInterface } from "readline";
import { basename as basename6, join as join12 } from "path";
import { homedir as homedir10 } from "os";
function getCodexDir(override) {
  return override ?? process.env["CODEX_HOME"] ?? join12(homedir10(), ".codex");
}
function sanitizeProject(cwd) {
  return cwd.replace(/^\//, "").replace(/\//g, "-");
}
async function readFirstLine(filePath) {
  const stream = createReadStream2(filePath, {
    encoding: "utf-8",
    start: 0,
    end: FIRST_LINE_READ_CAP - 1
  });
  stream.on("error", () => {
  });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let firstLine;
  try {
    for await (const line of rl) {
      firstLine = line;
      break;
    }
  } catch {
    return null;
  } finally {
    rl.close();
    stream.destroy();
  }
  if (!firstLine || !firstLine.trim()) return null;
  try {
    return JSON.parse(firstLine);
  } catch {
    return null;
  }
}
async function isValidCodexSession(filePath) {
  const entry = await readFirstLine(filePath);
  if (!entry) return { valid: false };
  const valid = entry.type === "session_meta" && typeof entry.payload?.originator === "string" && entry.payload.originator.toLowerCase().startsWith("codex");
  return { valid, meta: valid ? entry : void 0 };
}
function getRawJsonStringField(head, field) {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`);
  const match = re.exec(head);
  if (!match) return void 0;
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}
function payloadHead(head) {
  const idx = head.indexOf('"payload"');
  return idx === -1 ? head : head.slice(idx);
}
function countJsonStringBytes(source, valueStart) {
  let count = 0;
  for (let i = valueStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === 92) {
      i++;
      count++;
      continue;
    }
    if (ch === 34) return count;
    count++;
  }
  return count;
}
function extractFirstJsonText(source, cap = LARGE_TEXT_CAP) {
  const key = Buffer.from('"text"');
  const idx = source.indexOf(key);
  if (idx === -1) return "";
  const colon = source.indexOf(58, idx + key.length);
  if (colon === -1) return "";
  const qStart = source.indexOf(34, colon + 1);
  if (qStart === -1) return "";
  const chunks = [];
  for (let i = qStart + 1; i < source.length && chunks.length < cap; i++) {
    const ch = source[i];
    if (ch === 92) {
      const next = source[++i];
      if (next === 110) chunks.push(10);
      else if (next === 114) chunks.push(13);
      else if (next === 116) chunks.push(9);
      else if (next !== void 0) chunks.push(next);
      continue;
    }
    if (ch === 34) break;
    chunks.push(ch);
  }
  return Buffer.from(chunks).toString("utf-8");
}
function countFirstJsonText(source) {
  const key = Buffer.from('"text"');
  const idx = source.indexOf(key);
  if (idx === -1) return 0;
  const colon = source.indexOf(58, idx + key.length);
  if (colon === -1) return 0;
  const qStart = source.indexOf(34, colon + 1);
  if (qStart === -1) return 0;
  return countJsonStringBytes(source, qStart + 1);
}
function parseCodexLine(line) {
  if (typeof line === "string") {
    const trimmed = line.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (line.length === 0) return null;
  const head = line.subarray(0, RAW_HEAD_BYTES).toString("utf-8");
  const type = getRawJsonStringField(head, "type");
  if (!type) return null;
  const pHead = payloadHead(head);
  const payloadType = getRawJsonStringField(pHead, "type");
  const role = getRawJsonStringField(pHead, "role");
  const entry = {
    type,
    timestamp: getRawJsonStringField(head, "timestamp"),
    payload: {
      type: payloadType,
      role,
      cwd: getRawJsonStringField(pHead, "cwd"),
      model_provider: getRawJsonStringField(pHead, "model_provider"),
      originator: getRawJsonStringField(pHead, "originator"),
      session_id: getRawJsonStringField(pHead, "session_id"),
      forked_from_id: getRawJsonStringField(pHead, "forked_from_id"),
      model: getRawJsonStringField(pHead, "model"),
      name: getRawJsonStringField(pHead, "name")
    }
  };
  if (type === "response_item" && payloadType === "message" && role === "user") {
    entry.payload.content = [{ type: "input_text", text: extractFirstJsonText(line) }];
  } else if (type === "response_item" && payloadType === "message" && role === "assistant") {
    entry.payload.content = [{ type: "output_text", text: "x".repeat(Math.min(countFirstJsonText(line), LARGE_TEXT_CAP)) }];
  }
  return entry;
}
async function discoverSessionsInDir(codexDir) {
  const sessionsDir = join12(codexDir, "sessions");
  const sources = [];
  let years;
  try {
    years = await readdir5(sessionsDir);
  } catch {
    return sources;
  }
  for (const year of years) {
    if (!/^\d{4}$/.test(year)) continue;
    const yearDir = join12(sessionsDir, year);
    const months = await readdir5(yearDir).catch(() => []);
    for (const month of months) {
      if (!/^\d{2}$/.test(month)) continue;
      const monthDir = join12(yearDir, month);
      const days = await readdir5(monthDir).catch(() => []);
      for (const day of days) {
        if (!/^\d{2}$/.test(day)) continue;
        const dayDir = join12(monthDir, day);
        const files = await readdir5(dayDir).catch(() => []);
        for (const file of files) {
          if (!file.startsWith("rollout-") || !file.endsWith(".jsonl")) continue;
          const filePath = join12(dayDir, file);
          const s = await stat9(filePath).catch(() => null);
          if (!s?.isFile()) continue;
          const cachedProject = await getCachedCodexProject(filePath);
          if (cachedProject) {
            sources.push({ path: filePath, project: cachedProject, provider: "codex" });
            continue;
          }
          const { valid, meta } = await isValidCodexSession(filePath);
          if (!valid || !meta) continue;
          const cwd = meta.payload?.cwd ?? "unknown";
          sources.push({ path: filePath, project: sanitizeProject(cwd), provider: "codex" });
        }
      }
    }
  }
  return sources;
}
function resolveModel2(info, sessionModel) {
  return info?.model ?? info?.info?.model ?? info?.info?.model_name ?? sessionModel ?? "gpt-5";
}
function createParser2(source, seenKeys) {
  return {
    async *parse() {
      const cached = await readCachedCodexResults(source.path);
      if (cached) {
        for (const call of cached) {
          if (seenKeys.has(call.deduplicationKey)) continue;
          seenKeys.add(call.deduplicationKey);
          yield call;
        }
        return;
      }
      const fp = await fingerprintFile(source.path);
      if (!fp) return;
      let sessionModel;
      let sessionId = "";
      let forkedFromId = "";
      let forkCutoff = "";
      let prevCumulativeTotal = null;
      let prevInput = 0;
      let prevCached = 0;
      let prevOutput = 0;
      let prevReasoning = 0;
      let pendingTools = [];
      let pendingToolSequence = [];
      let pendingUserMessage = "";
      let pendingOutputChars = 0;
      let estCounter = 0;
      let turnCounter = 0;
      let currentTurnId = `${sessionId}:t0`;
      let sawAnyLine = false;
      const results = [];
      for await (const rawLine of readSessionLines(source.path, void 0, { largeLineAsBuffer: true })) {
        sawAnyLine = true;
        const entry = parseCodexLine(rawLine);
        if (!entry) continue;
        if (entry.type === "session_meta") {
          sessionId = entry.payload?.session_id ?? basename6(source.path, ".jsonl");
          forkedFromId = entry.payload?.forked_from_id ?? "";
          if (forkedFromId && entry.timestamp) {
            forkCutoff = new Date(new Date(entry.timestamp).getTime() + 5e3).toISOString();
          }
          sessionModel = entry.payload?.model ?? sessionModel;
          continue;
        }
        if (entry.type === "turn_context" && entry.payload?.model) {
          sessionModel = entry.payload.model;
          continue;
        }
        if (entry.type === "response_item" && entry.payload?.type === "function_call") {
          const rawName = entry.payload.name ?? "";
          const mapped = toolNameMap2[rawName] ?? rawName;
          pendingTools.push(mapped);
          const call = { tool: mapped };
          const rawArgs = entry.payload["arguments"];
          const args = typeof rawArgs === "string" ? (() => {
            try {
              return JSON.parse(rawArgs);
            } catch {
              return null;
            }
          })() : typeof rawArgs === "object" && rawArgs ? rawArgs : null;
          if (args) {
            const fp2 = args["file_path"] ?? args["path"];
            if (typeof fp2 === "string") call.file = fp2;
            const cmd = args["command"] ?? args["cmd"];
            if (typeof cmd === "string") call.command = cmd;
          }
          pendingToolSequence.push([call]);
          continue;
        }
        if (entry.type === "event_msg" && entry.payload?.type === "patch_apply_end") {
          pendingTools.push("Edit");
          const p = entry.payload;
          const changes = p["changes"];
          const filePaths = typeof changes === "object" && changes ? Object.keys(changes) : [];
          if (filePaths.length > 0) {
            for (const fp2 of filePaths) {
              pendingToolSequence.push([{ tool: "Edit", file: fp2 }]);
            }
          } else {
            pendingToolSequence.push([{ tool: "Edit" }]);
          }
          continue;
        }
        if (entry.type === "response_item" && entry.payload?.type === "message" && entry.payload?.role === "user") {
          const texts = (entry.payload.content ?? []).filter((c) => c.type === "input_text").map((c) => c.text ?? "").filter(Boolean);
          if (texts.length > 0) {
            pendingUserMessage = texts.join(" ").slice(0, 500);
            currentTurnId = `${sessionId}:t${++turnCounter}`;
          }
          continue;
        }
        if (entry.type === "response_item" && entry.payload?.type === "message" && entry.payload?.role === "assistant") {
          const texts = (entry.payload.content ?? []).filter((c) => c.type === "output_text" || c.type === "text").map((c) => c.text ?? "");
          pendingOutputChars += texts.join("").length;
          continue;
        }
        if (entry.type === "event_msg" && entry.payload?.type === "token_count") {
          if (forkCutoff && entry.timestamp && entry.timestamp < forkCutoff) continue;
          const info = entry.payload.info;
          if (!info) {
            if (pendingOutputChars === 0 && pendingUserMessage.length === 0) continue;
            const estInput = Math.ceil(pendingUserMessage.length / CHARS_PER_TOKEN);
            const estOutput = Math.ceil(pendingOutputChars / CHARS_PER_TOKEN);
            if (estInput === 0 && estOutput === 0) continue;
            const model2 = sessionModel ?? "gpt-5";
            const timestamp2 = entry.timestamp ?? "";
            const dedupKey2 = `codex:${sessionId}:${timestamp2}:est${estCounter++}`;
            if (seenKeys.has(dedupKey2)) {
              pendingTools = [];
              pendingToolSequence = [];
              pendingUserMessage = "";
              pendingOutputChars = 0;
              continue;
            }
            seenKeys.add(dedupKey2);
            const costUSD2 = calculateCost(model2, estInput, estOutput, 0, 0, 0);
            results.push({
              provider: "codex",
              model: model2,
              inputTokens: estInput,
              outputTokens: estOutput,
              cacheCreationInputTokens: 0,
              cacheReadInputTokens: 0,
              cachedInputTokens: 0,
              reasoningTokens: 0,
              webSearchRequests: 0,
              costUSD: costUSD2,
              costIsEstimated: true,
              tools: pendingTools,
              bashCommands: [],
              timestamp: timestamp2,
              speed: "standard",
              deduplicationKey: dedupKey2,
              turnId: currentTurnId,
              toolSequence: pendingToolSequence.length > 0 ? pendingToolSequence : void 0,
              userMessage: pendingUserMessage,
              sessionId
            });
            pendingTools = [];
            pendingToolSequence = [];
            pendingUserMessage = "";
            pendingOutputChars = 0;
            continue;
          }
          const cumulativeTotal = info.total_token_usage?.total_tokens ?? 0;
          if (prevCumulativeTotal !== null && cumulativeTotal === prevCumulativeTotal) continue;
          prevCumulativeTotal = cumulativeTotal;
          const last = info.last_token_usage;
          let inputTokens = 0;
          let cachedInputTokens = 0;
          let outputTokens = 0;
          let reasoningTokens = 0;
          if (last) {
            inputTokens = last.input_tokens ?? 0;
            cachedInputTokens = last.cached_input_tokens ?? 0;
            outputTokens = last.output_tokens ?? 0;
            reasoningTokens = last.reasoning_output_tokens ?? 0;
          } else if (cumulativeTotal > 0) {
            const total2 = info.total_token_usage;
            if (!total2) continue;
            inputTokens = (total2.input_tokens ?? 0) - prevInput;
            cachedInputTokens = (total2.cached_input_tokens ?? 0) - prevCached;
            outputTokens = (total2.output_tokens ?? 0) - prevOutput;
            reasoningTokens = (total2.reasoning_output_tokens ?? 0) - prevReasoning;
          }
          const total = info.total_token_usage;
          if (total) {
            prevInput = total.input_tokens ?? 0;
            prevCached = total.cached_input_tokens ?? 0;
            prevOutput = total.output_tokens ?? 0;
            prevReasoning = total.reasoning_output_tokens ?? 0;
          }
          const totalTokens = inputTokens + cachedInputTokens + outputTokens + reasoningTokens;
          if (totalTokens === 0) continue;
          const uncachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);
          const model = resolveModel2(entry.payload, sessionModel);
          const timestamp = entry.timestamp ?? "";
          const dedupKey = `codex:${forkedFromId || sessionId}:${cumulativeTotal}`;
          if (seenKeys.has(dedupKey)) continue;
          seenKeys.add(dedupKey);
          const costUSD = calculateCost(
            model,
            uncachedInputTokens,
            outputTokens + reasoningTokens,
            0,
            cachedInputTokens,
            0
          );
          results.push({
            provider: "codex",
            model,
            inputTokens: uncachedInputTokens,
            outputTokens,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: cachedInputTokens,
            cachedInputTokens,
            reasoningTokens,
            webSearchRequests: 0,
            costUSD,
            tools: pendingTools,
            bashCommands: [],
            timestamp,
            speed: "standard",
            deduplicationKey: dedupKey,
            turnId: currentTurnId,
            toolSequence: pendingToolSequence.length > 0 ? pendingToolSequence : void 0,
            userMessage: pendingUserMessage,
            sessionId
          });
          pendingTools = [];
          pendingToolSequence = [];
          pendingUserMessage = "";
          pendingOutputChars = 0;
        }
      }
      if (!sawAnyLine) return;
      await writeCachedCodexResults(source.path, source.project, results, fp);
      for (const call of results) {
        yield call;
      }
    }
  };
}
function createCodexProvider(codexDir) {
  const dir = getCodexDir(codexDir);
  return {
    name: "codex",
    displayName: "Codex",
    modelDisplayName(model) {
      for (const [key, name] of modelDisplayEntries) {
        if (model === key || model.startsWith(key + "-")) return name;
      }
      return model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap2[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSessionsInDir(dir);
    },
    createSessionParser(source, seenKeys) {
      return createParser2(source, seenKeys);
    }
  };
}
var modelDisplayNames2, modelDisplayEntries, toolNameMap2, CHARS_PER_TOKEN, RAW_HEAD_BYTES, LARGE_TEXT_CAP, FIRST_LINE_READ_CAP, codex;
var init_codex = __esm({
  "src/providers/codex.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_codex_cache();
    modelDisplayNames2 = {
      "codex-auto-review": "Codex Auto Review",
      "gpt-5.5": "GPT-5.5",
      "gpt-5.4-mini": "GPT-5.4 Mini",
      "gpt-5.4": "GPT-5.4",
      "gpt-5.3-codex": "GPT-5.3 Codex",
      "gpt-5.2-low": "GPT-5.2 Low",
      "gpt-5.2": "GPT-5.2",
      "gpt-5": "GPT-5",
      "gpt-4o-mini": "GPT-4o Mini",
      "gpt-4o": "GPT-4o"
    };
    modelDisplayEntries = Object.entries(modelDisplayNames2).sort((a, b) => b[0].length - a[0].length);
    toolNameMap2 = {
      exec_command: "Bash",
      read_file: "Read",
      write_file: "Edit",
      apply_diff: "Edit",
      apply_patch: "Edit",
      spawn_agent: "Agent",
      close_agent: "Agent",
      wait_agent: "Agent",
      read_dir: "Glob"
    };
    CHARS_PER_TOKEN = 4;
    RAW_HEAD_BYTES = 64 * 1024;
    LARGE_TEXT_CAP = 2e3;
    FIRST_LINE_READ_CAP = 1024 * 1024;
    codex = createCodexProvider();
  }
});

// src/providers/copilot.ts
import { existsSync as existsSync2 } from "fs";
import { readdir as readdir6, readFile as readFile10, stat as stat10 } from "fs/promises";
import { basename as basename7, dirname as dirname3, join as join13, posix as posix2, win32 as win322 } from "path";
import { homedir as homedir11 } from "os";
function normalizeMcpSegment(segment) {
  return segment.replace(/[^a-zA-Z0-9_]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}
function normalizeCopilotMcpTool(rawTool) {
  const serverSeparator = rawTool.lastIndexOf("-");
  if (serverSeparator <= 0 || serverSeparator >= rawTool.length - 1) return null;
  const server = normalizeMcpSegment(rawTool.slice(0, serverSeparator));
  const tool = normalizeMcpSegment(rawTool.slice(serverSeparator + 1));
  if (!server || !tool) return null;
  return `mcp__${server}__${tool}`;
}
function normalizeToolName(rawTool) {
  if (typeof rawTool !== "string") return "";
  if (!rawTool) return "";
  if (rawTool.startsWith("mcp__")) return rawTool;
  const builtIn = toolNameMap3[rawTool];
  if (builtIn) return builtIn;
  return normalizeCopilotMcpTool(rawTool) ?? rawTool;
}
function parseLegacyEvents(content, sessionId, seenKeys) {
  const results = [];
  const lines = content.split("\n").filter((l) => l.trim());
  let currentModel = "";
  let pendingUserMessage = "";
  for (const line of lines) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    const data = event.data;
    if (typeof data.model === "string" && data.model) {
      currentModel = data.model;
    }
    if (event.type === "session.model_change") {
      currentModel = data.newModel ?? currentModel;
      continue;
    }
    if (event.type === "user.message") {
      const userEvent = event;
      pendingUserMessage = userEvent.data.content ?? "";
      continue;
    }
    if (event.type === "assistant.message") {
      const { messageId, outputTokens, toolRequests: rawToolRequests } = event.data;
      if (outputTokens === 0) continue;
      if (!currentModel) continue;
      const dedupKey = `copilot:${sessionId}:${messageId}`;
      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);
      const toolRequests = Array.isArray(rawToolRequests) ? rawToolRequests : [];
      const tools = toolRequests.map((t) => normalizeToolName(t?.name)).filter(Boolean);
      const costUSD = calculateCost(currentModel, 0, outputTokens, 0, 0, 0);
      results.push({
        provider: "copilot",
        model: currentModel,
        inputTokens: 0,
        outputTokens,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
        cachedInputTokens: 0,
        reasoningTokens: 0,
        webSearchRequests: 0,
        costUSD,
        tools,
        bashCommands: [],
        timestamp: event.timestamp ?? "",
        speed: "standard",
        deduplicationKey: dedupKey,
        userMessage: pendingUserMessage,
        sessionId
      });
      pendingUserMessage = "";
    }
  }
  return results;
}
function inferModelFromToolCallIds(events) {
  const modelCounts = /* @__PURE__ */ new Map();
  for (const e of events) {
    const data = e.data;
    if (typeof data.model === "string" && data.model) {
      modelCounts.set(data.model, (modelCounts.get(data.model) ?? 0) + 100);
    }
    if (e.type !== "assistant.message") continue;
    const msg = e;
    for (const t of msg.data.toolRequests ?? []) {
      const toolCallId = t.toolCallId ?? "";
      for (const hint of transcriptToolCallModelHints) {
        if (!toolCallId.startsWith(hint.prefix)) continue;
        modelCounts.set(hint.model, (modelCounts.get(hint.model) ?? 0) + 1);
        break;
      }
    }
  }
  if (modelCounts.size > 0) {
    return [...modelCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  return "copilot-auto";
}
function parseTranscriptEvents(content, sessionId, seenKeys) {
  const results = [];
  const lines = content.split("\n").filter((l) => l.trim());
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch {
      continue;
    }
  }
  const model = inferModelFromToolCallIds(events);
  let pendingUserMessage = "";
  for (const event of events) {
    if (event.type === "user.message") {
      const data = event.data;
      pendingUserMessage = (data.content ?? "").slice(0, 500);
      continue;
    }
    if (event.type === "assistant.message") {
      const data = event.data;
      const contentText = data.content ?? "";
      const reasoningText = data.reasoningText ?? "";
      if (contentText.length === 0 && reasoningText.length === 0 && (data.toolRequests ?? []).length === 0) continue;
      const dedupKey = `copilot:${sessionId}:${data.messageId}`;
      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);
      let outputTokens = data.outputTokens ?? 0;
      let reasoningTokens = 0;
      if (outputTokens === 0) {
        outputTokens = Math.ceil(contentText.length / CHARS_PER_TOKEN2);
        reasoningTokens = Math.ceil(reasoningText.length / CHARS_PER_TOKEN2);
      }
      const inputTokens = Math.ceil(pendingUserMessage.length / CHARS_PER_TOKEN2);
      const legacyToolRequests = Array.isArray(data.toolRequests) ? data.toolRequests : [];
      const tools = legacyToolRequests.map((t) => normalizeToolName(t?.name)).filter(Boolean);
      const costUSD = calculateCost(model, inputTokens, outputTokens + reasoningTokens, 0, 0, 0);
      results.push({
        provider: "copilot",
        model,
        inputTokens,
        outputTokens,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
        cachedInputTokens: 0,
        reasoningTokens,
        webSearchRequests: 0,
        costUSD,
        tools,
        bashCommands: [],
        timestamp: event.timestamp ?? "",
        speed: "standard",
        deduplicationKey: dedupKey,
        userMessage: pendingUserMessage,
        sessionId
      });
      pendingUserMessage = "";
    }
  }
  return results;
}
function isTranscriptFormat(content) {
  const firstLine = content.split("\n")[0] ?? "";
  try {
    const event = JSON.parse(firstLine);
    return event.type === "session.start" && event.data?.producer === "copilot-agent";
  } catch {
    return false;
  }
}
function createParser3(source, seenKeys) {
  return {
    async *parse() {
      const content = await readSessionFile(source.path);
      if (content === null) return;
      const sessionId = basename7(source.path, ".jsonl").length === 36 ? basename7(source.path, ".jsonl") : basename7(dirname3(source.path));
      const calls = isTranscriptFormat(content) ? parseTranscriptEvents(content, sessionId, seenKeys) : parseLegacyEvents(content, sessionId, seenKeys);
      for (const call of calls) {
        yield call;
      }
    }
  };
}
function getCopilotSessionStateDir(override) {
  return override ?? join13(homedir11(), ".copilot", "session-state");
}
function getVSCodeWorkspaceStorageDirs(homeDir = homedir11(), platform4 = process.platform) {
  const pathJoin = platform4 === "win32" ? win322.join : posix2.join;
  if (platform4 === "darwin") {
    return [
      pathJoin(homeDir, "Library", "Application Support", "Code", "User", "workspaceStorage"),
      pathJoin(homeDir, "Library", "Application Support", "Code - Insiders", "User", "workspaceStorage"),
      pathJoin(homeDir, "Library", "Application Support", "VSCodium", "User", "workspaceStorage")
    ];
  }
  if (platform4 === "win32") {
    return [
      pathJoin(homeDir, "AppData", "Roaming", "Code", "User", "workspaceStorage"),
      pathJoin(homeDir, "AppData", "Roaming", "Code - Insiders", "User", "workspaceStorage"),
      pathJoin(homeDir, "AppData", "Roaming", "VSCodium", "User", "workspaceStorage")
    ];
  }
  return [
    pathJoin(homeDir, ".config", "Code", "User", "workspaceStorage"),
    pathJoin(homeDir, ".config", "Code - Insiders", "User", "workspaceStorage"),
    pathJoin(homeDir, ".config", "VSCodium", "User", "workspaceStorage"),
    pathJoin(homeDir, ".vscode-server", "data", "User", "workspaceStorage")
  ];
}
function parseCwd(yaml) {
  const match = yaml.match(/^cwd:\s*(.+)$/m);
  if (!match?.[1]) return null;
  const raw = match[1].replace(/\s*#.*$/, "").replace(/^['"]|['"]$/g, "").trim();
  return raw || null;
}
async function readWorkspaceProject(workspaceDir) {
  try {
    const raw = await readFile10(join13(workspaceDir, "workspace.json"), "utf-8");
    const data = JSON.parse(raw);
    if (data.folder) {
      const url = data.folder.replace(/^file:\/\//, "");
      return basename7(decodeURIComponent(url));
    }
  } catch {
  }
  return basename7(workspaceDir);
}
async function discoverLegacySessions(sessionStateDir) {
  const sources = [];
  let sessionDirs;
  try {
    sessionDirs = await readdir6(sessionStateDir);
  } catch {
    return sources;
  }
  for (const sessionId of sessionDirs) {
    const eventsPath = join13(sessionStateDir, sessionId, "events.jsonl");
    const s = await stat10(eventsPath).catch(() => null);
    if (!s?.isFile()) continue;
    let project = sessionId;
    const yaml = await readSessionFile(join13(sessionStateDir, sessionId, "workspace.yaml"));
    if (yaml !== null) {
      const cwd = parseCwd(yaml);
      if (cwd) project = basename7(cwd);
    }
    sources.push({ path: eventsPath, project, provider: "copilot" });
  }
  return sources;
}
async function discoverVSCodeTranscripts(workspaceStorageDir) {
  const sources = [];
  let workspaceDirs;
  try {
    workspaceDirs = await readdir6(workspaceStorageDir);
  } catch {
    return sources;
  }
  for (const wsDir of workspaceDirs) {
    const transcriptsDir = join13(workspaceStorageDir, wsDir, "GitHub.copilot-chat", "transcripts");
    if (!existsSync2(transcriptsDir)) continue;
    const project = await readWorkspaceProject(join13(workspaceStorageDir, wsDir));
    let files;
    try {
      files = await readdir6(transcriptsDir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const filePath = join13(transcriptsDir, file);
      const s = await stat10(filePath).catch(() => null);
      if (!s?.isFile()) continue;
      sources.push({ path: filePath, project, provider: "copilot" });
    }
  }
  return sources;
}
function createCopilotProvider(sessionStateDir, workspaceStorageDirOverride) {
  const legacyDir = getCopilotSessionStateDir(sessionStateDir);
  const vscodeDirs = workspaceStorageDirOverride != null ? [workspaceStorageDirOverride] : getVSCodeWorkspaceStorageDirs();
  return {
    name: "copilot",
    displayName: "Copilot",
    modelDisplayName(model) {
      if (model === "copilot-auto") return "Copilot (auto)";
      if (model === COPILOT_OPENAI_AUTO) return "Copilot (OpenAI auto)";
      if (model === COPILOT_ANTHROPIC_AUTO) return "Copilot (Anthropic auto)";
      for (const [key, name] of modelDisplayEntries2) {
        if (model === key || model.startsWith(key + "-")) return name;
      }
      return model;
    },
    toolDisplayName(rawTool) {
      return normalizeToolName(rawTool);
    },
    async discoverSessions() {
      const [legacy, ...vscodeResults] = await Promise.all([
        discoverLegacySessions(legacyDir),
        ...vscodeDirs.map(discoverVSCodeTranscripts)
      ]);
      return [...legacy, ...vscodeResults.flat()];
    },
    createSessionParser(source, seenKeys) {
      return createParser3(source, seenKeys);
    }
  };
}
var modelDisplayNames3, toolNameMap3, CHARS_PER_TOKEN2, COPILOT_OPENAI_AUTO, COPILOT_ANTHROPIC_AUTO, modelDisplayEntries2, transcriptToolCallModelHints, copilot;
var init_copilot = __esm({
  "src/providers/copilot.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    modelDisplayNames3 = {
      "gpt-4.1-nano": "GPT-4.1 Nano",
      "gpt-4.1-mini": "GPT-4.1 Mini",
      "gpt-4.1": "GPT-4.1",
      "gpt-4o-mini": "GPT-4o Mini",
      "gpt-4o": "GPT-4o",
      "gpt-5.4": "GPT-5.4",
      "gpt-5.3-codex": "GPT-5.3 Codex",
      "gpt-5-mini": "GPT-5 Mini",
      "gpt-5": "GPT-5",
      "claude-opus-4-7": "Opus 4.7",
      "claude-opus-4-6": "Opus 4.6",
      "claude-opus-4-5": "Opus 4.5",
      "claude-opus-4-1": "Opus 4.1",
      "claude-opus-4": "Opus 4",
      "claude-sonnet-4-6": "Sonnet 4.6",
      "claude-sonnet-4-5": "Sonnet 4.5",
      "claude-sonnet-4": "Sonnet 4",
      "claude-3-7-sonnet": "Sonnet 3.7",
      "claude-3-5-sonnet": "Sonnet 3.5",
      "o4-mini": "o4-mini",
      "o3": "o3"
    };
    toolNameMap3 = {
      bash: "Bash",
      run_in_terminal: "Bash",
      read_file: "Read",
      write_file: "Edit",
      edit_file: "Edit",
      replace_string_in_file: "Edit",
      create_file: "Write",
      delete_file: "Delete",
      search_files: "Grep",
      file_search: "Grep",
      find_files: "Glob",
      list_directory: "LS",
      list_dir: "LS",
      web_search: "WebSearch",
      fetch_webpage: "WebFetch",
      github_repo: "GitHub",
      memory: "Memory",
      kill_terminal: "Bash"
    };
    CHARS_PER_TOKEN2 = 4;
    COPILOT_OPENAI_AUTO = "copilot-openai-auto";
    COPILOT_ANTHROPIC_AUTO = "copilot-anthropic-auto";
    modelDisplayEntries2 = Object.entries(modelDisplayNames3).sort((a, b) => b[0].length - a[0].length);
    transcriptToolCallModelHints = [
      // Anthropic tool-call ID variants observed in Copilot transcript logs.
      { prefix: "toolu_bdrk_", model: COPILOT_ANTHROPIC_AUTO },
      { prefix: "toolu_vrtx_", model: COPILOT_ANTHROPIC_AUTO },
      { prefix: "tooluse_", model: COPILOT_ANTHROPIC_AUTO },
      { prefix: "toolu_", model: COPILOT_ANTHROPIC_AUTO },
      // OpenAI tool-call IDs.
      { prefix: "call_", model: COPILOT_OPENAI_AUTO }
    ];
    copilot = createCopilotProvider();
  }
});

// src/providers/droid.ts
import { readdir as readdir7, stat as stat11, readFile as readFile11 } from "fs/promises";
import { join as join14 } from "path";
import { homedir as homedir12 } from "os";
function getFactoryDir() {
  return process.env["FACTORY_DIR"] ?? join14(homedir12(), ".factory");
}
function stripModelPrefix(raw) {
  return raw.replace(/^custom:/, "").replace(/\[.*?\]/g, "").replace(/-\d+$/, "").replace(/-+$/, "").replace(/^-/, "");
}
function parseModelForDisplay(raw) {
  const stripped = stripModelPrefix(raw);
  const lower = stripped.toLowerCase();
  if (lower.includes("opus")) return getShortModelName(stripped);
  if (lower.includes("sonnet")) return getShortModelName(stripped);
  if (lower.includes("haiku")) return getShortModelName(stripped);
  if (lower.startsWith("gpt-")) return getShortModelName(stripped);
  if (lower.startsWith("o3") || lower.startsWith("o4")) return getShortModelName(stripped);
  if (lower.startsWith("gemini")) return getShortModelName(stripped);
  return stripped;
}
function extractDroidBashCommands(command) {
  if (!command || !command.trim()) return [];
  const firstLine = command.split("\n")[0].trim();
  return extractBashCommands(firstLine);
}
function createParser4(source, seenKeys) {
  return {
    async *parse() {
      const content = await readSessionFile(source.path);
      if (content === null) return;
      const settingsPath2 = source.path.replace(/\.jsonl$/, ".settings.json");
      let settings = {};
      try {
        const raw = await readFile11(settingsPath2, "utf-8");
        settings = JSON.parse(raw);
      } catch {
      }
      const lines = content.split("\n").filter((l) => l.trim());
      let sessionId = "";
      let sessionModelDisplay = settings.model ? stripModelPrefix(settings.model) : "unknown";
      let currentUserMessage = "";
      const assistantCalls = [];
      let pendingTools = [];
      let pendingBashCommands = [];
      for (const line of lines) {
        let entry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }
        if (entry.type === "session_start") {
          sessionId = entry.id ?? "";
          continue;
        }
        if (entry.type !== "message" || !entry.message) continue;
        const msg = entry.message;
        if (msg.role === "user") {
          const texts = (msg.content ?? []).filter((c) => c.type === "text" && c.text).map((c) => c.text).filter(Boolean);
          const nonSystemTexts = texts.filter((t) => !t.startsWith("<system-reminder>"));
          if (nonSystemTexts.length > 0) {
            currentUserMessage = nonSystemTexts.join(" ").slice(0, 500);
          }
          continue;
        }
        if (msg.role === "assistant") {
          const toolUses = (msg.content ?? []).filter((c) => c.type === "tool_use");
          for (const tu of toolUses) {
            const toolName = tu.name ?? "";
            pendingTools.push(toolNameMap4[toolName] ?? toolName);
            if (toolName === "Execute" && tu.input && typeof tu.input["command"] === "string") {
              pendingBashCommands.push(...extractDroidBashCommands(tu.input["command"]));
            }
          }
          const hasText = (msg.content ?? []).some((c) => c.type === "text" && c.text);
          if (pendingTools.length > 0 || hasText) {
            assistantCalls.push({
              id: entry.id ?? `msg-${assistantCalls.length}`,
              timestamp: entry.timestamp ?? "",
              tools: [...pendingTools],
              bashCommands: [...pendingBashCommands]
            });
            pendingTools = [];
            pendingBashCommands = [];
          }
          continue;
        }
      }
      if (assistantCalls.length === 0) return;
      const totalTokens = settings.tokenUsage;
      if (!totalTokens) return;
      const totalInput = totalTokens.inputTokens ?? 0;
      const totalOutput = totalTokens.outputTokens ?? 0;
      const totalCacheCreation = totalTokens.cacheCreationTokens ?? 0;
      const totalCacheRead = totalTokens.cacheReadTokens ?? 0;
      const totalThinking = totalTokens.thinkingTokens ?? 0;
      const numCalls = assistantCalls.length;
      const inputPerCall = Math.floor(totalInput / numCalls);
      const outputPerCall = Math.floor(totalOutput / numCalls);
      const cacheCreationPerCall = Math.floor(totalCacheCreation / numCalls);
      const cacheReadPerCall = Math.floor(totalCacheRead / numCalls);
      const thinkingPerCall = Math.floor(totalThinking / numCalls);
      for (let i = 0; i < assistantCalls.length; i++) {
        const call = assistantCalls[i];
        const isLast = i === assistantCalls.length - 1;
        const inputTokens = isLast ? totalInput - inputPerCall * (numCalls - 1) : inputPerCall;
        const outputTokens = isLast ? totalOutput - outputPerCall * (numCalls - 1) : outputPerCall;
        const cacheCreationTokens = isLast ? totalCacheCreation - cacheCreationPerCall * (numCalls - 1) : cacheCreationPerCall;
        const cacheReadTokens = isLast ? totalCacheRead - cacheReadPerCall * (numCalls - 1) : cacheReadPerCall;
        const thinkingTokens = isLast ? totalThinking - thinkingPerCall * (numCalls - 1) : thinkingPerCall;
        const dedupKey = `droid:${sessionId}:${call.id}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);
        const costUSD = calculateCost(
          sessionModelDisplay.toLowerCase(),
          inputTokens,
          outputTokens + thinkingTokens,
          cacheCreationTokens,
          cacheReadTokens,
          0
        );
        const timestamp = call.timestamp || "";
        yield {
          provider: "droid",
          model: sessionModelDisplay,
          inputTokens,
          outputTokens,
          cacheCreationInputTokens: cacheCreationTokens,
          cacheReadInputTokens: cacheReadTokens,
          cachedInputTokens: cacheReadTokens,
          reasoningTokens: thinkingTokens,
          webSearchRequests: 0,
          costUSD,
          tools: call.tools,
          bashCommands: call.bashCommands,
          timestamp,
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: i === 0 ? currentUserMessage : "",
          sessionId
        };
      }
    }
  };
}
function isInternalSession(cwd, factoryDir) {
  const normalized = cwd.replace(/\/+$/, "");
  return normalized === factoryDir;
}
function deriveProjectName(cwd) {
  const normalized = cwd.replace(/\/+$/, "");
  const home = homedir12();
  let relative = normalized.startsWith(home) ? normalized.slice(home.length).replace(/^\/+/, "") : normalized.replace(/^\/+/, "");
  if (!relative) relative = "~";
  const parts = relative.split("/");
  const projectsIdx = parts.lastIndexOf("projects");
  if (projectsIdx !== -1 && projectsIdx + 1 < parts.length) {
    return parts.slice(projectsIdx + 1).join("/");
  }
  return parts.join("/");
}
async function readFirstJsonlLine(filePath) {
  for await (const line of readSessionLines(filePath)) {
    return line;
  }
  return null;
}
async function discoverSessionsInDir2(sessionsDir, factoryDir) {
  const sources = [];
  let entries;
  try {
    entries = await readdir7(sessionsDir);
  } catch {
    return sources;
  }
  for (const entry of entries) {
    const subDir = join14(sessionsDir, entry);
    const s = await stat11(subDir).catch(() => null);
    if (!s?.isDirectory()) continue;
    const files = await readdir7(subDir).catch(() => []);
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const filePath = join14(subDir, file);
      const firstLine = await readFirstJsonlLine(filePath);
      if (!firstLine?.trim()) continue;
      let startEntry;
      try {
        startEntry = JSON.parse(firstLine);
      } catch {
        continue;
      }
      if (startEntry.type !== "session_start") continue;
      const cwd = startEntry.cwd ?? entry;
      if (isInternalSession(cwd, factoryDir)) continue;
      sources.push({
        path: filePath,
        project: deriveProjectName(cwd),
        provider: "droid"
      });
    }
  }
  return sources;
}
function createDroidProvider(factoryDir) {
  const base = factoryDir ?? getFactoryDir();
  const sessionsDir = join14(base, "sessions");
  return {
    name: "droid",
    displayName: "Droid",
    modelDisplayName(model) {
      return parseModelForDisplay(model);
    },
    toolDisplayName(rawTool) {
      return toolNameMap4[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSessionsInDir2(sessionsDir, base);
    },
    createSessionParser(source, seenKeys) {
      return createParser4(source, seenKeys);
    }
  };
}
var toolNameMap4, droid;
var init_droid = __esm({
  "src/providers/droid.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_bash_utils();
    toolNameMap4 = {
      Read: "Read",
      Create: "Create",
      Edit: "Edit",
      MultiEdit: "MultiEdit",
      LS: "LS",
      Glob: "Glob",
      Grep: "Grep",
      Execute: "Bash",
      AskUser: "AskUser",
      TodoWrite: "TodoWrite",
      Skill: "Skill",
      Task: "Agent",
      WebSearch: "WebSearch",
      FetchUrl: "FetchUrl",
      GenerateDroid: "GenerateDroid",
      ExitSpecMode: "ExitSpecMode"
    };
    droid = createDroidProvider();
  }
});

// src/providers/gemini.ts
import { readdir as readdir8, stat as stat12 } from "fs/promises";
import { join as join15 } from "path";
import { homedir as homedir13 } from "os";
function parseSession(data, seenKeys) {
  const results = [];
  let lastUserMessage = "";
  let turnOrdinal = 0;
  let currentTurnId = `${data.sessionId}:prelude`;
  let geminiOrdinal = 0;
  for (const msg of data.messages) {
    if (msg.type === "user") {
      if (Array.isArray(msg.content)) {
        lastUserMessage = msg.content.map((c) => c.text).join(" ").slice(0, 500);
      } else if (typeof msg.content === "string") {
        lastUserMessage = msg.content.slice(0, 500);
      }
      currentTurnId = `${data.sessionId}:turn-${turnOrdinal++}`;
      continue;
    }
    if (msg.type !== "gemini" || !msg.tokens || !msg.model) continue;
    const t = msg.tokens;
    const totalInput = t.input ?? 0;
    const totalOutput = t.output ?? 0;
    const totalCached = t.cached ?? 0;
    const totalThoughts = t.thoughts ?? 0;
    if (totalInput === 0 && totalOutput === 0 && totalCached === 0 && totalThoughts === 0) continue;
    const messageKey = msg.id || `idx-${geminiOrdinal}`;
    geminiOrdinal++;
    const dedupKey = `gemini:${data.sessionId}:${messageKey}`;
    if (seenKeys.has(dedupKey)) continue;
    const tools = [];
    const bashCommands = [];
    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        const mapped = toolNameMap5[tc.displayName ?? ""] ?? toolNameMap5[tc.name] ?? tc.displayName ?? tc.name;
        tools.push(mapped);
        if (mapped === "Bash" && tc.args && typeof tc.args.command === "string") {
          bashCommands.push(...extractBashCommands(tc.args.command));
        }
      }
    }
    const freshInput = Math.max(0, totalInput - totalCached);
    const tsDate = new Date(msg.timestamp || data.startTime);
    if (isNaN(tsDate.getTime()) || tsDate.getTime() < 1e12) continue;
    seenKeys.add(dedupKey);
    const costUSD = calculateCost(msg.model, freshInput, totalOutput + totalThoughts, 0, totalCached, 0);
    results.push({
      provider: "gemini",
      model: msg.model,
      inputTokens: freshInput,
      outputTokens: totalOutput,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: totalCached,
      cachedInputTokens: totalCached,
      reasoningTokens: totalThoughts,
      webSearchRequests: 0,
      costUSD,
      tools: [...new Set(tools)],
      bashCommands: [...new Set(bashCommands)],
      timestamp: tsDate.toISOString(),
      speed: "standard",
      deduplicationKey: dedupKey,
      turnId: currentTurnId,
      userMessage: lastUserMessage,
      sessionId: data.sessionId
    });
  }
  return results;
}
function parseJsonl(raw) {
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return null;
  let sessionId = "";
  let startTime = "";
  let projectHash;
  let lastUpdated;
  let kind;
  const messages = [];
  for (const line of lines) {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (obj["$set"] !== void 0) continue;
    if (obj["sessionId"] && obj["startTime"] && !sessionId) {
      sessionId = obj["sessionId"];
      startTime = obj["startTime"];
      projectHash = obj["projectHash"];
      lastUpdated = obj["lastUpdated"];
      kind = obj["kind"];
    } else if (obj["id"] && obj["type"]) {
      messages.push(obj);
    }
  }
  if (!sessionId) return null;
  return { sessionId, projectHash, startTime, lastUpdated, kind, messages };
}
function createParser5(source, seenKeys) {
  return {
    async *parse() {
      const raw = await readSessionFile(source.path);
      if (raw === null) return;
      let data = null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.messages && parsed.sessionId) {
          data = parsed;
        }
      } catch {
      }
      if (!data) {
        data = parseJsonl(raw);
      }
      if (!data?.messages || !data.sessionId) return;
      const calls = parseSession(data, seenKeys);
      for (const call of calls) {
        yield call;
      }
    }
  };
}
function getGeminiTmpDir() {
  return join15(homedir13(), ".gemini", "tmp");
}
async function discoverSessions() {
  const sources = [];
  const tmpDir = getGeminiTmpDir();
  let projectDirs;
  try {
    const entries = await readdir8(tmpDir, { withFileTypes: true });
    projectDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return sources;
  }
  for (const project of projectDirs) {
    const chatsDir = join15(tmpDir, project, "chats");
    let files;
    try {
      const entries = await readdir8(chatsDir);
      files = entries.filter((f) => f.startsWith("session-") && (f.endsWith(".json") || f.endsWith(".jsonl")));
    } catch {
      continue;
    }
    for (const file of files) {
      const filePath = join15(chatsDir, file);
      const s = await stat12(filePath).catch(() => null);
      if (!s?.isFile()) continue;
      sources.push({ path: filePath, project, provider: "gemini" });
    }
  }
  return sources;
}
function createGeminiProvider() {
  return {
    name: "gemini",
    displayName: "Gemini",
    modelDisplayName(model) {
      if (model === "gemini-auto") return "Gemini (auto)";
      const display = {
        "gemini-3-flash-preview": "Gemini 3 Flash",
        "gemini-3.5-flash": "Gemini 3.5 Flash",
        "gemini-3.1-pro-preview": "Gemini 3.1 Pro",
        "gemini-2.5-pro": "Gemini 2.5 Pro",
        "gemini-2.5-flash": "Gemini 2.5 Flash",
        "gemini-2.0-flash": "Gemini 2.0 Flash"
      };
      return display[model] ?? model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap5[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSessions();
    },
    createSessionParser(source, seenKeys) {
      return createParser5(source, seenKeys);
    }
  };
}
var toolNameMap5, gemini;
var init_gemini = __esm({
  "src/providers/gemini.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_bash_utils();
    toolNameMap5 = {
      read_file: "Read",
      write_file: "Write",
      edit_file: "Edit",
      create_file: "Write",
      delete_file: "Delete",
      list_dir: "LS",
      grep_search: "Grep",
      search_files: "Grep",
      find_files: "Glob",
      run_command: "Bash",
      web_search: "WebSearch",
      ReadFile: "Read",
      WriteFile: "Write",
      EditFile: "Edit",
      ListDir: "LS",
      SearchText: "Grep",
      Shell: "Bash"
    };
    gemini = createGeminiProvider();
  }
});

// src/providers/ibm-bob.ts
import { join as join16 } from "path";
import { homedir as homedir14 } from "os";
function getIBMBobGlobalStorageDirs() {
  const home = homedir14();
  if (process.platform === "darwin") {
    return [
      join16(home, "Library", "Application Support", "IBM Bob", "User", "globalStorage", EXTENSION_ID2),
      join16(home, "Library", "Application Support", "Bob-IDE", "User", "globalStorage", EXTENSION_ID2)
    ];
  }
  if (process.platform === "win32") {
    const appData = process.env["APPDATA"] ?? join16(home, "AppData", "Roaming");
    return [
      join16(appData, "IBM Bob", "User", "globalStorage", EXTENSION_ID2),
      join16(appData, "Bob-IDE", "User", "globalStorage", EXTENSION_ID2)
    ];
  }
  const configHome = process.env["XDG_CONFIG_HOME"] ?? join16(home, ".config");
  return [
    join16(configHome, "IBM Bob", "User", "globalStorage", EXTENSION_ID2),
    join16(configHome, "Bob-IDE", "User", "globalStorage", EXTENSION_ID2)
  ];
}
function createIBMBobProvider(overrideDir) {
  return {
    name: PROVIDER_NAME,
    displayName: DISPLAY_NAME,
    modelDisplayName(model) {
      return getShortModelName(model);
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      const dirs = overrideDir ? [overrideDir] : getIBMBobGlobalStorageDirs();
      return discoverClineTasksInBaseDirs(dirs, PROVIDER_NAME, DISPLAY_NAME);
    },
    createSessionParser(source, seenKeys) {
      return createClineParser(source, seenKeys, PROVIDER_NAME, FALLBACK_MODEL);
    }
  };
}
var PROVIDER_NAME, DISPLAY_NAME, EXTENSION_ID2, FALLBACK_MODEL, ibmBob;
var init_ibm_bob = __esm({
  "src/providers/ibm-bob.ts"() {
    "use strict";
    init_models();
    init_vscode_cline_parser();
    PROVIDER_NAME = "ibm-bob";
    DISPLAY_NAME = "IBM Bob";
    EXTENSION_ID2 = "ibm.bob-code";
    FALLBACK_MODEL = "ibm-bob-auto";
    ibmBob = createIBMBobProvider();
  }
});

// src/sqlite.ts
import { createRequire } from "module";
function blobToText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return textDecoder.decode(value);
}
function loadDriver() {
  if (loadAttempted) return DatabaseSync !== null;
  loadAttempted = true;
  const origEmit = process.emit.bind(process);
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    process.emit = origEmit;
  };
  process.emit = function patchedEmit(event, ...args) {
    if (event === "warning") {
      const warning = args[0];
      if (warning?.name === "ExperimentalWarning" && typeof warning.message === "string" && /SQLite/i.test(warning.message)) {
        return false;
      }
    }
    return origEmit.call(this, event, ...args);
  };
  try {
    const mod = requireForSqlite("node:sqlite");
    DatabaseSync = mod.DatabaseSync;
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    loadError = `SQLite-based providers (Cursor, OpenCode) need Node 22+ with the node:sqlite module.
Current Node: ${process.version}.
Upgrade Node (https://nodejs.org) and run codeburn again.
(underlying error: ${message})`;
    return false;
  } finally {
    process.nextTick(restore);
  }
}
function isSqliteAvailable() {
  return loadDriver();
}
function getSqliteLoadError() {
  return loadError ?? "SQLite driver not available";
}
function isSqliteBusyError(err) {
  const e = err;
  const code = typeof e?.code === "string" ? e.code : "";
  const errcode = typeof e?.errcode === "number" ? e.errcode : null;
  const message = [
    typeof e?.message === "string" ? e.message : "",
    typeof e?.errstr === "string" ? e.errstr : ""
  ].join(" ");
  return errcode === 5 || errcode === 6 || code === "SQLITE_BUSY" || code === "SQLITE_LOCKED" || /\bSQLITE_(BUSY|LOCKED)\b|database (?:is |table is )?locked/i.test(message);
}
function openDatabase(path) {
  if (!loadDriver() || DatabaseSync === null) {
    throw new Error(getSqliteLoadError());
  }
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    db.exec?.("PRAGMA busy_timeout = 1000");
  } catch {
  }
  return {
    query(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    close() {
      db.close();
    }
  };
}
var requireForSqlite, DatabaseSync, loadAttempted, loadError, textDecoder;
var init_sqlite = __esm({
  "src/sqlite.ts"() {
    "use strict";
    requireForSqlite = createRequire(import.meta.url);
    DatabaseSync = null;
    loadAttempted = false;
    loadError = null;
    textDecoder = new TextDecoder("utf-8", { fatal: false });
  }
});

// src/providers/sqlite-session-parser.ts
import { readdir as readdir9 } from "fs/promises";
import { join as join17 } from "path";
function normalizeToolName2(rawTool) {
  if (!rawTool) return "";
  if (rawTool.startsWith("mcp__")) return rawTool;
  const builtIn = toolNameMap6[rawTool];
  if (builtIn) return builtIn;
  const serverSeparator = rawTool.indexOf("_");
  if (serverSeparator > 0 && serverSeparator < rawTool.length - 1) {
    const server = rawTool.slice(0, serverSeparator);
    const tool = rawTool.slice(serverSeparator + 1);
    return `mcp__${server}__${tool}`;
  }
  return rawTool;
}
function sanitize(dir) {
  return dir.replace(/^\//, "").replace(/\//g, "-");
}
function parseTimestamp(raw) {
  const ms = raw < 1e12 ? raw * 1e3 : raw;
  return new Date(ms).toISOString();
}
function tryQuerySessionTokens(db, sessionId) {
  try {
    const rows = db.query(
      `SELECT cost, tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write, model_id FROM session WHERE id = ?`,
      [sessionId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      cost: r.cost ?? 0,
      input: r.tokens_input ?? 0,
      output: r.tokens_output ?? 0,
      reasoning: r.tokens_reasoning ?? 0,
      cacheRead: r.tokens_cache_read ?? 0,
      cacheWrite: r.tokens_cache_write ?? 0,
      model: r.model_id ?? void 0
    };
  } catch {
    return null;
  }
}
function validateSchemaDetailed(db) {
  const required = ["session", "message", "part"];
  const missing = [];
  for (const table of required) {
    try {
      db.query(`SELECT COUNT(*) as cnt FROM ${table} LIMIT 1`);
    } catch (err) {
      if (isSqliteBusyError(err)) throw err;
      missing.push(table);
    }
  }
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
function warnUnrecognizedSchemaOnce(providerLabel, missing) {
  const providerSet = warnedSchemas.get(providerLabel) ?? /* @__PURE__ */ new Set();
  const key = missing.slice().sort().join(",");
  if (providerSet.has(key)) return;
  providerSet.add(key);
  warnedSchemas.set(providerLabel, providerSet);
  process.stderr.write(
    `codeburn: ${providerLabel} database is missing expected tables (${missing.join(", ")}). Run ${providerLabel} once to apply migrations, or report at https://github.com/getagentseal/codeburn/issues if this persists.
`
  );
}
function createSqliteSessionParser(source, seenKeys, config) {
  return {
    async *parse() {
      if (!isSqliteAvailable()) {
        process.stderr.write(getSqliteLoadError() + "\n");
        return;
      }
      const segments = source.path.split(":");
      const sessionId = segments[segments.length - 1];
      const dbPath = segments.slice(0, -1).join(":");
      let db;
      try {
        db = openDatabase(dbPath);
      } catch (err) {
        process.stderr.write(`codeburn: cannot open ${config.displayName} database: ${err instanceof Error ? err.message : err}
`);
        return;
      }
      try {
        const schema = validateSchemaDetailed(db);
        if (!schema.ok) {
          warnUnrecognizedSchemaOnce(config.displayName, schema.missing);
          return;
        }
        const messages = db.query(
          `WITH RECURSIVE session_tree(id) AS (
            SELECT id FROM session WHERE id = ?
            UNION
            SELECT child.id
            FROM session child
            JOIN session_tree parent ON child.parent_id = parent.id
            WHERE child.time_archived IS NULL
          )
          SELECT session_id, id, time_created, CAST(data AS BLOB) AS data
          FROM message
          WHERE session_id IN (SELECT id FROM session_tree)
          ORDER BY time_created ASC, id ASC`,
          [sessionId]
        );
        const parts = db.query(
          `WITH RECURSIVE session_tree(id) AS (
            SELECT id FROM session WHERE id = ?
            UNION
            SELECT child.id
            FROM session child
            JOIN session_tree parent ON child.parent_id = parent.id
            WHERE child.time_archived IS NULL
          )
          SELECT message_id, CAST(data AS BLOB) AS data
          FROM part
          WHERE session_id IN (SELECT id FROM session_tree)
          ORDER BY message_id, id`,
          [sessionId]
        );
        const partsByMsg = /* @__PURE__ */ new Map();
        for (const part of parts) {
          try {
            const parsed = JSON.parse(blobToText(part.data));
            const list = partsByMsg.get(part.message_id) ?? [];
            list.push(parsed);
            partsByMsg.set(part.message_id, list);
          } catch {
          }
        }
        const currentUserMessageBySession = /* @__PURE__ */ new Map();
        let yieldCount = 0;
        let parseFailCount = 0;
        let roleSkipCount = 0;
        for (const msg of messages) {
          let data;
          try {
            data = JSON.parse(blobToText(msg.data));
          } catch {
            parseFailCount++;
            continue;
          }
          if (data.role === "user") {
            const textParts = (partsByMsg.get(msg.id) ?? []).filter((p) => p.type === "text").map((p) => p.text ?? "").filter(Boolean);
            if (textParts.length > 0) {
              currentUserMessageBySession.set(msg.session_id, textParts.join(" "));
            }
            continue;
          }
          if (data.role !== "assistant" && data.role !== "model") {
            if (data.role !== "user") roleSkipCount++;
            continue;
          }
          const tokens = {
            input: data.tokens?.input ?? data.usage?.input_tokens ?? 0,
            output: data.tokens?.output ?? data.usage?.output_tokens ?? 0,
            reasoning: data.tokens?.reasoning ?? 0,
            cacheRead: data.tokens?.cache?.read ?? data.usage?.cache_read_input_tokens ?? 0,
            cacheWrite: data.tokens?.cache?.write ?? data.usage?.cache_creation_input_tokens ?? 0
          };
          const msgParts = partsByMsg.get(msg.id) ?? [];
          const toolParts = msgParts.filter((p) => (p.type === "tool" || p.type === "tool-call" || p.type === "tool_call") && normalizeToolName2(p.tool));
          const hasTextOutput = msgParts.some((p) => p.type === "text" && typeof p.text === "string" && p.text.trim().length > 0);
          const hasToolOrTextParts = hasTextOutput || toolParts.length > 0;
          const hasAnySubstantiveParts = msgParts.some(
            (p) => p.type === "text" || p.type === "tool" || p.type === "tool-call" || p.type === "tool_call" || p.type === "tool-result" || p.type === "tool_result" || p.type === "reasoning" || p.type === "file"
          );
          const hasActivity = hasToolOrTextParts || hasAnySubstantiveParts;
          const allZero = tokens.input === 0 && tokens.output === 0 && tokens.reasoning === 0 && tokens.cacheRead === 0 && tokens.cacheWrite === 0;
          if (allZero && (data.cost ?? 0) === 0 && !hasActivity) continue;
          const tools = toolParts.map((p) => normalizeToolName2(p.tool)).filter(Boolean);
          const bashCommands = toolParts.filter((p) => p.tool === "bash" && typeof p.state?.input?.command === "string").flatMap((p) => extractBashCommands(p.state.input.command));
          const dedupKey = `${config.providerName}:${msg.session_id}:${msg.id}`;
          if (seenKeys.has(dedupKey)) continue;
          seenKeys.add(dedupKey);
          const model = data.modelID ?? data.model ?? "unknown";
          let costUSD = calculateCost(
            model,
            tokens.input,
            tokens.output + tokens.reasoning,
            tokens.cacheWrite,
            tokens.cacheRead,
            0
          );
          if (costUSD === 0 && typeof data.cost === "number" && data.cost > 0) {
            costUSD = data.cost;
          }
          yieldCount++;
          yield {
            provider: config.providerName,
            model,
            inputTokens: tokens.input,
            outputTokens: tokens.output,
            cacheCreationInputTokens: tokens.cacheWrite,
            cacheReadInputTokens: tokens.cacheRead,
            cachedInputTokens: tokens.cacheRead,
            reasoningTokens: tokens.reasoning,
            webSearchRequests: 0,
            costUSD,
            tools,
            bashCommands,
            timestamp: parseTimestamp(msg.time_created),
            speed: "standard",
            deduplicationKey: dedupKey,
            userMessage: currentUserMessageBySession.get(msg.session_id) ?? "",
            sessionId
          };
        }
        if (yieldCount === 0 && messages.length > 0) {
          const sessionTokens = tryQuerySessionTokens(db, sessionId);
          if (sessionTokens && (sessionTokens.cost > 0 || sessionTokens.input > 0 || sessionTokens.output > 0)) {
            const dedupKey = `${config.providerName}:${sessionId}:session-level`;
            if (!seenKeys.has(dedupKey)) {
              seenKeys.add(dedupKey);
              const model = sessionTokens.model ?? "unknown";
              let costUSD = calculateCost(model, sessionTokens.input, sessionTokens.output, sessionTokens.cacheWrite, sessionTokens.cacheRead, 0);
              if (costUSD === 0 && sessionTokens.cost > 0) costUSD = sessionTokens.cost;
              yield {
                provider: config.providerName,
                model,
                inputTokens: sessionTokens.input,
                outputTokens: sessionTokens.output,
                cacheCreationInputTokens: sessionTokens.cacheWrite,
                cacheReadInputTokens: sessionTokens.cacheRead,
                cachedInputTokens: sessionTokens.cacheRead,
                reasoningTokens: sessionTokens.reasoning,
                webSearchRequests: 0,
                costUSD,
                tools: [],
                bashCommands: [],
                timestamp: parseTimestamp(messages[0].time_created),
                speed: "standard",
                deduplicationKey: dedupKey,
                userMessage: "",
                sessionId
              };
              yieldCount++;
            }
          }
          if (yieldCount === 0 && process.env["CODEBURN_VERBOSE"] === "1") {
            process.stderr.write(
              `codeburn: ${config.displayName} session ${sessionId} has ${messages.length} messages (${parseFailCount} unparseable, ${roleSkipCount} non-user/assistant roles) but yielded 0 calls. Parts: ${parts.length}.
`
            );
          }
        }
      } finally {
        db.close();
      }
    }
  };
}
async function discoverSqliteSessions(config) {
  if (!isSqliteAvailable()) return [];
  let dbPaths;
  try {
    const entries = await readdir9(config.dbDir);
    dbPaths = entries.filter((f) => f.startsWith(config.dbFilePrefix) && f.endsWith(".db")).map((f) => join17(config.dbDir, f));
  } catch {
    return [];
  }
  if (dbPaths.length === 0) return [];
  const sessions = [];
  for (const dbPath of dbPaths) {
    let db;
    try {
      db = openDatabase(dbPath);
    } catch {
      continue;
    }
    try {
      const schema = validateSchemaDetailed(db);
      if (!schema.ok) continue;
      const rows = db.query(
        "SELECT id, CAST(directory AS BLOB) AS directory, CAST(title AS BLOB) AS title, time_created FROM session WHERE time_archived IS NULL AND parent_id IS NULL ORDER BY time_created DESC"
      );
      for (const row of rows) {
        const dir = blobToText(row.directory);
        const title = blobToText(row.title);
        sessions.push({
          path: `${dbPath}:${row.id}`,
          project: dir ? sanitize(dir) : sanitize(title),
          provider: config.providerName
        });
      }
    } catch {
    } finally {
      db.close();
    }
  }
  return sessions;
}
var toolNameMap6, warnedSchemas;
var init_sqlite_session_parser = __esm({
  "src/providers/sqlite-session-parser.ts"() {
    "use strict";
    init_models();
    init_bash_utils();
    init_sqlite();
    toolNameMap6 = {
      bash: "Bash",
      read: "Read",
      edit: "Edit",
      write: "Write",
      glob: "Glob",
      grep: "Grep",
      task: "Agent",
      fetch: "WebFetch",
      search: "WebSearch",
      todo: "TodoWrite",
      skill: "Skill",
      patch: "Patch"
    };
    warnedSchemas = /* @__PURE__ */ new Map();
  }
});

// src/providers/kilo-code.ts
import { join as join18 } from "path";
import { homedir as homedir15 } from "os";
function getSqliteConfig() {
  const base = process.env["XDG_DATA_HOME"] ?? join18(homedir15(), ".local", "share");
  return {
    providerName: PROVIDER_NAME2,
    displayName: "KiloCode",
    dbDir: join18(base, "kilo"),
    dbFilePrefix: "kilo"
  };
}
function createKiloCodeProvider(overrideDir) {
  const sqliteConfig = getSqliteConfig();
  return {
    name: PROVIDER_NAME2,
    displayName: "KiloCode",
    modelDisplayName(model) {
      return model;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      const [oldSessions, dbSessions] = await Promise.all([
        discoverClineTasks(EXTENSION_ID3, PROVIDER_NAME2, "KiloCode", overrideDir),
        discoverSqliteSessions(sqliteConfig)
      ]);
      return [...oldSessions, ...dbSessions];
    },
    createSessionParser(source, seenKeys) {
      if (source.path.includes(".db:")) {
        return createSqliteSessionParser(source, seenKeys, sqliteConfig);
      }
      return createClineParser(source, seenKeys, PROVIDER_NAME2);
    }
  };
}
var EXTENSION_ID3, PROVIDER_NAME2, kiloCode;
var init_kilo_code = __esm({
  "src/providers/kilo-code.ts"() {
    "use strict";
    init_vscode_cline_parser();
    init_sqlite_session_parser();
    EXTENSION_ID3 = "kilocode.kilo-code";
    PROVIDER_NAME2 = "kilo-code";
    kiloCode = createKiloCodeProvider();
  }
});

// src/providers/kiro.ts
import { readdir as readdir10, readFile as readFile12 } from "fs/promises";
import { basename as basename8, dirname as dirname4, extname, join as join19 } from "path";
import { homedir as homedir16 } from "os";
function normalizeModelId(raw) {
  return raw.replace(/(\d+)\.(\d+)/g, "$1-$2");
}
function extractToolNames(content) {
  const tools = [];
  const regex2 = /<tool_use>\s*<name>([^<]+)<\/name>/g;
  let match;
  while ((match = regex2.exec(content)) !== null) {
    const name = match[1].trim();
    tools.push(toolNameMap7[name] ?? name);
  }
  return tools;
}
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function stringField(record, names) {
  if (!record) return "";
  for (const name of names) {
    const value = record[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
function timeField(record, names) {
  if (!record) return void 0;
  for (const name of names) {
    const value = record[name];
    if (typeof value === "number" || typeof value === "string") return value;
  }
  return void 0;
}
function parseKiroTimestamp(value) {
  if (value === void 0) return null;
  let parsed = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    parsed = /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : trimmed;
  }
  if (typeof parsed === "number") {
    if (!Number.isFinite(parsed)) return null;
    const ms = parsed < MIN_REASONABLE_TIMESTAMP_MS ? parsed * 1e3 : parsed;
    const date2 = new Date(ms);
    return Number.isNaN(date2.getTime()) || date2.getTime() < MIN_REASONABLE_TIMESTAMP_MS ? null : date2;
  }
  const date = new Date(parsed);
  return Number.isNaN(date.getTime()) || date.getTime() < MIN_REASONABLE_TIMESTAMP_MS ? null : date;
}
function textField(record, names) {
  if (!record) return "";
  for (const name of names) {
    const text = extractText(record[name]);
    if (text) return text;
  }
  return "";
}
function extractText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(extractText).filter(Boolean).join("\n");
  const record = asRecord(value);
  if (!record) return "";
  for (const key of ["content", "text", "message", "value", "parts"]) {
    const text = extractText(record[key]);
    if (text) return text;
  }
  return "";
}
function messageRole(value) {
  const record = asRecord(value);
  if (!record) return "";
  return stringField(record, ["role", "type", "author"]).toLowerCase();
}
function extractStructuredToolNames(value, text, options = {}) {
  const tools = extractToolNames(text);
  const record = asRecord(value);
  if (!record) return tools;
  if (options.includeDirectName ?? true) {
    const directName = stringField(record, ["toolName", "name"]);
    if (directName) tools.push(toolNameMap7[directName] ?? directName);
  }
  for (const key of ["toolCalls", "tool_calls", "tools"]) {
    const entries = record[key];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const name = stringField(asRecord(entry), ["name", "toolName", "tool_name"]);
      if (name) tools.push(toolNameMap7[name] ?? name);
    }
  }
  return tools;
}
function parseChatFile(data, sessionId, project, seenKeys) {
  const results = [];
  const { chat, metadata } = data;
  let modelId = normalizeModelId(metadata.modelId ?? "");
  if (modelId === "auto" || !modelId) modelId = "kiro-auto";
  let pendingUserMessage = "";
  const allTools = [];
  const toolSequence = [];
  for (const msg of chat) {
    if (msg.role === "human") {
      if (msg.content.startsWith("<identity>")) continue;
      pendingUserMessage = msg.content.slice(0, 500);
    }
    if (msg.role === "bot") {
      const msgTools = extractToolNames(msg.content);
      allTools.push(...msgTools);
      if (msgTools.length > 0) toolSequence.push(msgTools.map((t) => ({ tool: t })));
    }
  }
  const botMessages = chat.filter((m) => m.role === "bot" && m.content.length > 0);
  const totalOutputChars = botMessages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalOutputChars === 0) return results;
  const dedupKey = `kiro:${sessionId}:${data.executionId}`;
  if (seenKeys.has(dedupKey)) return results;
  const outputTokens = Math.ceil(totalOutputChars / CHARS_PER_TOKEN3);
  const inputTokens = Math.ceil(pendingUserMessage.length / CHARS_PER_TOKEN3);
  const costUSD = calculateCost(modelId, inputTokens, outputTokens, 0, 0, 0);
  const tsDate = parseKiroTimestamp(metadata.startTime);
  if (!tsDate) return results;
  const timestamp = tsDate.toISOString();
  seenKeys.add(dedupKey);
  results.push({
    provider: "kiro",
    model: modelId,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    cachedInputTokens: 0,
    reasoningTokens: 0,
    webSearchRequests: 0,
    costUSD,
    tools: [...new Set(allTools)],
    bashCommands: [],
    toolSequence: toolSequence.length > 1 ? toolSequence : void 0,
    timestamp,
    speed: "standard",
    deduplicationKey: dedupKey,
    userMessage: pendingUserMessage,
    sessionId
  });
  return results;
}
function parseModernExecution(data, sourcePath, seenKeys) {
  const results = [];
  if (Array.isArray(data["executions"])) return results;
  const metadata = asRecord(data["metadata"]);
  const modelObj = asRecord(data["model"]);
  let modelId = normalizeModelId(
    stringField(data, ["modelId", "modelID", "modelName", "model"]) || stringField(modelObj, ["id", "name"]) || stringField(metadata, ["modelId", "modelID", "modelName"])
  );
  if (modelId === "auto" || !modelId) modelId = "kiro-auto";
  const executionId = stringField(data, ["executionId", "id"]) || basename8(sourcePath);
  const sessionId = stringField(data, ["sessionId", "conversationId", "workflowId"]) || stringField(metadata, ["workflowId", "sessionId"]) || basename8(dirname4(sourcePath)) || executionId;
  let inputChars = 0;
  let outputChars = 0;
  let pendingUserMessage = "";
  const allTools = [];
  let hasOutputActivity = false;
  const directInput = textField(data, ["prompt", "input", "userMessage", "user_message", "request"]);
  const directOutput = textField(data, ["response", "output", "assistantMessage", "assistant_message", "result"]);
  const directTools = extractStructuredToolNames(data, directOutput, { includeDirectName: false });
  if (directInput) {
    inputChars += directInput.length;
    pendingUserMessage = directInput.slice(0, 500);
  }
  if (directOutput) {
    outputChars += directOutput.length;
    hasOutputActivity = true;
  }
  if (directTools.length > 0) {
    hasOutputActivity = true;
    allTools.push(...directTools);
  }
  for (const key of MODERN_CONVERSATION_KEYS) {
    const messages = data[key];
    if (!Array.isArray(messages)) continue;
    for (const message of messages) {
      const text = extractText(message);
      const role = messageRole(message);
      const tools = extractStructuredToolNames(message, text);
      if (role === "human" || role === "user") {
        if (!text) continue;
        inputChars += text.length;
        pendingUserMessage = text.slice(0, 500);
      } else if (role === "bot" || role === "assistant" || role === "ai" || role === "model") {
        if (text) outputChars += text.length;
        if (text || tools.length > 0) hasOutputActivity = true;
        allTools.push(...tools);
      } else if (role === "tool" || role === "system") {
        if (text) inputChars += text.length;
        allTools.push(...tools);
      }
    }
    break;
  }
  if (!hasOutputActivity) return results;
  const dedupKey = `kiro:${sessionId}:${executionId}`;
  if (seenKeys.has(dedupKey)) return results;
  const rawStartTime = timeField(data, ["startTime", "createdAt", "timestamp"]) ?? timeField(metadata, ["startTime", "createdAt", "timestamp"]);
  const tsDate = parseKiroTimestamp(rawStartTime);
  if (!tsDate) return results;
  const inputTokens = Math.ceil(inputChars / CHARS_PER_TOKEN3);
  const outputTokens = Math.ceil(outputChars / CHARS_PER_TOKEN3);
  const costUSD = calculateCost(modelId, inputTokens, outputTokens, 0, 0, 0);
  seenKeys.add(dedupKey);
  results.push({
    provider: "kiro",
    model: modelId,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    cachedInputTokens: 0,
    reasoningTokens: 0,
    webSearchRequests: 0,
    costUSD,
    tools: [...new Set(allTools)],
    bashCommands: [],
    timestamp: tsDate.toISOString(),
    speed: "standard",
    deduplicationKey: dedupKey,
    userMessage: pendingUserMessage,
    sessionId
  });
  return results;
}
function createParser6(source, seenKeys) {
  return {
    async *parse() {
      const content = await readSessionFile(source.path);
      if (content === null) return;
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        return;
      }
      const record = asRecord(data);
      if (!record) return;
      const metadata = asRecord(record["metadata"]);
      const calls = Array.isArray(record["chat"]) && metadata ? parseChatFile(record, stringField(metadata, ["workflowId"]) || basename8(source.path, ".chat"), source.project, seenKeys) : parseModernExecution(record, source.path, seenKeys);
      for (const call of calls) {
        yield call;
      }
    }
  };
}
function getKiroAgentDir(override) {
  if (override) return override;
  if (process.platform === "darwin") {
    return join19(homedir16(), "Library", "Application Support", "Kiro", "User", "globalStorage", "kiro.kiroagent");
  }
  if (process.platform === "win32") {
    return join19(homedir16(), "AppData", "Roaming", "Kiro", "User", "globalStorage", "kiro.kiroagent");
  }
  return join19(homedir16(), ".config", "Kiro", "User", "globalStorage", "kiro.kiroagent");
}
function getKiroWorkspaceStorageDir(override) {
  if (override) return override;
  if (process.platform === "darwin") {
    return join19(homedir16(), "Library", "Application Support", "Kiro", "User", "workspaceStorage");
  }
  if (process.platform === "win32") {
    return join19(homedir16(), "AppData", "Roaming", "Kiro", "User", "workspaceStorage");
  }
  return join19(homedir16(), ".config", "Kiro", "User", "workspaceStorage");
}
async function readWorkspaceProject2(workspaceDir) {
  try {
    const raw = await readFile12(join19(workspaceDir, "workspace.json"), "utf-8");
    const data = JSON.parse(raw);
    if (data.folder) {
      const url = data.folder.replace(/^file:\/\//, "");
      return basename8(decodeURIComponent(url));
    }
  } catch {
  }
  return basename8(workspaceDir);
}
async function resolveWorkspaceProject(agentDir, workspaceStorageDir, workspaceHash) {
  const wsDir = join19(workspaceStorageDir, workspaceHash);
  const project = await readWorkspaceProject2(wsDir);
  if (project !== workspaceHash) return project;
  try {
    const sessionsPath = join19(agentDir, "workspace-sessions");
    const dirs = await readdir10(sessionsPath);
    for (const dir of dirs) {
      const decoded = Buffer.from(dir.replace(/_$/, ""), "base64").toString("utf-8");
      if (decoded) return basename8(decoded);
    }
  } catch {
  }
  return workspaceHash;
}
async function discoverSessions2(agentDir, workspaceStorageDir) {
  const sources = [];
  let workspaceDirs;
  try {
    const entries = await readdir10(agentDir, { withFileTypes: true });
    workspaceDirs = entries.filter((e) => e.isDirectory() && e.name.length === 32).map((e) => e.name);
  } catch {
    return sources;
  }
  for (const wsHash of workspaceDirs) {
    const wsPath = join19(agentDir, wsHash);
    const project = await resolveWorkspaceProject(agentDir, workspaceStorageDir, wsHash);
    let entries;
    try {
      entries = await readdir10(wsPath, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const entryPath = join19(wsPath, entry.name);
      if (entry.isFile() && (entry.name.endsWith(".chat") || extname(entry.name) === "")) {
        sources.push({ path: entryPath, project, provider: "kiro" });
        continue;
      }
      if (!entry.isDirectory()) continue;
      const childEntries = await readdir10(entryPath, { withFileTypes: true }).catch(() => []);
      for (const child of childEntries) {
        if (child.name.startsWith(".")) continue;
        if (!child.isFile()) continue;
        if (extname(child.name) !== "") continue;
        sources.push({ path: join19(entryPath, child.name), project, provider: "kiro" });
      }
    }
  }
  return sources;
}
function createKiroProvider(agentDirOverride, workspaceStorageDirOverride) {
  const agentDir = getKiroAgentDir(agentDirOverride);
  const wsDir = getKiroWorkspaceStorageDir(workspaceStorageDirOverride);
  return {
    name: "kiro",
    displayName: "Kiro",
    modelDisplayName(model) {
      if (model === "kiro-auto") return "Kiro (auto)";
      for (const [key, name] of modelDisplayEntries3) {
        if (model === key || model.startsWith(key + "-")) return name;
      }
      return model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap7[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSessions2(agentDir, wsDir);
    },
    createSessionParser(source, seenKeys) {
      return createParser6(source, seenKeys);
    }
  };
}
var CHARS_PER_TOKEN3, MIN_REASONABLE_TIMESTAMP_MS, MODERN_CONVERSATION_KEYS, modelDisplayNames4, modelDisplayEntries3, toolNameMap7, kiro;
var init_kiro = __esm({
  "src/providers/kiro.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    CHARS_PER_TOKEN3 = 4;
    MIN_REASONABLE_TIMESTAMP_MS = 1e12;
    MODERN_CONVERSATION_KEYS = ["messages", "conversation", "chat", "transcript", "entries", "events"];
    modelDisplayNames4 = {
      "claude-sonnet-4-6": "Sonnet 4.6",
      "claude-sonnet-4-5": "Sonnet 4.5",
      "claude-sonnet-4": "Sonnet 4",
      "claude-haiku-4-5": "Haiku 4.5",
      "claude-3-7-sonnet": "Sonnet 3.7",
      "claude-3-5-sonnet": "Sonnet 3.5",
      "claude-3-5-haiku": "Haiku 3.5"
    };
    modelDisplayEntries3 = Object.entries(modelDisplayNames4).sort((a, b) => b[0].length - a[0].length);
    toolNameMap7 = {
      readFile: "Read",
      read_file: "Read",
      writeFile: "Edit",
      write_file: "Edit",
      editFile: "Edit",
      edit_file: "Edit",
      createFile: "Write",
      create_file: "Write",
      deleteFile: "Delete",
      listDir: "LS",
      list_dir: "LS",
      openFolders: "LS",
      runCommand: "Bash",
      run_command: "Bash",
      searchFiles: "Grep",
      search_files: "Grep",
      findFiles: "Glob",
      find_files: "Glob",
      webSearch: "WebSearch",
      web_search: "WebSearch"
    };
    kiro = createKiroProvider();
  }
});

// src/providers/kimi.ts
import { createHash as createHash2 } from "crypto";
import { readdir as readdir11, readFile as readFile13, stat as stat13 } from "fs/promises";
import { basename as basename9, dirname as dirname5, join as join20 } from "path";
import { homedir as homedir17 } from "os";
function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function stringField2(obj, key) {
  const value = obj?.[key];
  return typeof value === "string" ? value : void 0;
}
function numericField(obj, ...keys) {
  for (const key of keys) {
    const raw = obj[key];
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  }
  return 0;
}
function getShareDir(overrideDir) {
  return overrideDir ?? process.env["KIMI_SHARE_DIR"] ?? join20(homedir17(), ".kimi");
}
function md5(text) {
  return createHash2("md5").update(text, "utf-8").digest("hex");
}
function projectNameFromPath(pathValue) {
  const cleaned = pathValue.replace(/\/+$/, "");
  return basename9(cleaned) || cleaned || "kimi";
}
async function loadProjectNames(shareDir) {
  const projects = /* @__PURE__ */ new Map();
  const raw = await readFile13(join20(shareDir, "kimi.json"), "utf-8").catch(() => null);
  if (!raw) return projects;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return projects;
  }
  const workDirs = asObject(data)?.["work_dirs"];
  if (!Array.isArray(workDirs)) return projects;
  for (const entry of workDirs) {
    const obj = asObject(entry);
    const pathValue = stringField2(obj, "path");
    if (!pathValue) continue;
    const hash = md5(pathValue);
    const project = projectNameFromPath(pathValue);
    projects.set(hash, project);
    const kaos = stringField2(obj, "kaos");
    if (kaos && kaos !== "local") projects.set(`${kaos}_${hash}`, project);
  }
  return projects;
}
function parseTomlString(raw) {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith('"')) {
    const match2 = value.match(/^"((?:[^"\\]|\\.)*)"/);
    if (!match2) return null;
    try {
      return JSON.parse(`"${match2[1]}"`);
    } catch {
      return match2[1] ?? null;
    }
  }
  if (value.startsWith("'")) {
    const match2 = value.match(/^'([^']*)'/);
    return match2?.[1] ?? null;
  }
  const match = value.match(/^([^#\s]+)/);
  return match?.[1] ?? null;
}
function parseDefaultModelKey(configToml) {
  for (const line of configToml.split("\n")) {
    const match = line.match(/^\s*default_model\s*=\s*(.+)$/);
    if (!match) continue;
    return parseTomlString(match[1]);
  }
  return null;
}
function parseModelSectionName(line) {
  const match = line.trim().match(/^\[models\.(?:"([^"]+)"|'([^']+)'|([^\]]+))\]$/);
  if (!match) return null;
  return (match[1] ?? match[2] ?? match[3] ?? "").trim() || null;
}
function parseModelIdForKey(configToml, modelKey) {
  let inSection = false;
  for (const line of configToml.split("\n")) {
    const section = parseModelSectionName(line);
    if (section !== null) {
      inSection = section === modelKey;
      continue;
    }
    if (!inSection) continue;
    if (/^\s*\[/.test(line)) {
      inSection = false;
      continue;
    }
    const match = line.match(/^\s*model\s*=\s*(.+)$/);
    if (!match) continue;
    return parseTomlString(match[1]);
  }
  return null;
}
async function getConfiguredModel(shareDir) {
  const envModel = process.env["KIMI_MODEL_NAME"]?.trim();
  if (envModel) return envModel;
  const raw = await readFile13(join20(shareDir, "config.toml"), "utf-8").catch(() => null);
  if (!raw) return "kimi-auto";
  const defaultModel = parseDefaultModelKey(raw);
  if (!defaultModel) return "kimi-auto";
  return parseModelIdForKey(raw, defaultModel) ?? defaultModel;
}
function parseJsonObject(text) {
  if (!text) return null;
  try {
    return asObject(JSON.parse(text));
  } catch {
    return null;
  }
}
function extractUserText(value) {
  if (typeof value === "string") return value.slice(0, 500);
  if (!Array.isArray(value)) return "";
  return value.map((part) => stringField2(asObject(part), "text") ?? "").filter(Boolean).join(" ").slice(0, 500);
}
function timestampToIso(value) {
  if (typeof value === "string") return value;
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const millis = value > 1e12 ? value : value * 1e3;
  const date = new Date(millis);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}
function extractEnvelope(record) {
  const message = asObject(record["message"]);
  const envelope = message ?? record;
  const type = stringField2(envelope, "type");
  const payload = asObject(envelope["payload"]);
  if (!type || !payload) return null;
  return { type, payload, timestamp: timestampToIso(record["timestamp"]) };
}
function extractUsage(payload) {
  const usage = asObject(payload["token_usage"]) ?? asObject(payload["usage"]);
  if (!usage) return null;
  const cacheReadInputTokens = numericField(usage, "input_cache_read", "cache_read_input_tokens", "cached_input_tokens");
  const cacheCreationInputTokens = numericField(usage, "input_cache_creation", "cache_creation_input_tokens");
  let inputTokens = numericField(usage, "input_other", "input_tokens");
  if (inputTokens === 0) {
    const totalInput = numericField(usage, "input");
    inputTokens = Math.max(0, totalInput - cacheReadInputTokens - cacheCreationInputTokens);
  }
  const outputTokens = numericField(usage, "output", "output_tokens");
  if (inputTokens === 0 && outputTokens === 0 && cacheReadInputTokens === 0 && cacheCreationInputTokens === 0) {
    return null;
  }
  return { inputTokens, outputTokens, cacheReadInputTokens, cacheCreationInputTokens };
}
function extractTool(payload) {
  const fn = asObject(payload["function"]);
  const rawName = stringField2(fn, "name") ?? stringField2(payload, "name");
  if (!rawName) return null;
  const tool = toolNameMap8[rawName] ?? rawName;
  const argsText = stringField2(fn, "arguments") ?? stringField2(payload, "arguments");
  const args = parseJsonObject(argsText);
  const command = stringField2(args, "command");
  const bashCommands = tool === "Bash" && command ? extractBashCommands(command) : [];
  return { tool, bashCommands };
}
function createParser7(source, shareDir, seenKeys) {
  return {
    async *parse() {
      const configuredModel = await getConfiguredModel(shareDir);
      const tools = /* @__PURE__ */ new Set();
      const bashCommands = /* @__PURE__ */ new Set();
      let currentUserMessage = "";
      const sessionId = basename9(dirname5(source.path));
      let index = 0;
      for await (const line of readSessionLines(source.path)) {
        if (!line.trim()) continue;
        let record = null;
        try {
          record = asObject(JSON.parse(line));
        } catch {
          continue;
        }
        if (!record) continue;
        const envelope = extractEnvelope(record);
        if (!envelope || envelope.type === "metadata") continue;
        if (envelope.type === "TurnBegin" || envelope.type === "SteerInput") {
          currentUserMessage = extractUserText(envelope.payload["user_input"]);
          continue;
        }
        if (envelope.type === "TurnEnd") {
          currentUserMessage = "";
          tools.clear();
          bashCommands.clear();
          continue;
        }
        if (envelope.type === "ToolCall" || envelope.type === "ToolCallRequest") {
          const extracted = extractTool(envelope.payload);
          if (!extracted) continue;
          tools.add(extracted.tool);
          for (const command of extracted.bashCommands) bashCommands.add(command);
          continue;
        }
        if (envelope.type !== "StatusUpdate") continue;
        const usage = extractUsage(envelope.payload);
        if (!usage) continue;
        const rawMessageId = stringField2(envelope.payload, "message_id");
        const dedupKey = `kimi:${sessionId}:${rawMessageId ?? index}`;
        index++;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);
        const model = stringField2(envelope.payload, "model") ?? stringField2(envelope.payload, "model_name") ?? configuredModel;
        const costUSD = calculateCost(
          model,
          usage.inputTokens,
          usage.outputTokens,
          usage.cacheCreationInputTokens,
          usage.cacheReadInputTokens,
          0
        );
        yield {
          provider: "kimi",
          model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheCreationInputTokens: usage.cacheCreationInputTokens,
          cacheReadInputTokens: usage.cacheReadInputTokens,
          cachedInputTokens: usage.cacheReadInputTokens,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools: [...tools],
          bashCommands: [...bashCommands],
          timestamp: envelope.timestamp,
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: currentUserMessage,
          sessionId
        };
        tools.clear();
        bashCommands.clear();
      }
    }
  };
}
async function addWireSource(sources, filePath, project) {
  const s = await stat13(filePath).catch(() => null);
  if (!s?.isFile()) return;
  sources.push({ path: filePath, project, provider: "kimi" });
}
function createKimiProvider(overrideDir) {
  const shareDir = getShareDir(overrideDir);
  return {
    name: "kimi",
    displayName: "Kimi",
    modelDisplayName(model) {
      return getShortModelName(model);
    },
    toolDisplayName(rawTool) {
      return toolNameMap8[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      const sources = [];
      const sessionsRoot = join20(shareDir, "sessions");
      const projectNames = await loadProjectNames(shareDir);
      const workDirs = await readdir11(sessionsRoot, { withFileTypes: true }).catch(() => []);
      for (const workDir of workDirs) {
        if (!workDir.isDirectory()) continue;
        const project = projectNames.get(workDir.name) ?? workDir.name;
        const workDirPath = join20(sessionsRoot, workDir.name);
        const sessionDirs = await readdir11(workDirPath, { withFileTypes: true }).catch(() => []);
        for (const sessionDir of sessionDirs) {
          if (!sessionDir.isDirectory()) continue;
          const sessionPath = join20(workDirPath, sessionDir.name);
          await addWireSource(sources, join20(sessionPath, "wire.jsonl"), project);
          const subagentsPath = join20(sessionPath, "subagents");
          const subagents = await readdir11(subagentsPath, { withFileTypes: true }).catch(() => []);
          for (const subagent of subagents) {
            if (!subagent.isDirectory()) continue;
            await addWireSource(sources, join20(subagentsPath, subagent.name, "wire.jsonl"), project);
          }
        }
      }
      return sources;
    },
    createSessionParser(source, seenKeys) {
      return createParser7(source, shareDir, seenKeys);
    }
  };
}
var toolNameMap8, kimi;
var init_kimi = __esm({
  "src/providers/kimi.ts"() {
    "use strict";
    init_bash_utils();
    init_fs_utils();
    init_models();
    toolNameMap8 = {
      Shell: "Bash",
      Bash: "Bash",
      bash: "Bash",
      ReadFile: "Read",
      ReadMediaFile: "Read",
      WriteFile: "Write",
      StrReplaceFile: "Edit",
      Grep: "Grep",
      Glob: "Glob",
      SearchWeb: "WebSearch",
      FetchURL: "WebFetch",
      Agent: "Agent",
      AgentTool: "Agent",
      TaskList: "Agent",
      TaskOutput: "Agent",
      TaskStop: "Agent",
      AskUserQuestion: "AskUser",
      SetTodoList: "TodoWrite",
      Think: "Think",
      EnterPlanMode: "EnterPlanMode",
      ExitPlanMode: "ExitPlanMode",
      SendDMail: "DMail"
    };
    kimi = createKimiProvider();
  }
});

// src/providers/mistral-vibe.ts
import { readdir as readdir12, stat as stat14 } from "fs/promises";
import { basename as basename10, join as join21 } from "path";
import { homedir as homedir18 } from "os";
function getMistralVibeSessionsDir(override) {
  if (override) return override;
  const configuredHome = process.env["VIBE_HOME"];
  const vibeHome = configuredHome ? expandHome2(configuredHome) : join21(homedir18(), ".vibe");
  return join21(vibeHome, "logs", "session");
}
function expandHome2(path) {
  if (path === "~") return homedir18();
  if (path.startsWith("~/")) return join21(homedir18(), path.slice(2));
  return path;
}
async function isFile(path) {
  const s = await stat14(path).catch(() => null);
  return Boolean(s?.isFile());
}
async function isDirectory(path) {
  const s = await stat14(path).catch(() => null);
  return Boolean(s?.isDirectory());
}
async function hasSessionFiles(dir) {
  const [hasMetadata, hasMessages] = await Promise.all([
    isFile(join21(dir, METADATA_FILENAME)),
    isFile(join21(dir, MESSAGES_FILENAME))
  ]);
  return hasMetadata && hasMessages;
}
async function readJsonFile(path) {
  const raw = await readSessionFile(path);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}
async function discoverSessionDirs(root) {
  const sessionDirs = [];
  let entries;
  try {
    entries = (await readdir12(root)).sort();
  } catch {
    return sessionDirs;
  }
  for (const entry of entries) {
    const dir = join21(root, entry);
    if (!await isDirectory(dir)) continue;
    if (await hasSessionFiles(dir)) {
      sessionDirs.push(dir);
    }
    const agentsDir = join21(dir, "agents");
    if (!await isDirectory(agentsDir)) continue;
    let agentEntries;
    try {
      agentEntries = (await readdir12(agentsDir)).sort();
    } catch {
      continue;
    }
    for (const agentEntry of agentEntries) {
      const agentDir = join21(agentsDir, agentEntry);
      if (await isDirectory(agentDir) && await hasSessionFiles(agentDir)) {
        sessionDirs.push(agentDir);
      }
    }
  }
  return sessionDirs;
}
function activeModelConfig(metadata) {
  const activeModel = metadata.config?.active_model;
  const models = metadata.config?.models;
  if (!activeModel || !Array.isArray(models)) return null;
  return models.find((m) => m.alias === activeModel || m.name === activeModel) ?? null;
}
function resolveModel3(metadata) {
  const activeModel = metadata.config?.active_model;
  if (activeModel) return activeModel;
  const configured = activeModelConfig(metadata);
  return configured?.alias ?? configured?.name ?? DEFAULT_MODEL;
}
function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}
function calculateSessionCost(metadata, model, inputTokens, outputTokens) {
  const stats = metadata.stats ?? {};
  const sessionCost = safeNumber(stats.session_cost);
  if (sessionCost > 0) return sessionCost;
  const configured = activeModelConfig(metadata);
  const inputPrice = safeNumber(stats.input_price_per_million) || safeNumber(configured?.input_price);
  const outputPrice = safeNumber(stats.output_price_per_million) || safeNumber(configured?.output_price);
  if (inputPrice > 0 || outputPrice > 0) {
    return inputTokens / 1e6 * inputPrice + outputTokens / 1e6 * outputPrice;
  }
  return calculateCost(model, inputTokens, outputTokens, 0, 0, 0);
}
function normalizeContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    }).filter(Boolean).join(" ");
  }
  return "";
}
function parseToolArguments(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function extractMessageTools(message) {
  const tools = [];
  const bashCommands = [];
  if (message.role !== "assistant") return { tools, bashCommands };
  for (const toolCall of message.tool_calls ?? []) {
    const rawName = toolCall.function?.name;
    if (!rawName) continue;
    const mappedName = toolNameMap9[rawName] ?? rawName;
    tools.push(mappedName);
    if (mappedName !== "Bash") continue;
    const args = parseToolArguments(toolCall.function?.arguments);
    const command = args["command"];
    if (typeof command === "string") {
      bashCommands.push(...extractBashCommands(command));
    }
  }
  return {
    tools: [...new Set(tools)],
    bashCommands: [...new Set(bashCommands)]
  };
}
function extractTools(messages) {
  const tools = [];
  const bashCommands = [];
  for (const message of messages) {
    const extracted = extractMessageTools(message);
    tools.push(...extracted.tools);
    bashCommands.push(...extracted.bashCommands);
  }
  return {
    tools: [...new Set(tools)],
    bashCommands: [...new Set(bashCommands)]
  };
}
async function readMessages(path) {
  const messages = [];
  for await (const line of readSessionLines(path)) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === "object") messages.push(parsed);
    } catch {
      continue;
    }
  }
  return messages;
}
function firstUserMessage(messages, fallback) {
  for (const message of messages) {
    if (message.role !== "user") continue;
    const text = normalizeContent(message.content).trim();
    if (text) return text.slice(0, 500);
  }
  return (fallback ?? "").slice(0, 500);
}
function allocateInteger(total, index, count) {
  if (count <= 1) return total;
  const base = Math.floor(total / count);
  const remainder = total % count;
  return base + (index < remainder ? 1 : 0);
}
function allocateCost(total, count) {
  return count <= 1 ? total : total / count;
}
function createParser8(source, seenKeys) {
  return {
    async *parse() {
      const metadataPath = join21(source.path, METADATA_FILENAME);
      const messagesPath = join21(source.path, MESSAGES_FILENAME);
      const metadata = await readJsonFile(metadataPath);
      if (!metadata) return;
      const stats = metadata.stats ?? {};
      const inputTokens = safeNumber(stats.session_prompt_tokens);
      const outputTokens = safeNumber(stats.session_completion_tokens);
      if (inputTokens === 0 && outputTokens === 0) return;
      const sessionId = metadata.session_id || basename10(source.path);
      const messages = await readMessages(messagesPath);
      const model = resolveModel3(metadata);
      const costUSD = calculateSessionCost(metadata, model, inputTokens, outputTokens);
      const assistantMessages = messages.filter((m) => m.role === "assistant");
      const fallbackTimestamp = metadata.end_time ?? metadata.start_time ?? "";
      if (assistantMessages.length === 0) {
        const deduplicationKey = `mistral-vibe:${sessionId}`;
        if (seenKeys.has(deduplicationKey)) return;
        seenKeys.add(deduplicationKey);
        const { tools, bashCommands } = extractTools(messages);
        yield {
          provider: "mistral-vibe",
          model,
          inputTokens,
          outputTokens,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
          cachedInputTokens: 0,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools,
          bashCommands,
          timestamp: fallbackTimestamp,
          speed: "standard",
          deduplicationKey,
          userMessage: firstUserMessage(messages, metadata.title),
          sessionId
        };
        return;
      }
      let currentUserMessage = (metadata.title ?? "").slice(0, 500);
      let turnOrdinal = 0;
      let currentTurnId = `${sessionId}:prelude`;
      let assistantOrdinal = 0;
      for (const message of messages) {
        if (message.role === "user") {
          const text = normalizeContent(message.content).trim();
          if (text) currentUserMessage = text.slice(0, 500);
          currentTurnId = `${sessionId}:turn-${turnOrdinal++}`;
          continue;
        }
        if (message.role !== "assistant") continue;
        const messageKey = message.message_id || `idx-${assistantOrdinal}`;
        const deduplicationKey = `mistral-vibe:${sessionId}:${messageKey}`;
        const allocationIndex = assistantOrdinal;
        assistantOrdinal++;
        if (seenKeys.has(deduplicationKey)) continue;
        seenKeys.add(deduplicationKey);
        const { tools, bashCommands } = extractMessageTools(message);
        yield {
          provider: "mistral-vibe",
          model,
          inputTokens: allocateInteger(inputTokens, allocationIndex, assistantMessages.length),
          outputTokens: allocateInteger(outputTokens, allocationIndex, assistantMessages.length),
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
          cachedInputTokens: 0,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD: allocateCost(costUSD, assistantMessages.length),
          tools,
          bashCommands,
          timestamp: message.timestamp ?? fallbackTimestamp,
          speed: "standard",
          deduplicationKey,
          turnId: currentTurnId,
          userMessage: currentUserMessage,
          sessionId
        };
      }
    }
  };
}
function createMistralVibeProvider(sessionsDir) {
  const dir = getMistralVibeSessionsDir(sessionsDir);
  return {
    name: "mistral-vibe",
    displayName: "Mistral Vibe",
    modelDisplayName(model) {
      return modelDisplayNames5[model] ?? model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap9[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      const dirs = await discoverSessionDirs(dir);
      const sources = [];
      for (const sessionDir of dirs) {
        const metadata = await readJsonFile(join21(sessionDir, METADATA_FILENAME));
        if (!metadata) continue;
        const cwd = metadata.environment?.working_directory;
        sources.push({
          path: sessionDir,
          project: cwd ? basename10(cwd) : basename10(sessionDir),
          provider: "mistral-vibe"
        });
      }
      return sources;
    },
    createSessionParser(source, seenKeys) {
      return createParser8(source, seenKeys);
    }
  };
}
var METADATA_FILENAME, MESSAGES_FILENAME, DEFAULT_MODEL, modelDisplayNames5, toolNameMap9, mistralVibe;
var init_mistral_vibe = __esm({
  "src/providers/mistral-vibe.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_bash_utils();
    METADATA_FILENAME = "meta.json";
    MESSAGES_FILENAME = "messages.jsonl";
    DEFAULT_MODEL = "mistral-medium-3.5";
    modelDisplayNames5 = {
      "mistral-medium-3.5": "Mistral Medium 3.5",
      "mistral-vibe-cli-latest": "Mistral Vibe CLI",
      "devstral-small": "Devstral Small",
      "devstral-small-latest": "Devstral Small",
      devstral: "Devstral",
      local: "Local"
    };
    toolNameMap9 = {
      bash: "Bash",
      read_file: "Read",
      write_file: "Write",
      search_replace: "Edit",
      grep: "Grep",
      task: "Agent",
      todo: "TodoWrite",
      skill: "Skill",
      web_fetch: "WebFetch",
      web_search: "WebSearch",
      ask_user_question: "AskUser",
      exit_plan_mode: "ExitPlanMode"
    };
    mistralVibe = createMistralVibeProvider();
  }
});

// src/providers/openclaw.ts
import { readdir as readdir13, readFile as readFile14 } from "fs/promises";
import { basename as basename11, join as join22 } from "path";
import { homedir as homedir19 } from "os";
function getOpenClawDirs() {
  const home = homedir19();
  return [
    join22(home, ".openclaw", "agents"),
    join22(home, ".clawdbot", "agents"),
    join22(home, ".moltbot", "agents"),
    join22(home, ".moldbot", "agents")
  ];
}
function extractTools2(content) {
  const tools = [];
  const bashCommands = [];
  if (!content) return { tools, bashCommands };
  for (const block of content) {
    if ((block.type === "tool_use" || block.type === "toolCall") && block.name) {
      const mapped = toolNameMap10[block.name] ?? block.name;
      tools.push(mapped);
      if (mapped === "Bash" && block.arguments && typeof block.arguments.command === "string") {
        bashCommands.push(...extractBashCommands(block.arguments.command));
      }
    }
  }
  return { tools, bashCommands };
}
function createParser9(source, seenKeys) {
  return {
    async *parse() {
      const raw = await readSessionFile(source.path);
      if (raw === null) return;
      const lines = raw.split("\n").filter((l) => l.trim());
      let sessionId = "";
      let sessionTimestamp = "";
      let currentModel = "";
      const calls = [];
      let pendingUserMessage = "";
      for (const line of lines) {
        let entry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }
        if (entry.type === "session") {
          sessionId = entry.id ?? basename11(source.path, ".jsonl");
          sessionTimestamp = entry.timestamp ?? "";
          continue;
        }
        if (entry.type === "model_change") {
          currentModel = entry.modelId ?? currentModel;
          continue;
        }
        if (entry.type === "custom" && entry.customType === "model-snapshot") {
          currentModel = entry.data?.modelId ?? currentModel;
          continue;
        }
        if (entry.type !== "message" || !entry.message) continue;
        const msg = entry.message;
        if (msg.role === "user") {
          if (!pendingUserMessage && Array.isArray(msg.content)) {
            const textBlock = msg.content.find((c) => c.type === "text" && c.text);
            pendingUserMessage = (textBlock?.text ?? "").slice(0, 500);
          }
          continue;
        }
        if (msg.role !== "assistant") continue;
        const model = msg.model ?? currentModel;
        if (msg.usage) {
          const { tools, bashCommands } = extractTools2(msg.content);
          calls.push({
            model,
            usage: msg.usage,
            tools,
            bashCommands,
            timestamp: entry.timestamp ?? sessionTimestamp,
            userMessage: pendingUserMessage,
            dedupId: entry.id ?? ""
          });
          pendingUserMessage = "";
        }
      }
      if (!sessionId) sessionId = basename11(source.path, ".jsonl");
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        const dedupKey = `openclaw:${sessionId}:${call.dedupId || i}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);
        const u = call.usage;
        const costFromProvider = u.cost?.total ?? 0;
        const costUSD = costFromProvider > 0 ? costFromProvider : calculateCost(call.model, u.input, u.output, u.cacheWrite, u.cacheRead, 0);
        const ts = new Date(call.timestamp);
        if (isNaN(ts.getTime()) || ts.getTime() < 1e12) continue;
        yield {
          provider: "openclaw",
          model: call.model || "openclaw-auto",
          inputTokens: u.input,
          outputTokens: u.output,
          cacheCreationInputTokens: u.cacheWrite,
          cacheReadInputTokens: u.cacheRead,
          cachedInputTokens: u.cacheRead,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools: [...new Set(call.tools)],
          bashCommands: [...new Set(call.bashCommands)],
          timestamp: ts.toISOString(),
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: call.userMessage,
          sessionId
        };
      }
    }
  };
}
async function discoverInDir(agentsDir) {
  const sources = [];
  let agentDirs;
  try {
    const entries = await readdir13(agentsDir, { withFileTypes: true });
    agentDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return sources;
  }
  for (const agent of agentDirs) {
    const sessionsDir = join22(agentsDir, agent, "sessions");
    let indexData = {};
    try {
      const indexRaw = await readFile14(join22(sessionsDir, "sessions.json"), "utf-8");
      indexData = JSON.parse(indexRaw);
    } catch {
    }
    const seenFiles = /* @__PURE__ */ new Set();
    for (const entry of Object.values(indexData)) {
      if (entry.sessionFile) {
        seenFiles.add(entry.sessionFile);
        sources.push({ path: entry.sessionFile, project: agent, provider: "openclaw" });
      } else if (entry.sessionId) {
        const filePath = join22(sessionsDir, `${entry.sessionId}.jsonl`);
        seenFiles.add(filePath);
        sources.push({ path: filePath, project: agent, provider: "openclaw" });
      }
    }
    try {
      const files = await readdir13(sessionsDir);
      for (const f of files) {
        if (!f.endsWith(".jsonl")) continue;
        const filePath = join22(sessionsDir, f);
        if (seenFiles.has(filePath)) continue;
        sources.push({ path: filePath, project: agent, provider: "openclaw" });
      }
    } catch {
    }
  }
  return sources;
}
function createOpenClawProvider(overrideDir) {
  return {
    name: "openclaw",
    displayName: "OpenClaw",
    modelDisplayName(model) {
      return model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap10[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      if (overrideDir) return discoverInDir(overrideDir);
      const all = [];
      for (const dir of getOpenClawDirs()) {
        const sessions = await discoverInDir(dir);
        all.push(...sessions);
      }
      return all;
    },
    createSessionParser(source, seenKeys) {
      return createParser9(source, seenKeys);
    }
  };
}
var toolNameMap10, openclaw;
var init_openclaw = __esm({
  "src/providers/openclaw.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_bash_utils();
    toolNameMap10 = {
      bash: "Bash",
      exec: "Bash",
      read: "Read",
      edit: "Edit",
      write: "Write",
      glob: "Glob",
      grep: "Grep",
      task: "Agent",
      dispatch_agent: "Agent",
      fetch: "WebFetch",
      search: "WebSearch",
      todo: "TodoWrite",
      patch: "Patch"
    };
    openclaw = createOpenClawProvider();
  }
});

// src/providers/pi.ts
import { readdir as readdir14, stat as stat15 } from "fs/promises";
import { basename as basename12, join as join23 } from "path";
import { homedir as homedir20 } from "os";
function getPiSessionsDir(override) {
  return override ?? join23(homedir20(), ".pi", "agent", "sessions");
}
function getOmpSessionsDir(override) {
  return override ?? join23(homedir20(), ".omp", "agent", "sessions");
}
async function readFirstEntry(filePath) {
  const content = await readSessionFile(filePath);
  if (content === null) return null;
  const line = content.split("\n")[0];
  if (!line?.trim()) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
async function discoverSessionsInDir3(sessionsDir, providerName) {
  const sources = [];
  let projectDirs;
  try {
    projectDirs = await readdir14(sessionsDir);
  } catch {
    return sources;
  }
  for (const dirName of projectDirs) {
    const dirPath = join23(sessionsDir, dirName);
    const dirStat = await stat15(dirPath).catch(() => null);
    if (!dirStat?.isDirectory()) continue;
    let files;
    try {
      files = await readdir14(dirPath);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      const filePath = join23(dirPath, file);
      const fileStat = await stat15(filePath).catch(() => null);
      if (!fileStat?.isFile()) continue;
      const first = await readFirstEntry(filePath);
      if (!first || first.type !== "session") continue;
      const cwd = first.cwd ?? dirName;
      sources.push({ path: filePath, project: basename12(cwd), provider: providerName });
    }
  }
  return sources;
}
function createParser10(source, seenKeys) {
  return {
    async *parse() {
      const content = await readSessionFile(source.path);
      if (content === null) return;
      const lines = content.split("\n").filter((l) => l.trim());
      let sessionId = basename12(source.path, ".jsonl");
      let pendingUserMessage = "";
      for (const [lineIdx, line] of lines.entries()) {
        let entry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }
        if (entry.type === "session") {
          sessionId = entry.id ?? sessionId;
          continue;
        }
        if (entry.type !== "message") continue;
        const msg = entry.message;
        if (!msg) continue;
        if (msg.role === "user") {
          const texts = (msg.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").filter(Boolean);
          if (texts.length > 0) pendingUserMessage = texts.join(" ");
          continue;
        }
        if (msg.role !== "assistant" || !msg.usage) continue;
        const input = msg.usage.input ?? 0;
        const output = msg.usage.output ?? 0;
        const cacheRead = msg.usage.cacheRead ?? 0;
        const cacheWrite = msg.usage.cacheWrite ?? 0;
        if (input === 0 && output === 0) continue;
        const model = msg.model ?? "gpt-5";
        const responseId = msg.responseId ?? "";
        const dedupKey = `${source.provider}:${source.path}:${responseId || entry.id || entry.timestamp || String(lineIdx)}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);
        const toolCalls2 = (msg.content ?? []).filter((c) => c.type === "toolCall" && c.name);
        const tools = toolCalls2.map((c) => toolNameMap11[c.name] ?? c.name);
        const bashCommands = toolCalls2.filter((c) => c.name === "bash").flatMap((c) => {
          const cmd = c.arguments?.["command"];
          return typeof cmd === "string" ? extractBashCommands(cmd) : [];
        });
        const costUSD = calculateCost(model, input, output, cacheWrite, cacheRead, 0);
        const timestamp = entry.timestamp ?? "";
        yield {
          provider: source.provider,
          model,
          inputTokens: input,
          outputTokens: output,
          cacheCreationInputTokens: cacheWrite,
          cacheReadInputTokens: cacheRead,
          cachedInputTokens: cacheRead,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools,
          bashCommands,
          timestamp,
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: pendingUserMessage,
          sessionId
        };
        pendingUserMessage = "";
      }
    }
  };
}
function createPiProvider(sessionsDir) {
  const dir = getPiSessionsDir(sessionsDir);
  return {
    name: "pi",
    displayName: "Pi",
    modelDisplayName(model) {
      for (const [key, name] of modelDisplayEntries4) {
        if (model.startsWith(key)) return name;
      }
      return model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap11[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSessionsInDir3(dir, "pi");
    },
    createSessionParser(source, seenKeys) {
      return createParser10(source, seenKeys);
    }
  };
}
function createOmpProvider(sessionsDir) {
  const dir = getOmpSessionsDir(sessionsDir);
  return {
    name: "omp",
    displayName: "OMP",
    modelDisplayName(model) {
      for (const [key, name] of modelDisplayEntries4) {
        if (model.startsWith(key)) return name;
      }
      return model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap11[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSessionsInDir3(dir, "omp");
    },
    createSessionParser(source, seenKeys) {
      return createParser10(source, seenKeys);
    }
  };
}
var modelDisplayNames6, toolNameMap11, modelDisplayEntries4, pi, omp;
var init_pi = __esm({
  "src/providers/pi.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_bash_utils();
    modelDisplayNames6 = {
      "gpt-5.4": "GPT-5.4",
      "gpt-5.4-mini": "GPT-5.4 Mini",
      "gpt-5": "GPT-5",
      "gpt-4o": "GPT-4o",
      "gpt-4o-mini": "GPT-4o Mini"
    };
    toolNameMap11 = {
      bash: "Bash",
      read: "Read",
      edit: "Edit",
      write: "Write",
      glob: "Glob",
      grep: "Grep",
      task: "Agent",
      dispatch_agent: "Agent",
      fetch: "WebFetch",
      search: "WebSearch",
      todo: "TodoWrite",
      patch: "Patch"
    };
    modelDisplayEntries4 = Object.entries(modelDisplayNames6).sort((a, b) => b[0].length - a[0].length);
    pi = createPiProvider();
    omp = createOmpProvider();
  }
});

// src/providers/qwen.ts
import { readdir as readdir15, stat as stat16 } from "fs/promises";
import { join as join24 } from "path";
import { homedir as homedir21 } from "os";
function getQwenProjectsDir() {
  return process.env["QWEN_DATA_DIR"] ?? join24(homedir21(), ".qwen", "projects");
}
function projectNameFromDirName(dirName) {
  const parts = dirName.replace(/^-/, "").split("-");
  return parts[parts.length - 1] || dirName;
}
function extractTools3(parts) {
  const tools = [];
  const bashCommands = [];
  for (const part of parts) {
    if (part.functionCall?.name) {
      const mapped = toolNameMap12[part.functionCall.name] ?? part.functionCall.name;
      tools.push(mapped);
      if (mapped === "Bash" && part.functionCall.args && typeof part.functionCall.args["command"] === "string") {
        bashCommands.push(...extractBashCommands(part.functionCall.args["command"]));
      }
    }
  }
  return { tools, bashCommands };
}
function createParser11(source, seenKeys) {
  return {
    async *parse() {
      const raw = await readSessionFile(source.path);
      if (raw === null) return;
      const lines = raw.split("\n").filter((l) => l.trim());
      let pendingUserMessage = "";
      for (const line of lines) {
        let entry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }
        if (entry.type === "user" && entry.message) {
          const texts = (entry.message.parts ?? []).filter((p) => p.text && !p.thought).map((p) => p.text);
          if (texts.length > 0) {
            pendingUserMessage = texts.join(" ").slice(0, 500);
          }
          continue;
        }
        if (entry.type !== "assistant" || !entry.usageMetadata) continue;
        const usage = entry.usageMetadata;
        if (usage.promptTokenCount === 0 && usage.candidatesTokenCount === 0) continue;
        const dedupKey = `qwen:${entry.sessionId}:${entry.uuid}`;
        if (seenKeys.has(dedupKey)) continue;
        seenKeys.add(dedupKey);
        const model = entry.model || "qwen-auto";
        const { tools, bashCommands } = extractTools3(entry.message?.parts ?? []);
        const inputTokens = usage.promptTokenCount;
        const outputTokens = usage.candidatesTokenCount;
        const reasoningTokens = usage.thoughtsTokenCount ?? 0;
        const cachedTokens = usage.cachedContentTokenCount ?? 0;
        const costUSD = calculateCost(model, inputTokens, outputTokens + reasoningTokens, 0, cachedTokens, 0);
        yield {
          provider: "qwen",
          model,
          inputTokens,
          outputTokens,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: cachedTokens,
          cachedInputTokens: cachedTokens,
          reasoningTokens,
          webSearchRequests: 0,
          costUSD,
          tools: [...new Set(tools)],
          bashCommands: [...new Set(bashCommands)],
          timestamp: entry.timestamp || "",
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: pendingUserMessage,
          sessionId: entry.sessionId
        };
        pendingUserMessage = "";
      }
    }
  };
}
function createQwenProvider(overrideDir) {
  const projectsDir = overrideDir ?? getQwenProjectsDir();
  return {
    name: "qwen",
    displayName: "Qwen",
    modelDisplayName(model) {
      return model;
    },
    toolDisplayName(rawTool) {
      return toolNameMap12[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      const sources = [];
      let projectDirs;
      try {
        projectDirs = await readdir15(projectsDir);
      } catch {
        return sources;
      }
      for (const projDir of projectDirs) {
        const chatsDir = join24(projectsDir, projDir, "chats");
        const project = projectNameFromDirName(projDir);
        let chatFiles;
        try {
          chatFiles = await readdir15(chatsDir);
        } catch {
          continue;
        }
        for (const file of chatFiles) {
          if (!file.endsWith(".jsonl")) continue;
          const filePath = join24(chatsDir, file);
          const s = await stat16(filePath).catch(() => null);
          if (!s?.isFile()) continue;
          sources.push({ path: filePath, project, provider: "qwen" });
        }
      }
      return sources;
    },
    createSessionParser(source, seenKeys) {
      return createParser11(source, seenKeys);
    }
  };
}
var toolNameMap12, qwen;
var init_qwen = __esm({
  "src/providers/qwen.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_bash_utils();
    toolNameMap12 = {
      read_file: "Read",
      write_to_file: "Write",
      edit_file: "Edit",
      execute_command: "Bash",
      search_files: "Grep",
      list_files: "LS",
      list_directory: "LS",
      browser_action: "WebFetch",
      web_search: "WebSearch",
      ask_followup_question: "AskUser",
      attempt_completion: "Complete"
    };
    qwen = createQwenProvider();
  }
});

// src/providers/roo-code.ts
function createRooCodeProvider(overrideDir) {
  return {
    name: "roo-code",
    displayName: "Roo Code",
    modelDisplayName(model) {
      return model;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      return discoverClineTasks(EXTENSION_ID4, "roo-code", "Roo Code", overrideDir);
    },
    createSessionParser(source, seenKeys) {
      return createClineParser(source, seenKeys, "roo-code");
    }
  };
}
var EXTENSION_ID4, rooCode;
var init_roo_code = __esm({
  "src/providers/roo-code.ts"() {
    "use strict";
    init_vscode_cline_parser();
    EXTENSION_ID4 = "rooveterinaryinc.roo-cline";
    rooCode = createRooCodeProvider();
  }
});

// src/providers/antigravity.ts
var antigravity_exports = {};
__export(antigravity_exports, {
  antigravity: () => antigravity,
  antigravityAppDataDirFromSourcePath: () => antigravityAppDataDirFromSourcePath,
  antigravityCascadeIdFromPath: () => antigravityCascadeIdFromPath,
  createAntigravityProvider: () => createAntigravityProvider,
  discoverAntigravitySessionSources: () => discoverAntigravitySessionSources,
  extractAntigravityAppDataDirFromLine: () => extractAntigravityAppDataDirFromLine,
  extractAntigravityGeneratorMetadata: () => extractAntigravityGeneratorMetadata,
  extractAntigravityModelMap: () => extractAntigravityModelMap,
  flushAntigravityCache: () => flushAntigravityCache,
  getAntigravityStatusLineEventsPath: () => getAntigravityStatusLineEventsPath,
  isAntigravityStatusLineEventsPath: () => isAntigravityStatusLineEventsPath,
  parseAntigravityServerInfo: () => parseAntigravityServerInfo,
  parseAntigravityServerInfoFromLine: () => parseAntigravityServerInfoFromLine,
  recordAntigravityStatusLinePayload: () => recordAntigravityStatusLinePayload,
  shouldReparseAntigravitySource: () => shouldReparseAntigravitySource,
  snapshotAntigravityStatusLinePayload: () => snapshotAntigravityStatusLinePayload
});
import { readdir as readdir16, readFile as readFile15, mkdir as mkdir7, stat as stat17, open as open3, rename as rename4, unlink as unlink2 } from "fs/promises";
import { execFile } from "child_process";
import { randomBytes as randomBytes3 } from "crypto";
import { basename as basename14, join as join25 } from "path";
import { homedir as homedir22 } from "os";
import https from "https";
function getAgent() {
  if (!httpsAgent) httpsAgent = new https.Agent({ rejectUnauthorized: false });
  return httpsAgent;
}
function getCacheDir4() {
  return process.env["CODEBURN_CACHE_DIR"] ?? join25(homedir22(), ".cache", "codeburn");
}
function getCachePath3() {
  return join25(getCacheDir4(), "antigravity-results.json");
}
function getAntigravityStatusLineEventsPath() {
  return join25(getCacheDir4(), "antigravity-statusline.jsonl");
}
function execFileText(command, args, timeout = 3e3) {
  return new Promise((resolve5, reject) => {
    execFile(command, args, { encoding: "utf-8", timeout, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      if (err) reject(err);
      else resolve5(stdout);
    });
  });
}
function getFlagValue(line, names) {
  for (const name of names) {
    const match = line.match(new RegExp(`--${name}(?:=|\\s+)(?:"([^"]+)"|'([^']+)'|([^\\s]+))`, "i"));
    const value = match?.[1] ?? match?.[2] ?? match?.[3];
    if (value && !value.startsWith("--")) return value;
  }
  return null;
}
function isLikelyCsrfToken(value) {
  return value.length >= 16 && /^[A-Za-z0-9._~:/+=-]+$/.test(value);
}
function normalizeAppDataDir(value) {
  if (!value) return void 0;
  const normalized = value.replace(/\\/g, "/").toLowerCase();
  if (normalized.includes("antigravity-cli")) return "antigravity-cli";
  if (normalized.includes("antigravity")) return "antigravity";
  return void 0;
}
function extractAntigravityAppDataDirFromLine(line) {
  return normalizeAppDataDir(getFlagValue(line, APP_DATA_DIR_FLAGS));
}
function parseAntigravityServerCandidateFromLine(line) {
  const lower = line.toLowerCase();
  if (!lower.includes("language_server") || !lower.includes("antigravity")) return null;
  const rawPort = getFlagValue(line, SERVER_PORT_FLAGS);
  const csrfToken = getFlagValue(line, CSRF_TOKEN_FLAGS);
  if (!rawPort || !csrfToken) return null;
  if (!isLikelyCsrfToken(csrfToken)) return null;
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 0 || port > 65535) return null;
  return {
    port,
    csrfToken,
    appDataDir: extractAntigravityAppDataDirFromLine(line)
  };
}
function parseAntigravityServerInfoFromLine(line) {
  const candidate = parseAntigravityServerCandidateFromLine(line);
  return candidate ? { port: candidate.port, csrfToken: candidate.csrfToken } : null;
}
function parseAntigravityServerInfo(lines) {
  for (const line of lines) {
    const server = parseAntigravityServerInfoFromLine(line);
    if (server) return server;
  }
  return null;
}
function parseAntigravityServerCandidates(lines) {
  return lines.map(parseAntigravityServerCandidateFromLine).filter((server) => server !== null);
}
function extractAntigravityModelMap(resp) {
  if (!resp || typeof resp !== "object") return {};
  const data = resp;
  const models = data.response?.models ?? data.models;
  const map = {};
  if (!models) return map;
  for (const [key, info] of Object.entries(models)) {
    if (info && typeof info === "object" && typeof info.model === "string") {
      map[info.model] = key;
    }
  }
  return map;
}
function extractAntigravityGeneratorMetadata(resp) {
  if (!resp || typeof resp !== "object") return [];
  const data = resp;
  const metadata = data.response?.generatorMetadata ?? data.generatorMetadata;
  return Array.isArray(metadata) ? metadata : [];
}
async function loadCache2() {
  if (memCache2) return memCache2;
  try {
    const raw = await readFile15(getCachePath3(), "utf-8");
    const cache = JSON.parse(raw);
    if (cache.version === CACHE_VERSION && cache.cascades && typeof cache.cascades === "object") {
      memCache2 = cache;
      return cache;
    }
  } catch {
  }
  memCache2 = { version: CACHE_VERSION, cascades: {} };
  return memCache2;
}
async function flushCache(liveCascadeIds) {
  if (!memCache2) return;
  if (liveCascadeIds) {
    for (const id of Object.keys(memCache2.cascades)) {
      if (!liveCascadeIds.has(id)) {
        delete memCache2.cascades[id];
        cacheDirty = true;
      }
    }
  }
  if (!cacheDirty) return;
  try {
    const dir = getCacheDir4();
    await mkdir7(dir, { recursive: true });
    const finalPath = getCachePath3();
    const tempPath = `${finalPath}.${randomBytes3(8).toString("hex")}.tmp`;
    const handle = await open3(tempPath, "w", 384);
    try {
      await handle.writeFile(JSON.stringify(memCache2), { encoding: "utf-8" });
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await rename4(tempPath, finalPath);
    } catch {
      try {
        await unlink2(tempPath);
      } catch {
      }
    }
    cacheDirty = false;
  } catch {
  }
}
async function readProcessCommandLines() {
  if (process.platform === "win32") {
    const script = [
      "$ErrorActionPreference = 'SilentlyContinue'",
      "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like '*language_server*' -and $_.CommandLine -like '*antigravity*' } | ForEach-Object { $_.CommandLine }"
    ].join("; ");
    const output2 = await execFileText("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], 5e3);
    return output2.split(/\r?\n/);
  }
  const output = await execFileText("ps", ["-ww", "-eo", "args"]);
  return output.split("\n");
}
async function resolveEphemeralPort(csrfToken, appDataDir) {
  if (process.platform === "win32") return null;
  try {
    const processOutput = await execFileText("ps", ["-ww", "-eo", "pid=,args="]);
    let pid = "";
    for (const line of processOutput.split("\n")) {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) continue;
      const candidate = parseAntigravityServerCandidateFromLine(match[2]);
      if (!candidate) continue;
      if (candidate.csrfToken !== csrfToken) continue;
      if (appDataDir && candidate.appDataDir && candidate.appDataDir !== appDataDir) continue;
      pid = match[1];
      break;
    }
    if (!pid) return null;
    const lsofOutput = await execFileText("lsof", ["-a", "-i", "-P", "-n", "-p", pid]);
    for (const line of lsofOutput.split("\n")) {
      if (!line.includes("LISTEN")) continue;
      const match = line.match(/:(\d+)\s+\(LISTEN\)/);
      if (match) {
        const port = Number(match[1]);
        if (port > 0) return { port, csrfToken };
      }
    }
  } catch {
  }
  return null;
}
function antigravityAppDataDirFromSourcePath(path) {
  return path.replace(/\\/g, "/").toLowerCase().includes("/.gemini/antigravity-cli/") ? "antigravity-cli" : "antigravity";
}
async function detectServer(appDataDir = "antigravity") {
  if (cachedServers.has(appDataDir)) return cachedServers.get(appDataDir);
  try {
    const candidates = parseAntigravityServerCandidates(await readProcessCommandLines());
    const info = candidates.find((candidate) => candidate.appDataDir === appDataDir) ?? (appDataDir === "antigravity" ? candidates.find((candidate) => candidate.appDataDir === void 0) : void 0) ?? null;
    if (info && info.port > 0) {
      cachedServers.set(appDataDir, { port: info.port, csrfToken: info.csrfToken });
    } else if (info && info.port === 0) {
      cachedServers.set(appDataDir, await resolveEphemeralPort(info.csrfToken, appDataDir));
    } else {
      cachedServers.set(appDataDir, null);
    }
    return cachedServers.get(appDataDir);
  } catch {
  }
  cachedServers.set(appDataDir, null);
  return null;
}
async function rpc(server, method, body = {}) {
  return new Promise((resolve5, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: "127.0.0.1",
      port: server.port,
      path: `/exa.language_server_pb.LanguageServerService/${method}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Connect-Protocol-Version": "1",
        "X-Codeium-Csrf-Token": server.csrfToken,
        "Content-Length": Buffer.byteLength(data)
      },
      agent: getAgent(),
      timeout: RPC_TIMEOUT_MS
    }, (res) => {
      const chunks = [];
      let totalBytes = 0;
      res.on("data", (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          res.destroy();
          reject(new Error(`RPC ${method}: response too large`));
          return;
        }
        chunks.push(chunk);
      });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`RPC ${method}: HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve5(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
        } catch {
          reject(new Error(`RPC ${method}: invalid JSON`));
        }
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`RPC ${method}: timeout`));
    });
    req.write(data);
    req.end();
  });
}
async function getModelMap(server) {
  const cacheKey3 = `${server.port}:${server.csrfToken}`;
  const cachedModelMap = cachedModelMaps.get(cacheKey3);
  if (cachedModelMap) return cachedModelMap;
  try {
    const modelMap = extractAntigravityModelMap(await rpc(server, "GetAvailableModels"));
    cachedModelMaps.set(cacheKey3, modelMap);
    return modelMap;
  } catch {
  }
  cachedModelMaps.set(cacheKey3, {});
  return {};
}
function normalizePricingModel(model) {
  const stripped = model.replace(/-(high|medium|low|agent)$/, "");
  return PRICING_ALIASES[stripped] ?? stripped;
}
function parseFiniteToken(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
function usageSignature(event) {
  const u = event.usage;
  return [
    event.model,
    u.inputTokens,
    u.outputTokens,
    u.cacheCreationInputTokens,
    u.cacheReadInputTokens
  ].join(":");
}
function usageHasTokens(usage) {
  return usage.inputTokens > 0 || usage.outputTokens > 0 || usage.cacheCreationInputTokens > 0 || usage.cacheReadInputTokens > 0;
}
function usageIsMonotonic(current, previous) {
  return current.inputTokens >= previous.inputTokens && current.outputTokens >= previous.outputTokens && current.cacheCreationInputTokens >= previous.cacheCreationInputTokens && current.cacheReadInputTokens >= previous.cacheReadInputTokens;
}
function usageDelta(current, previous) {
  return {
    inputTokens: current.inputTokens - previous.inputTokens,
    outputTokens: current.outputTokens - previous.outputTokens,
    cacheCreationInputTokens: current.cacheCreationInputTokens - previous.cacheCreationInputTokens,
    cacheReadInputTokens: current.cacheReadInputTokens - previous.cacheReadInputTokens
  };
}
function antigravityCascadeIdFromPath(path) {
  return basename14(path).replace(/\.(pb|db)$/i, "");
}
function buildCallsFromGeneratorMetadata(cascadeId, metadata, modelMap) {
  const results = [];
  for (let i = 0; i < metadata.length; i++) {
    const entry = metadata[i];
    const usage = entry.chatModel?.usage;
    if (!usage) continue;
    const inputTokens = parseInt(usage.inputTokens ?? "0", 10);
    const outputTokens = parseInt(usage.outputTokens ?? "0", 10);
    const thinkingTokens = parseInt(usage.thinkingOutputTokens ?? "0", 10);
    const responseTokens = parseInt(usage.responseOutputTokens ?? "0", 10);
    if (inputTokens === 0 && outputTokens === 0) continue;
    const responseId = usage.responseId || String(i);
    const dedupKey = `antigravity:${cascadeId}:${responseId}`;
    const model = modelMap[usage.model] ?? usage.model;
    const pricingModel = normalizePricingModel(model);
    const timestamp = entry.chatModel?.chatStartMetadata?.createdAt ?? "";
    const costUSD = calculateCost(pricingModel, inputTokens, responseTokens + thinkingTokens, 0, 0, 0);
    results.push({
      provider: "antigravity",
      model,
      inputTokens,
      outputTokens: responseTokens,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      cachedInputTokens: 0,
      reasoningTokens: thinkingTokens,
      webSearchRequests: 0,
      costUSD,
      tools: [],
      bashCommands: [],
      timestamp,
      speed: "standard",
      deduplicationKey: dedupKey,
      userMessage: "",
      sessionId: cascadeId
    });
  }
  return results;
}
function isConversationFile(file, extensions) {
  const lowerFile = file.toLowerCase();
  return extensions.some((ext) => lowerFile.endsWith(ext));
}
function isAntigravityStatusLineEventsPath(path) {
  return path === getAntigravityStatusLineEventsPath();
}
async function discoverAntigravitySessionSources(roots = CONVERSATION_ROOTS) {
  const includeStatusLineEvents = roots === CONVERSATION_ROOTS;
  const sources = [];
  for (const root of roots) {
    let files;
    try {
      files = await readdir16(root.dir);
    } catch {
      continue;
    }
    for (const file of files.sort()) {
      if (!isConversationFile(file, root.extensions)) continue;
      const path = join25(root.dir, file);
      const s = await stat17(path).catch(() => null);
      if (!s?.isFile()) continue;
      sources.push({
        path,
        project: root.project,
        provider: "antigravity"
      });
    }
  }
  if (includeStatusLineEvents) {
    const statusLinePath = getAntigravityStatusLineEventsPath();
    const statusLineStat = await stat17(statusLinePath).catch(() => null);
    if (statusLineStat?.isFile()) {
      sources.push({
        path: statusLinePath,
        project: "antigravity-cli",
        provider: "antigravity"
      });
    }
  }
  return sources;
}
function parseStatusLinePayload(input) {
  if (!input || typeof input !== "object") return null;
  const payload = input;
  if (typeof payload.conversation_id !== "string" || payload.conversation_id.length === 0) return null;
  const usage = payload.context_window?.current_usage;
  if (!usage) return null;
  const event = {
    at: (/* @__PURE__ */ new Date()).toISOString(),
    conversationId: payload.conversation_id,
    sessionId: typeof payload.session_id === "string" ? payload.session_id : void 0,
    model: typeof payload.model === "string" ? payload.model : payload.model?.id ?? payload.model?.display_name ?? "unknown",
    usage: {
      inputTokens: parseFiniteToken(usage.input_tokens),
      outputTokens: parseFiniteToken(usage.output_tokens),
      cacheCreationInputTokens: parseFiniteToken(usage.cache_creation_input_tokens),
      cacheReadInputTokens: parseFiniteToken(usage.cache_read_input_tokens)
    }
  };
  const u = event.usage;
  if (u.inputTokens === 0 && u.outputTokens === 0 && u.cacheCreationInputTokens === 0 && u.cacheReadInputTokens === 0) {
    return null;
  }
  if (event.model === "unknown") return null;
  return event;
}
async function recordAntigravityStatusLinePayload(input) {
  const event = parseStatusLinePayload(input);
  if (!event) return false;
  const path = getAntigravityStatusLineEventsPath();
  await mkdir7(getCacheDir4(), { recursive: true, mode: 448 });
  const fd = await open3(path, "a", 384);
  try {
    await fd.appendFile(`${JSON.stringify(event)}
`, { encoding: "utf-8" });
  } finally {
    await fd.close();
  }
  return true;
}
function parseStatusLineEvent(input) {
  if (!input || typeof input !== "object") return null;
  const event = input;
  if (typeof event.at !== "string" || Number.isNaN(new Date(event.at).getTime())) return null;
  if (typeof event.conversationId !== "string" || event.conversationId.length === 0) return null;
  if (typeof event.model !== "string" || event.model.length === 0) return null;
  if (!event.usage || typeof event.usage !== "object") return null;
  const usage = {
    inputTokens: parseFiniteToken(event.usage.inputTokens),
    outputTokens: parseFiniteToken(event.usage.outputTokens),
    cacheCreationInputTokens: parseFiniteToken(event.usage.cacheCreationInputTokens),
    cacheReadInputTokens: parseFiniteToken(event.usage.cacheReadInputTokens)
  };
  if (usage.inputTokens === 0 && usage.outputTokens === 0 && usage.cacheCreationInputTokens === 0 && usage.cacheReadInputTokens === 0) return null;
  return {
    at: event.at,
    conversationId: event.conversationId,
    sessionId: typeof event.sessionId === "string" ? event.sessionId : void 0,
    model: event.model,
    usage
  };
}
function hasRpcCacheForConversation(seenKeys, conversationId) {
  const prefix = `antigravity:${conversationId}:`;
  for (const key of seenKeys) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}
async function parseStatusLineCalls(source, seenKeys) {
  const raw = await readFile15(source.path, "utf-8").catch(() => "");
  const runsByConversation = /* @__PURE__ */ new Map();
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    const event = parseStatusLineEvent(parsed);
    if (!event) continue;
    if (hasRpcCacheForConversation(seenKeys, event.conversationId)) continue;
    const signature = usageSignature(event);
    const runs = runsByConversation.get(event.conversationId) ?? [];
    const lastRun = runs.at(-1);
    if (lastRun?.signature === signature) {
      lastRun.count += 1;
      lastRun.event = event;
    } else {
      runs.push({ event, signature, count: 1 });
      runsByConversation.set(event.conversationId, runs);
    }
  }
  const results = [];
  for (const runs of runsByConversation.values()) {
    let turnIndex = 0;
    let previousSnapshotUsage = null;
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const isLastRun = i === runs.length - 1;
      if (run.count === 1 && !isLastRun) continue;
      const event = run.event;
      const signature = run.signature;
      const billableUsage = previousSnapshotUsage && usageIsMonotonic(event.usage, previousSnapshotUsage) ? usageDelta(event.usage, previousSnapshotUsage) : event.usage;
      previousSnapshotUsage = event.usage;
      if (!usageHasTokens(billableUsage)) continue;
      const dedupKey = `antigravity-statusline:${event.conversationId}:${turnIndex}:${signature}`;
      turnIndex += 1;
      if (seenKeys.has(dedupKey)) continue;
      const u = billableUsage;
      const costUSD = calculateCost(
        normalizePricingModel(event.model),
        u.inputTokens,
        u.outputTokens,
        u.cacheCreationInputTokens,
        u.cacheReadInputTokens,
        0
      );
      results.push({
        provider: "antigravity",
        model: event.model,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        cacheCreationInputTokens: u.cacheCreationInputTokens,
        cacheReadInputTokens: u.cacheReadInputTokens,
        cachedInputTokens: 0,
        // StatusLine current_usage exposes aggregate output tokens, not a
        // separate thinking/response split. Preserve the exact total instead
        // of inventing a breakdown.
        reasoningTokens: 0,
        webSearchRequests: 0,
        costUSD,
        tools: [],
        bashCommands: [],
        timestamp: event.at,
        speed: "standard",
        deduplicationKey: dedupKey,
        userMessage: "",
        sessionId: event.conversationId,
        project: source.project
      });
    }
  }
  return results;
}
function shouldReparseAntigravitySource(path, cachedTurnCount) {
  if (cachedTurnCount === 0) return true;
  return isAntigravityStatusLineEventsPath(path);
}
async function findCascadeSource(cascadeId) {
  const sources = await discoverAntigravitySessionSources();
  return sources.find(
    (source) => source.path.replace(/\\/g, "/").toLowerCase().includes("/.gemini/antigravity-cli/") && antigravityCascadeIdFromPath(source.path) === cascadeId
  ) ?? null;
}
async function snapshotAntigravityStatusLinePayload(input) {
  const event = parseStatusLinePayload(input);
  if (!event) return false;
  const cascadeId = event.conversationId;
  const source = await findCascadeSource(cascadeId);
  if (!source) return false;
  const s = await stat17(source.path).catch(() => null);
  if (!s) return false;
  const cache = await loadCache2();
  const cached = cache.cascades[cascadeId];
  if (cached && cached.mtimeMs === s.mtimeMs && cached.sizeBytes === s.size && cached.calls.length > 0) {
    return true;
  }
  const server = await detectServer("antigravity-cli");
  if (!server) return false;
  let metadata;
  try {
    const modelMap = await getModelMap(server);
    metadata = extractAntigravityGeneratorMetadata(
      await rpc(server, "GetCascadeTrajectoryGeneratorMetadata", { cascadeId })
    );
    cache.cascades[cascadeId] = {
      mtimeMs: s.mtimeMs,
      sizeBytes: s.size,
      calls: buildCallsFromGeneratorMetadata(cascadeId, metadata, modelMap)
    };
    cacheDirty = true;
    await flushCache();
    return cache.cascades[cascadeId].calls.length > 0;
  } catch {
    return false;
  }
}
function createParser12(source, seenKeys) {
  return {
    async *parse() {
      if (isAntigravityStatusLineEventsPath(source.path)) {
        for (const call of await parseStatusLineCalls(source, seenKeys)) {
          seenKeys.add(call.deduplicationKey);
          yield call;
        }
        return;
      }
      const cascadeId = antigravityCascadeIdFromPath(source.path);
      const cache = await loadCache2();
      const s = await stat17(source.path).catch(() => null);
      if (!s) return;
      const cached = cache.cascades[cascadeId];
      if (cached && cached.mtimeMs === s.mtimeMs && cached.sizeBytes === s.size) {
        for (const call of cached.calls) {
          if (seenKeys.has(call.deduplicationKey)) continue;
          seenKeys.add(call.deduplicationKey);
          yield call;
        }
        return;
      }
      const server = await detectServer(antigravityAppDataDirFromSourcePath(source.path));
      if (!server) {
        if (cached) {
          for (const call of cached.calls) {
            if (seenKeys.has(call.deduplicationKey)) continue;
            seenKeys.add(call.deduplicationKey);
            yield call;
          }
        }
        return;
      }
      const modelMap = await getModelMap(server);
      let metadata;
      try {
        metadata = extractAntigravityGeneratorMetadata(
          await rpc(server, "GetCascadeTrajectoryGeneratorMetadata", { cascadeId })
        );
      } catch {
        if (cached) {
          for (const call of cached.calls) {
            if (seenKeys.has(call.deduplicationKey)) continue;
            seenKeys.add(call.deduplicationKey);
            yield call;
          }
        }
        return;
      }
      const results = buildCallsFromGeneratorMetadata(cascadeId, metadata, modelMap);
      cache.cascades[cascadeId] = {
        mtimeMs: s.mtimeMs,
        sizeBytes: s.size,
        calls: results
      };
      cacheDirty = true;
      for (const call of results) {
        if (seenKeys.has(call.deduplicationKey)) continue;
        seenKeys.add(call.deduplicationKey);
        yield call;
      }
    }
  };
}
function createAntigravityProvider() {
  return {
    name: "antigravity",
    displayName: "Antigravity",
    modelDisplayName(model) {
      return modelDisplayNames7[model] ?? model;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      return discoverAntigravitySessionSources();
    },
    createSessionParser(source, seenKeys) {
      return createParser12(source, seenKeys);
    }
  };
}
async function flushAntigravityCache(liveCascadeIds) {
  await flushCache(liveCascadeIds);
}
var CONVERSATION_ROOTS, CACHE_VERSION, RPC_TIMEOUT_MS, MAX_RESPONSE_BYTES, cachedServers, cachedModelMaps, memCache2, cacheDirty, httpsAgent, SERVER_PORT_FLAGS, CSRF_TOKEN_FLAGS, APP_DATA_DIR_FLAGS, PRICING_ALIASES, modelDisplayNames7, antigravity;
var init_antigravity = __esm({
  "src/providers/antigravity.ts"() {
    "use strict";
    init_models();
    CONVERSATION_ROOTS = [
      {
        dir: join25(homedir22(), ".gemini", "antigravity", "conversations"),
        project: "antigravity",
        extensions: [".pb", ".db"]
      },
      {
        dir: join25(homedir22(), ".gemini", "antigravity-cli", "conversations"),
        project: "antigravity-cli",
        extensions: [".pb"]
      },
      {
        dir: join25(homedir22(), ".gemini", "antigravity-cli", "implicit"),
        project: "antigravity-cli",
        extensions: [".pb"]
      }
    ];
    CACHE_VERSION = 2;
    RPC_TIMEOUT_MS = 5e3;
    MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
    cachedServers = /* @__PURE__ */ new Map();
    cachedModelMaps = /* @__PURE__ */ new Map();
    memCache2 = null;
    cacheDirty = false;
    SERVER_PORT_FLAGS = ["https_server_port", "extension_server_port"];
    CSRF_TOKEN_FLAGS = ["csrf_token", "extension_server_csrf_token"];
    APP_DATA_DIR_FLAGS = ["app_data_dir"];
    PRICING_ALIASES = {
      "gemini-pro": "gemini-3.1-pro"
    };
    modelDisplayNames7 = {
      "gemini-pro-agent": "Gemini Pro",
      "gemini-3-pro": "Gemini 3 Pro",
      "gemini-3.1-pro-high": "Gemini 3.1 Pro",
      "gemini-3.1-pro-low": "Gemini 3.1 Pro (Low)",
      "gemini-3-flash": "Gemini 3 Flash",
      "gemini-3-flash-agent": "Gemini 3 Flash",
      "gemini-3.5-flash": "Gemini 3.5 Flash",
      "gemini-3.5-flash-high": "Gemini 3.5 Flash",
      "gemini-3.5-flash-medium": "Gemini 3.5 Flash",
      "gemini-3.5-flash-low": "Gemini 3.5 Flash",
      "Gemini 3.5 Flash (High)": "Gemini 3.5 Flash",
      "Gemini 3.5 Flash (Medium)": "Gemini 3.5 Flash",
      "Gemini 3.5 Flash (Low)": "Gemini 3.5 Flash",
      "gemini-3.1-flash-image": "Gemini 3.1 Flash",
      "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
      "claude-opus-4-6-thinking": "Opus 4.6",
      "claude-sonnet-4-6": "Sonnet 4.6"
    };
    antigravity = createAntigravityProvider();
  }
});

// src/providers/warp.ts
var warp_exports = {};
__export(warp_exports, {
  createWarpProvider: () => createWarpProvider,
  warp: () => warp
});
import { join as join26 } from "path";
import { homedir as homedir23 } from "os";
function sanitizeProject2(path) {
  return path.replace(/^\/+/, "").replace(/\//g, "-");
}
function warpDbPath(bundleId) {
  return join26(
    homedir23(),
    "Library",
    "Group Containers",
    WARP_GROUP_CONTAINER,
    "Library",
    "Application Support",
    bundleId,
    "warp.sqlite"
  );
}
function getDbCandidates(dbPathOverride) {
  if (dbPathOverride) return [dbPathOverride];
  if (process.env["WARP_DB_PATH"]) return [process.env["WARP_DB_PATH"]];
  return [warpDbPath(WARP_STABLE_BUNDLE_ID), warpDbPath(WARP_PREVIEW_BUNDLE_ID)];
}
function normalizeModel(rawModel) {
  const model = rawModel.trim();
  if (!model) return model;
  return modelAliases[model] ?? model;
}
function modelDisplayName(model) {
  if (model === "warp-auto-efficient") return "Warp Auto (efficient)";
  if (model === "warp-auto-powerful") return "Warp Auto (powerful)";
  return getShortModelName(model);
}
function parseTimestamp2(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const lastPlus = withT.lastIndexOf("+");
  const lastMinus = withT.lastIndexOf("-");
  const hasOffset = lastPlus > 9 || lastMinus > 9;
  const hasTimezone = withT.endsWith("Z") || hasOffset;
  const normalized = hasTimezone ? withT : `${withT}Z`;
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? null : ms;
}
function parseJsonString(raw) {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}
function isFinalStatus(rawStatus) {
  const status = parseJsonString(rawStatus);
  return status === "Completed" || status === "Cancelled" || status === "Failed";
}
function safeNumber2(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, value);
}
function extractCategoryTokens(categories, key) {
  if (!categories) return 0;
  return safeNumber2(categories[key]);
}
function extractTokenBudget(rawConversationData) {
  let conversationData;
  try {
    conversationData = JSON.parse(rawConversationData);
  } catch {
    return { tokenBudget: 0, dominantModel: "" };
  }
  const entries = conversationData.conversation_usage_metadata?.token_usage ?? [];
  let primaryTotal = 0;
  let fallbackTotal = 0;
  let dominantPrimaryTokens = 0;
  let dominantFallbackTokens = 0;
  let dominantModel2 = "";
  for (const entry of entries) {
    const primaryTokens = extractCategoryTokens(entry.warp_token_usage_by_category, PRIMARY_AGENT_CATEGORY) + extractCategoryTokens(entry.byok_token_usage_by_category, PRIMARY_AGENT_CATEGORY);
    const entryTotal = safeNumber2(entry.warp_tokens) + safeNumber2(entry.byok_tokens);
    primaryTotal += primaryTokens;
    fallbackTotal += entryTotal;
    if (primaryTokens > dominantPrimaryTokens) {
      dominantPrimaryTokens = primaryTokens;
      dominantModel2 = typeof entry.model_id === "string" ? entry.model_id : dominantModel2;
    }
    if (dominantPrimaryTokens === 0 && entryTotal > dominantFallbackTokens) {
      dominantFallbackTokens = entryTotal;
      dominantModel2 = typeof entry.model_id === "string" ? entry.model_id : dominantModel2;
    }
  }
  const tokenBudget = primaryTotal > 0 ? primaryTotal : fallbackTotal;
  return { tokenBudget: Math.max(0, Math.round(tokenBudget)), dominantModel: normalizeModel(dominantModel2) };
}
function extractUserMessage(rawInput) {
  try {
    const parsed = JSON.parse(rawInput);
    if (!Array.isArray(parsed)) return "";
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const query = item.Query;
      if (!query || typeof query !== "object") continue;
      if (typeof query.text === "string" && query.text.trim()) return query.text;
    }
    return "";
  } catch {
    return "";
  }
}
function estimateWeight(rawInput) {
  const userMessage = extractUserMessage(rawInput);
  const source = userMessage || rawInput;
  const tokens = Math.ceil(source.length / CHARS_PER_TOKEN4);
  return Math.max(1, tokens);
}
function allocateTokens(weights, tokenBudget) {
  if (weights.length === 0) return [];
  const normalizedWeights = weights.map((w) => Math.max(0, Math.round(w)));
  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  const budget = Math.max(0, Math.round(tokenBudget));
  if (budget === 0) return normalizedWeights.map(() => 0);
  if (totalWeight === 0) {
    const even = Math.floor(budget / normalizedWeights.length);
    const allocated2 = normalizedWeights.map(() => even);
    let remainder2 = budget - even * normalizedWeights.length;
    let index = 0;
    while (remainder2 > 0) {
      allocated2[index] = (allocated2[index] ?? 0) + 1;
      remainder2--;
      index = (index + 1) % normalizedWeights.length;
    }
    return allocated2;
  }
  const rawAllocation = normalizedWeights.map((weight) => budget * weight / totalWeight);
  const allocated = rawAllocation.map((value) => Math.floor(value));
  let remainder = budget - allocated.reduce((sum, value) => sum + value, 0);
  const byLargestFraction = rawAllocation.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction);
  let pointer = 0;
  while (remainder > 0 && byLargestFraction.length > 0) {
    const index = byLargestFraction[pointer].index;
    allocated[index] = (allocated[index] ?? 0) + 1;
    remainder--;
    pointer = (pointer + 1) % byLargestFraction.length;
  }
  return allocated;
}
function resolveModelForExchange(exchange, dominantModel2) {
  const candidate = exchange.model_id.trim() || exchange.coding_model_id.trim() || exchange.planning_model_id.trim() || dominantModel2 || "warp-auto-efficient";
  const normalized = normalizeModel(candidate);
  if ((normalized === "warp-auto-efficient" || normalized === "warp-auto-powerful") && dominantModel2) {
    return dominantModel2;
  }
  return normalized;
}
function assignCommandBlocksToExchanges(blocks, exchanges) {
  const toolsByExchange = /* @__PURE__ */ new Map();
  function getOrCreate(exchangeId) {
    const existing = toolsByExchange.get(exchangeId);
    if (existing) return existing;
    const created = { tools: [], bashCommands: [] };
    toolsByExchange.set(exchangeId, created);
    return created;
  }
  for (const block of blocks) {
    const blockStartMs = parseTimestamp2(block.start_ts);
    if (blockStartMs === null) continue;
    let targetExchange = null;
    for (const exchange of exchanges) {
      if (exchange.startMs > blockStartMs) break;
      targetExchange = exchange;
    }
    if (!targetExchange) continue;
    const info = getOrCreate(targetExchange.exchange_id);
    if (!info.tools.includes("Bash")) info.tools.push("Bash");
    const commandText = blobToText(block.stylized_command);
    for (const command of extractBashCommands(commandText)) {
      if (!info.bashCommands.includes(command)) info.bashCommands.push(command);
    }
  }
  return toolsByExchange;
}
function decodeSourcePath(path) {
  const splitIndex = path.lastIndexOf(":");
  if (splitIndex <= 0) return { dbPath: path, conversationId: "" };
  return {
    dbPath: path.slice(0, splitIndex),
    conversationId: path.slice(splitIndex + 1)
  };
}
function validateSchema(db) {
  try {
    db.query("SELECT COUNT(*) as cnt FROM agent_conversations LIMIT 1");
    db.query("SELECT COUNT(*) as cnt FROM ai_queries LIMIT 1");
    db.query("SELECT COUNT(*) as cnt FROM blocks LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
function createParser13(source, seenKeys) {
  return {
    async *parse() {
      if (!isSqliteAvailable()) {
        process.stderr.write(getSqliteLoadError() + "\n");
        return;
      }
      const { dbPath, conversationId } = decodeSourcePath(source.path);
      if (!conversationId) return;
      let db;
      try {
        db = openDatabase(dbPath);
      } catch (err) {
        process.stderr.write(`codeburn: cannot open Warp database: ${err instanceof Error ? err.message : err}
`);
        return;
      }
      try {
        if (!validateSchema(db)) return;
        const conversations = db.query(
          `SELECT conversation_id, conversation_data, last_modified_at
           FROM agent_conversations
           WHERE conversation_id = ?
           LIMIT 1`,
          [conversationId]
        );
        if (conversations.length === 0) return;
        const exchanges = db.query(
          `SELECT exchange_id, conversation_id, start_ts, input, working_directory, output_status, model_id, planning_model_id, coding_model_id
           FROM ai_queries
           WHERE conversation_id = ?
           ORDER BY start_ts ASC`,
          [conversationId]
        );
        const parsedExchanges = [];
        for (const exchange of exchanges) {
          if (!isFinalStatus(exchange.output_status)) continue;
          const startMs = parseTimestamp2(exchange.start_ts);
          if (startMs === null) continue;
          parsedExchanges.push({ ...exchange, startMs });
        }
        if (parsedExchanges.length === 0) return;
        const blocks = db.query(
          `SELECT block_id, start_ts, CAST(stylized_command AS BLOB) AS stylized_command
           FROM blocks
           WHERE ai_metadata IS NOT NULL
             AND ai_metadata <> ''
             AND json_extract(ai_metadata, '$.conversation_id') = ?
           ORDER BY start_ts ASC`,
          [conversationId]
        );
        const { tokenBudget, dominantModel: dominantModel2 } = extractTokenBudget(conversations[0].conversation_data);
        const weights = parsedExchanges.map((exchange) => estimateWeight(exchange.input));
        const fallbackBudget = weights.reduce((sum, weight) => sum + weight, 0);
        const allocatedTokens = allocateTokens(weights, tokenBudget > 0 ? tokenBudget : fallbackBudget);
        const toolsByExchange = assignCommandBlocksToExchanges(blocks, parsedExchanges);
        for (let index = 0; index < parsedExchanges.length; index++) {
          const exchange = parsedExchanges[index];
          const deduplicationKey = `warp:${conversationId}:${exchange.exchange_id}`;
          if (seenKeys.has(deduplicationKey)) continue;
          const timestamp = new Date(exchange.startMs).toISOString();
          const model = resolveModelForExchange(exchange, dominantModel2);
          const inputTokens = allocatedTokens[index] ?? 0;
          const exchangeTools = toolsByExchange.get(exchange.exchange_id) ?? { tools: [], bashCommands: [] };
          const userMessage = extractUserMessage(exchange.input).slice(0, 500);
          const projectPath = exchange.working_directory?.trim() || void 0;
          const project = projectPath ? sanitizeProject2(projectPath) : source.project;
          seenKeys.add(deduplicationKey);
          yield {
            provider: "warp",
            model,
            inputTokens,
            // Warp exposes only conversation-level usage totals in these tables,
            // so we cannot reliably split per-exchange input vs output tokens.
            outputTokens: 0,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
            cachedInputTokens: 0,
            reasoningTokens: 0,
            webSearchRequests: 0,
            costUSD: calculateCost(model, inputTokens, 0, 0, 0, 0),
            costIsEstimated: true,
            tools: exchangeTools.tools,
            bashCommands: exchangeTools.bashCommands,
            timestamp,
            speed: "standard",
            deduplicationKey,
            userMessage,
            sessionId: conversationId,
            project,
            projectPath
          };
        }
      } finally {
        db.close();
      }
    }
  };
}
async function discoverFromDb(dbPath) {
  let db;
  try {
    db = openDatabase(dbPath);
  } catch {
    return [];
  }
  try {
    if (!validateSchema(db)) return [];
    const rows = db.query(
      `SELECT c.conversation_id AS conversation_id,
              (
                SELECT q.working_directory
                FROM ai_queries q
                WHERE q.conversation_id = c.conversation_id
                  AND q.working_directory IS NOT NULL
                  AND q.working_directory <> ''
                ORDER BY q.start_ts DESC
                LIMIT 1
              ) AS working_directory
       FROM agent_conversations c
       WHERE EXISTS (
         SELECT 1 FROM ai_queries q
         WHERE q.conversation_id = c.conversation_id
       )
       ORDER BY c.last_modified_at DESC`
    );
    return rows.map((row) => {
      const projectPath = row.working_directory?.trim() ?? "";
      return {
        path: `${dbPath}:${row.conversation_id}`,
        project: projectPath ? sanitizeProject2(projectPath) : "warp",
        provider: "warp"
      };
    });
  } catch {
    return [];
  } finally {
    db.close();
  }
}
function createWarpProvider(dbPathOverride) {
  return {
    name: "warp",
    displayName: "Warp",
    modelDisplayName(model) {
      return modelDisplayName(model);
    },
    toolDisplayName(rawTool) {
      return rawTool === "run_command" ? "Bash" : rawTool;
    },
    async discoverSessions() {
      if (!isSqliteAvailable()) return [];
      const sessions = [];
      for (const candidate of getDbCandidates(dbPathOverride)) {
        const found = await discoverFromDb(candidate);
        sessions.push(...found);
      }
      return sessions;
    },
    createSessionParser(source, seenKeys) {
      return createParser13(source, seenKeys);
    }
  };
}
var WARP_GROUP_CONTAINER, WARP_STABLE_BUNDLE_ID, WARP_PREVIEW_BUNDLE_ID, PRIMARY_AGENT_CATEGORY, CHARS_PER_TOKEN4, modelAliases, warp;
var init_warp = __esm({
  "src/providers/warp.ts"() {
    "use strict";
    init_bash_utils();
    init_models();
    init_sqlite();
    WARP_GROUP_CONTAINER = "2BBY89MBSN.dev.warp";
    WARP_STABLE_BUNDLE_ID = "dev.warp.Warp-Stable";
    WARP_PREVIEW_BUNDLE_ID = "dev.warp.Warp-Preview";
    PRIMARY_AGENT_CATEGORY = "primary_agent";
    CHARS_PER_TOKEN4 = 4;
    modelAliases = {
      "Claude Sonnet 4.6": "claude-sonnet-4-6",
      "Claude Sonnet 4.5": "claude-sonnet-4-5",
      "Claude Haiku 4.5": "claude-haiku-4-5",
      "Claude Opus 4.6": "claude-opus-4-6",
      "GPT-5.3 Codex (low reasoning)": "gpt-5.3-codex",
      "GPT-5.3 Codex (medium reasoning)": "gpt-5.3-codex",
      "GPT-5.3 Codex (high reasoning)": "gpt-5.3-codex",
      "GPT-5.3 Codex (extra high reasoning)": "gpt-5.3-codex",
      "auto-efficient": "warp-auto-efficient",
      "auto-powerful": "warp-auto-powerful"
    };
    warp = createWarpProvider();
  }
});

// src/providers/forge.ts
var forge_exports = {};
__export(forge_exports, {
  createForgeProvider: () => createForgeProvider,
  forge: () => forge
});
import { existsSync as existsSync3 } from "fs";
import { homedir as homedir24 } from "os";
import { join as join27 } from "path";
function validateSchema2(db) {
  try {
    db.query("SELECT conversation_id, title, CAST(workspace_id AS TEXT) AS workspace_id, context, created_at, updated_at FROM conversations LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
function sqliteTimestampToIso(value) {
  if (!value) return (/* @__PURE__ */ new Date(0)).toISOString();
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d+))?$/);
  if (match) {
    const ms = (match[3] ?? "").padEnd(3, "0").slice(0, 3);
    const parsed2 = /* @__PURE__ */ new Date(`${match[1]}T${match[2]}.${ms}Z`);
    if (!Number.isNaN(parsed2.getTime())) return parsed2.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? (/* @__PURE__ */ new Date(0)).toISOString() : parsed.toISOString();
}
function actual(value) {
  if (!value || typeof value !== "object") return 0;
  const raw = value["actual"];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}
function usageActual(usage, key) {
  if (!usage || typeof usage !== "object") return 0;
  return actual(usage[key]);
}
function mapToolName(name) {
  switch (name) {
    case "shell":
    case "bash":
      return "Bash";
    case "read":
    case "Read":
      return "Read";
    case "write":
    case "Write":
      return "Write";
    case "patch":
    case "Edit":
    case "edit":
      return "Edit";
    case "fs_search":
    case "grep":
      return "Grep";
    case "task":
    case "dispatch_agent":
      return "Agent";
    default:
      return name;
  }
}
function pushUnique(values, value) {
  if (!values.includes(value)) values.push(value);
}
function toolCalls(value) {
  return Array.isArray(value) ? value.filter((v) => v && typeof v === "object") : [];
}
function extractToolsAndCommands(calls) {
  const tools = [];
  const bashCommands = [];
  let firstCallId;
  for (const call of calls) {
    const rawName = call["name"];
    if (typeof rawName !== "string") continue;
    if (!firstCallId && typeof call["call_id"] === "string") firstCallId = call["call_id"];
    const tool = mapToolName(rawName);
    pushUnique(tools, tool);
    if (tool === "Bash") {
      const args = call["arguments"];
      if (args && typeof args === "object") {
        const command = args["command"];
        if (typeof command === "string") {
          for (const cmd of extractBashCommands(command)) pushUnique(bashCommands, cmd);
        }
      }
    }
  }
  return { tools, bashCommands, firstCallId };
}
function splitSourcePath(path) {
  const idx = path.lastIndexOf(":");
  if (idx < 0) return null;
  return { dbPath: path.slice(0, idx), conversationId: path.slice(idx + 1) };
}
function createParser14(source, seenKeys) {
  return {
    async *parse() {
      if (!isSqliteAvailable()) {
        process.stderr.write(getSqliteLoadError() + "\n");
        return;
      }
      const split = splitSourcePath(source.path);
      if (!split) return;
      let db;
      try {
        db = openDatabase(split.dbPath);
      } catch {
        return;
      }
      try {
        if (!validateSchema2(db)) return;
        const rows = db.query(
          `SELECT conversation_id, title, CAST(workspace_id AS TEXT) AS workspace_id, context, created_at, updated_at
           FROM conversations
           WHERE conversation_id = ?`,
          [split.conversationId]
        );
        const row = rows[0];
        if (!row?.context) return;
        let parsed;
        try {
          parsed = JSON.parse(row.context);
        } catch {
          return;
        }
        const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
        let userMessage = "";
        for (let i = 0; i < messages.length; i++) {
          const text = messages[i]?.message?.text;
          const role = typeof text?.role === "string" ? text.role.toLowerCase() : "";
          const content = typeof text?.content === "string" ? text.content : "";
          if (role === "user") {
            userMessage = content.length > 500 ? content.slice(0, 500) : content;
            continue;
          }
          if (role !== "assistant") continue;
          const promptTokens = usageActual(messages[i]?.usage, "prompt_tokens");
          const outputTokens = usageActual(messages[i]?.usage, "completion_tokens");
          const cachedInputTokens = usageActual(messages[i]?.usage, "cached_tokens");
          const inputTokens = Math.max(0, promptTokens - cachedInputTokens);
          if (inputTokens === 0 && outputTokens === 0) continue;
          const model = typeof text?.model === "string" ? text.model : "unknown";
          const calls = toolCalls(text?.tool_calls);
          const { tools, bashCommands, firstCallId } = extractToolsAndCommands(calls);
          const stableId = firstCallId ?? `${model}:${promptTokens}:${outputTokens}:${i}`;
          const deduplicationKey = `forge:${row.conversation_id}:${stableId}`;
          if (seenKeys.has(deduplicationKey)) continue;
          seenKeys.add(deduplicationKey);
          yield {
            provider: "forge",
            model,
            inputTokens,
            outputTokens,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: cachedInputTokens,
            cachedInputTokens,
            reasoningTokens: 0,
            webSearchRequests: 0,
            costUSD: calculateCost(model, inputTokens, outputTokens, 0, cachedInputTokens, 0),
            tools,
            bashCommands,
            timestamp: sqliteTimestampToIso(row.updated_at ?? row.created_at),
            speed: "standard",
            deduplicationKey,
            userMessage,
            sessionId: row.conversation_id
          };
        }
      } finally {
        db.close();
      }
    }
  };
}
async function discoverFromDb2(dbPath) {
  if (!existsSync3(dbPath)) return [];
  let db;
  try {
    db = openDatabase(dbPath);
  } catch {
    return [];
  }
  try {
    if (!validateSchema2(db)) return [];
    const rows = db.query(
      `SELECT conversation_id, title, CAST(workspace_id AS TEXT) AS workspace_id
       FROM conversations
       WHERE context IS NOT NULL`
    );
    return rows.map((row) => ({
      path: `${dbPath}:${row.conversation_id}`,
      project: row.title ?? String(row.workspace_id),
      provider: "forge"
    }));
  } catch {
    return [];
  } finally {
    db.close();
  }
}
function createForgeProvider(dbPath = DEFAULT_DB_PATH) {
  return {
    name: "forge",
    displayName: "Forge",
    modelDisplayName(model) {
      return model;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      if (!isSqliteAvailable()) return [];
      return discoverFromDb2(dbPath);
    },
    createSessionParser(source, seenKeys) {
      return createParser14(source, seenKeys);
    }
  };
}
var DEFAULT_DB_PATH, forge;
var init_forge = __esm({
  "src/providers/forge.ts"() {
    "use strict";
    init_bash_utils();
    init_models();
    init_sqlite();
    DEFAULT_DB_PATH = join27(homedir24(), ".forge", ".forge.db");
    forge = createForgeProvider();
  }
});

// src/providers/goose.ts
var goose_exports = {};
__export(goose_exports, {
  createGooseProvider: () => createGooseProvider,
  goose: () => goose
});
import { join as join28 } from "path";
import { homedir as homedir25, platform as platform2 } from "os";
function sanitize2(dir) {
  return dir.replace(/^\//, "").replace(/\//g, "-");
}
function getDbPath() {
  const root = process.env["GOOSE_PATH_ROOT"];
  if (root) return join28(root, "data", "sessions", "sessions.db");
  const p = platform2();
  if (p === "darwin" || p === "linux") {
    const base = process.env["XDG_DATA_HOME"] ?? join28(homedir25(), ".local", "share");
    return join28(base, "goose", "sessions", "sessions.db");
  }
  return join28(homedir25(), "AppData", "Roaming", "Block", "goose", "sessions", "sessions.db");
}
function validateSchema3(db) {
  try {
    db.query("SELECT COUNT(*) as cnt FROM sessions LIMIT 1");
    db.query("SELECT COUNT(*) as cnt FROM messages LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
function parseModelConfig(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function extractToolsFromMessages(db, sessionId) {
  const tools = [];
  const bashCommands = [];
  const seen = /* @__PURE__ */ new Set();
  const toolSequence = [];
  try {
    const rows = db.query(
      "SELECT CAST(content_json AS BLOB) AS content_json FROM messages WHERE session_id = ? AND role = 'assistant' AND content_json LIKE '%toolRequest%' ORDER BY created_timestamp ASC",
      [sessionId]
    );
    for (const row of rows) {
      let items;
      try {
        items = JSON.parse(blobToText(row.content_json));
      } catch {
        continue;
      }
      const msgCalls = [];
      for (const item of items) {
        if (item.type !== "toolRequest") continue;
        const rawName = item.toolCall?.value?.name ?? "";
        if (!rawName) continue;
        const mapped = toolNameMap13[rawName] ?? rawName.split("__").pop() ?? rawName;
        if (!seen.has(mapped)) {
          seen.add(mapped);
          tools.push(mapped);
        }
        const call = { tool: mapped };
        const args = item.toolCall?.value?.arguments;
        if (args && typeof args === "object") {
          const fp = args["file_path"];
          if (typeof fp === "string") call.file = fp;
          const cmd = args["command"];
          if (typeof cmd === "string") call.command = cmd;
        }
        msgCalls.push(call);
        if (mapped === "Bash") {
          const cmd = item.toolCall?.value?.arguments?.command;
          if (typeof cmd === "string") {
            for (const c of extractBashCommands(cmd)) {
              if (!bashCommands.includes(c)) bashCommands.push(c);
            }
          }
        }
      }
      if (msgCalls.length > 0) toolSequence.push(msgCalls);
    }
  } catch {
  }
  return { tools, bashCommands, toolSequence };
}
function getFirstUserMessage(db, sessionId) {
  try {
    const rows = db.query(
      "SELECT CAST(content_json AS BLOB) AS content_json FROM messages WHERE session_id = ? AND role = 'user' ORDER BY created_timestamp ASC LIMIT 1",
      [sessionId]
    );
    if (rows.length === 0) return "";
    const items = JSON.parse(blobToText(rows[0].content_json));
    const text = items.find((i) => i.type === "text");
    return (text?.text ?? "").slice(0, 500);
  } catch {
    return "";
  }
}
function createParser15(source, seenKeys) {
  return {
    async *parse() {
      if (!isSqliteAvailable()) {
        process.stderr.write(getSqliteLoadError() + "\n");
        return;
      }
      const segments = source.path.split(":");
      const sessionId = segments[segments.length - 1];
      const dbPath = segments.slice(0, -1).join(":");
      let db;
      try {
        db = openDatabase(dbPath);
      } catch (err) {
        process.stderr.write(`codeburn: cannot open Goose database: ${err instanceof Error ? err.message : err}
`);
        return;
      }
      try {
        if (!validateSchema3(db)) return;
        const rows = db.query(
          "SELECT id, name, working_dir, created_at, updated_at, accumulated_input_tokens, accumulated_output_tokens, provider_name, CAST(model_config_json AS BLOB) AS model_config_json FROM sessions WHERE id = ?",
          [sessionId]
        );
        if (rows.length === 0) return;
        const session = rows[0];
        const inputTokens = session.accumulated_input_tokens ?? 0;
        const outputTokens = session.accumulated_output_tokens ?? 0;
        if (inputTokens === 0 && outputTokens === 0) return;
        const dedupKey = `goose:${sessionId}`;
        if (seenKeys.has(dedupKey)) return;
        seenKeys.add(dedupKey);
        const config = parseModelConfig(blobToText(session.model_config_json));
        const model = config.model_name ?? "unknown";
        const costUSD = calculateCost(model, inputTokens, outputTokens, 0, 0, 0);
        const { tools, bashCommands, toolSequence } = extractToolsFromMessages(db, sessionId);
        const userMessage = getFirstUserMessage(db, sessionId);
        const raw = session.updated_at || session.created_at || "";
        let ts = new Date(raw);
        if (isNaN(ts.getTime())) ts = /* @__PURE__ */ new Date(raw + "Z");
        if (isNaN(ts.getTime())) ts = /* @__PURE__ */ new Date();
        yield {
          provider: "goose",
          model,
          inputTokens,
          outputTokens,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
          cachedInputTokens: 0,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools,
          bashCommands,
          toolSequence: toolSequence.length > 1 ? toolSequence : void 0,
          timestamp: ts.toISOString(),
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage,
          sessionId
        };
      } finally {
        db.close();
      }
    }
  };
}
async function discoverFromDb3(dbPath) {
  let db;
  try {
    db = openDatabase(dbPath);
  } catch {
    return [];
  }
  try {
    const rows = db.query(
      "SELECT id, name, working_dir, created_at, updated_at, accumulated_input_tokens, accumulated_output_tokens, provider_name, CAST(model_config_json AS BLOB) AS model_config_json FROM sessions ORDER BY updated_at DESC"
    );
    return rows.filter((r) => (r.accumulated_input_tokens ?? 0) > 0 || (r.accumulated_output_tokens ?? 0) > 0).map((row) => ({
      path: `${dbPath}:${row.id}`,
      project: row.working_dir ? sanitize2(row.working_dir) : "goose",
      provider: "goose"
    }));
  } catch {
    return [];
  } finally {
    db.close();
  }
}
function createGooseProvider() {
  return {
    name: "goose",
    displayName: "Goose",
    modelDisplayName(model) {
      return modelDisplayNames8[model] ?? getShortModelName(model);
    },
    toolDisplayName(rawTool) {
      return toolNameMap13[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      if (!isSqliteAvailable()) return [];
      const dbPath = getDbPath();
      return discoverFromDb3(dbPath);
    },
    createSessionParser(source, seenKeys) {
      return createParser15(source, seenKeys);
    }
  };
}
var toolNameMap13, modelDisplayNames8, goose;
var init_goose = __esm({
  "src/providers/goose.ts"() {
    "use strict";
    init_models();
    init_bash_utils();
    init_sqlite();
    toolNameMap13 = {
      developer__shell: "Bash",
      developer__text_editor: "Edit",
      developer__read_file: "Read",
      developer__write_file: "Write",
      developer__list_directory: "LS",
      developer__search_files: "Grep",
      computercontroller__shell: "Bash"
    };
    modelDisplayNames8 = {
      "gpt-5.5": "GPT-5.5",
      "gpt-5.4": "GPT-5.4",
      "gpt-5.4-mini": "GPT-5.4 Mini",
      "gpt-4o": "GPT-4o",
      "gpt-4o-mini": "GPT-4o Mini"
    };
    goose = createGooseProvider();
  }
});

// src/cursor-cache.ts
import { readFile as readFile16, mkdir as mkdir8, rename as rename5, stat as stat18, unlink as unlink3, open as open4, lstat } from "fs/promises";
import { join as join29 } from "path";
import { homedir as homedir26 } from "os";
import { randomBytes as randomBytes4 } from "crypto";
function getCacheDir5() {
  return join29(homedir26(), ".cache", "codeburn");
}
function getCachePath4() {
  return join29(getCacheDir5(), CACHE_FILE2);
}
async function getDbFingerprint(dbPath) {
  try {
    const s = await stat18(dbPath);
    return { mtimeMs: s.mtimeMs, size: s.size };
  } catch {
    return null;
  }
}
async function readCachedResults(dbPath) {
  try {
    const fp = await getDbFingerprint(dbPath);
    if (!fp) return null;
    const raw = await readFile16(getCachePath4(), "utf-8");
    const cache = JSON.parse(raw);
    if (cache.version === CURSOR_CACHE_VERSION && cache.dbMtimeMs === fp.mtimeMs && cache.dbSizeBytes === fp.size) {
      return cache.calls;
    }
    return null;
  } catch {
    return null;
  }
}
async function writeCachedResults(dbPath, calls) {
  const fp = await getDbFingerprint(dbPath);
  if (!fp) return;
  const dir = getCacheDir5();
  await mkdir8(dir, { recursive: true }).catch(() => {
  });
  const cache = {
    version: CURSOR_CACHE_VERSION,
    dbMtimeMs: fp.mtimeMs,
    dbSizeBytes: fp.size,
    calls
  };
  const target = getCachePath4();
  try {
    const s = await lstat(target);
    if (s.isSymbolicLink()) return;
  } catch {
  }
  const tempPath = `${target}.${randomBytes4(8).toString("hex")}.tmp`;
  const handle = await open4(tempPath, "w", 384);
  try {
    await handle.writeFile(JSON.stringify(cache), { encoding: "utf-8" });
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename5(tempPath, target);
  } catch (err) {
    try {
      await unlink3(tempPath);
    } catch {
    }
    throw err;
  }
}
var CURSOR_CACHE_VERSION, CACHE_FILE2;
var init_cursor_cache = __esm({
  "src/cursor-cache.ts"() {
    "use strict";
    CURSOR_CACHE_VERSION = 3;
    CACHE_FILE2 = "cursor-results.json";
  }
});

// src/providers/cursor.ts
var cursor_exports = {};
__export(cursor_exports, {
  clearCursorWorkspaceMapCache: () => clearCursorWorkspaceMapCache,
  createCursorProvider: () => createCursorProvider,
  cursor: () => cursor
});
import { existsSync as existsSync4, statSync as statSync2, readdirSync, readFileSync as readFileSync2 } from "fs";
import { join as join30 } from "path";
import { homedir as homedir27 } from "os";
function getCursorDbPath() {
  if (process.platform === "darwin") {
    return join30(homedir27(), "Library", "Application Support", "Cursor", "User", "globalStorage", "state.vscdb");
  }
  if (process.platform === "win32") {
    return join30(homedir27(), "AppData", "Roaming", "Cursor", "User", "globalStorage", "state.vscdb");
  }
  return join30(homedir27(), ".config", "Cursor", "User", "globalStorage", "state.vscdb");
}
function getCursorWorkspaceStorageDir(globalDbPath) {
  const userDir = join30(globalDbPath, "..", "..");
  return join30(userDir, "workspaceStorage");
}
function sanitizeWorkspaceUri(uri) {
  let path;
  if (uri.startsWith("file://")) {
    path = uri.slice("file://".length);
  } else {
    path = uri.replace(/^[^:]+:\/\//, "/").replace(/\+/g, "-");
  }
  try {
    path = decodeURIComponent(path);
  } catch {
  }
  return path.replace(/\/+/g, "-");
}
function clearCursorWorkspaceMapCache() {
  workspaceMapCache = null;
  workspaceMapCacheRoot = null;
}
function loadWorkspaceMap(workspaceStorageDir) {
  if (workspaceMapCache && workspaceMapCacheRoot === workspaceStorageDir) {
    return workspaceMapCache;
  }
  const result = {
    composerToWorkspace: /* @__PURE__ */ new Map(),
    workspaceProjectName: /* @__PURE__ */ new Map()
  };
  let entries;
  try {
    entries = readdirSync(workspaceStorageDir);
  } catch {
    workspaceMapCache = result;
    workspaceMapCacheRoot = workspaceStorageDir;
    return result;
  }
  for (const hashDir of entries) {
    const wsJsonPath = join30(workspaceStorageDir, hashDir, "workspace.json");
    const wsDbPath = join30(workspaceStorageDir, hashDir, "state.vscdb");
    let wsJsonRaw;
    try {
      wsJsonRaw = readFileSync2(wsJsonPath, "utf-8");
    } catch {
      continue;
    }
    let folder;
    try {
      const parsed = JSON.parse(wsJsonRaw);
      folder = parsed.folder;
    } catch {
      continue;
    }
    if (!folder) continue;
    if (!existsSync4(wsDbPath)) continue;
    let db;
    try {
      db = openDatabase(wsDbPath);
    } catch {
      continue;
    }
    try {
      const rows = db.query(
        "SELECT value FROM ItemTable WHERE key='composer.composerData'"
      );
      if (rows.length === 0) continue;
      let parsed;
      try {
        parsed = JSON.parse(rows[0].value);
      } catch {
        continue;
      }
      const project = sanitizeWorkspaceUri(folder);
      let added = 0;
      for (const c of parsed.allComposers ?? []) {
        if (typeof c.composerId === "string") {
          result.composerToWorkspace.set(c.composerId, folder);
          added += 1;
        }
      }
      if (added > 0) {
        result.workspaceProjectName.set(folder, project);
      }
    } catch {
    } finally {
      db.close();
    }
  }
  workspaceMapCache = result;
  workspaceMapCacheRoot = workspaceStorageDir;
  return result;
}
function parseComposerIdFromKey(key) {
  if (!key) return null;
  const firstColon = key.indexOf(":");
  if (firstColon < 0) return null;
  const secondColon = key.indexOf(":", firstColon + 1);
  if (secondColon < 0) return null;
  const candidate = key.slice(firstColon + 1, secondColon);
  if (!candidate) return null;
  if (/[\r\n\x00]/.test(candidate)) return null;
  return candidate;
}
function encodeSourcePath(dbPath, workspaceTag) {
  return `${dbPath}${WORKSPACE_SEP}${workspaceTag}`;
}
function decodeSourcePath2(sourcePath) {
  const idx = sourcePath.indexOf(WORKSPACE_SEP);
  if (idx < 0) return { dbPath: sourcePath, workspaceTag: "__all__" };
  return {
    dbPath: sourcePath.slice(0, idx),
    workspaceTag: sourcePath.slice(idx + WORKSPACE_SEP.length)
  };
}
function extractLanguages(codeBlocksJson) {
  if (!codeBlocksJson) return [];
  try {
    const blocks = JSON.parse(codeBlocksJson);
    if (!Array.isArray(blocks)) return [];
    const langs = /* @__PURE__ */ new Set();
    for (const block of blocks) {
      if (block.languageId && block.languageId !== "plaintext") {
        langs.add(block.languageId);
      }
    }
    return [...langs];
  } catch {
    return [];
  }
}
function resolveModel4(raw) {
  if (!raw || raw === "default") return CURSOR_COST_MODEL;
  return raw;
}
function modelForDisplay(raw) {
  if (!raw || raw === "default") return "cursor-auto";
  return raw;
}
function validateSchema4(db) {
  try {
    const rows = db.query(
      "SELECT COUNT(*) as cnt FROM cursorDiskKV WHERE key LIKE 'bubbleId:%' LIMIT 1"
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}
function buildUserMessageMap(db, timeFloor) {
  const map = /* @__PURE__ */ new Map();
  try {
    const rows = db.query(USER_MESSAGES_QUERY, [timeFloor]);
    for (const row of rows) {
      if (!row.conversation_id || !row.text) continue;
      const text = blobToText(row.text);
      const existing = map.get(row.conversation_id);
      if (existing) {
        existing.messages.push(text);
      } else {
        map.set(row.conversation_id, { messages: [text], pos: 0 });
      }
    }
  } catch {
  }
  return map;
}
function takeUserMessage(queues, conversationId) {
  const queue = queues.get(conversationId);
  if (!queue || queue.pos >= queue.messages.length) return "";
  const msg = queue.messages[queue.pos];
  queue.pos += 1;
  return msg;
}
function parseBubbles(db, seenKeys) {
  const results = [];
  let skipped = 0;
  const LOOKBACK_DAYS = 180;
  const timeFloor = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1e3).toISOString();
  const MAX_BUBBLES = 25e4;
  let rowIdCutoff = 0;
  try {
    const countRows = db.query(
      "SELECT COUNT(*) as cnt FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'"
    );
    const total = countRows[0]?.cnt ?? 0;
    if (total > MAX_BUBBLES) {
      const cutoffRows = db.query(
        `SELECT MIN(rid) as rid FROM (
           SELECT ROWID as rid FROM cursorDiskKV
           WHERE key LIKE 'bubbleId:%'
           ORDER BY ROWID DESC
           LIMIT ?
         )`,
        [MAX_BUBBLES]
      );
      rowIdCutoff = cutoffRows[0]?.rid ?? 0;
      process.stderr.write(
        `codeburn: Cursor database has ${total.toLocaleString()} bubbles, scanning the most recent ${MAX_BUBBLES.toLocaleString()}. Older sessions may be missing from this report.
`
      );
    }
  } catch {
  }
  const userMessages = buildUserMessageMap(db, timeFloor);
  const rowIdFilter = rowIdCutoff > 0 ? " AND ROWID >= ?" : "";
  const params = rowIdCutoff > 0 ? [timeFloor, rowIdCutoff] : [timeFloor];
  const cappedQuery = BUBBLE_QUERY_SINCE_HEAD + rowIdFilter + BUBBLE_QUERY_SINCE_TAIL;
  let rows;
  try {
    rows = db.query(cappedQuery, params);
  } catch {
    return { calls: results };
  }
  for (const row of rows) {
    try {
      let inputTokens = row.input_tokens ?? 0;
      let outputTokens = row.output_tokens ?? 0;
      if (inputTokens === 0 && outputTokens === 0) {
        const textLen = row.text_length ?? 0;
        if (textLen === 0) continue;
        if (row.bubble_type === 1) {
          inputTokens = Math.ceil(textLen / CHARS_PER_TOKEN5);
        } else {
          outputTokens = Math.ceil(textLen / CHARS_PER_TOKEN5);
        }
      }
      const createdAt = row.created_at ?? "";
      if (!createdAt) continue;
      const parsedComposerId = parseComposerIdFromKey(row.bubble_key);
      if (!parsedComposerId) {
        skipped++;
        continue;
      }
      const conversationId = parsedComposerId;
      const dedupKey = `cursor:bubble:${row.bubble_key}`;
      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);
      const pricingModel = resolveModel4(row.model);
      const displayModel = modelForDisplay(row.model);
      const costUSD = calculateCost(pricingModel, inputTokens, outputTokens, 0, 0, 0);
      const timestamp = createdAt;
      const userQuestion = takeUserMessage(userMessages, conversationId);
      const assistantText = blobToText(row.user_text);
      const userText = (userQuestion + " " + assistantText).trim();
      const languages = extractLanguages(blobToText(row.code_blocks));
      const hasCode = languages.length > 0;
      const cursorTools = hasCode ? ["cursor:edit", ...languages.map((l) => `lang:${l}`)] : [];
      results.push({
        provider: "cursor",
        model: displayModel,
        inputTokens,
        outputTokens,
        cacheCreationInputTokens: 0,
        cacheReadInputTokens: 0,
        cachedInputTokens: 0,
        reasoningTokens: 0,
        webSearchRequests: 0,
        costUSD,
        tools: cursorTools,
        bashCommands: [],
        timestamp,
        speed: "standard",
        deduplicationKey: dedupKey,
        userMessage: userText,
        sessionId: conversationId
      });
    } catch {
      skipped++;
    }
  }
  if (skipped > 0) {
    process.stderr.write(`codeburn: skipped ${skipped} unreadable Cursor entries
`);
  }
  return { calls: results };
}
function extractModelFromContent(content) {
  for (const c of content) {
    if (c.providerOptions?.cursor?.modelName) {
      return c.providerOptions.cursor.modelName;
    }
  }
  return null;
}
function extractTextLength(content) {
  let total = 0;
  for (const c of content) {
    if (c.text) total += c.text.length;
  }
  return total;
}
function parseAgentKv(db, seenKeys, dbPath) {
  const results = [];
  let agentKvTimestamp;
  try {
    agentKvTimestamp = new Date(statSync2(dbPath).mtimeMs).toISOString();
  } catch {
    agentKvTimestamp = (/* @__PURE__ */ new Date()).toISOString();
  }
  let rows;
  try {
    rows = db.query(AGENTKV_QUERY);
  } catch {
    return { calls: results };
  }
  const sessions = /* @__PURE__ */ new Map();
  let currentRequestId = "unknown";
  let turnIndex = 0;
  for (const row of rows) {
    if (!row.role || !row.content) continue;
    const contentText = blobToText(row.content);
    let content;
    let plainTextLength = 0;
    try {
      const parsed = JSON.parse(contentText);
      if (Array.isArray(parsed)) {
        content = parsed;
      } else {
        content = [];
        plainTextLength = contentText.length;
      }
    } catch {
      content = [];
      plainTextLength = contentText.length;
    }
    const requestId = row.request_id ?? currentRequestId;
    if (requestId !== currentRequestId) {
      currentRequestId = requestId;
      turnIndex = 0;
    }
    const textLength = plainTextLength || extractTextLength(content);
    const model = extractModelFromContent(content);
    if (row.role === "user") {
      const existing = sessions.get(requestId) ?? { inputChars: 0, outputChars: 0, model: null, userText: "" };
      existing.inputChars += textLength;
      if (!existing.userText) {
        const text = content[0]?.text ?? contentText;
        const queryMatch = text.match(/<user_query>([\s\S]*?)<\/user_query>/);
        existing.userText = queryMatch ? queryMatch[1].trim().slice(0, 500) : text.slice(0, 500);
      }
      sessions.set(requestId, existing);
    } else if (row.role === "assistant") {
      const existing = sessions.get(requestId) ?? { inputChars: 0, outputChars: 0, model: null, userText: "" };
      existing.outputChars += textLength;
      if (model) existing.model = model;
      sessions.set(requestId, existing);
    } else if (row.role === "tool" || row.role === "system") {
      const existing = sessions.get(requestId) ?? { inputChars: 0, outputChars: 0, model: null, userText: "" };
      existing.inputChars += textLength;
      sessions.set(requestId, existing);
    }
  }
  for (const [requestId, session] of sessions) {
    if (session.inputChars === 0 && session.outputChars === 0) continue;
    const inputTokens = Math.ceil(session.inputChars / CHARS_PER_TOKEN5);
    const outputTokens = Math.ceil(session.outputChars / CHARS_PER_TOKEN5);
    const dedupKey = `cursor:agentKv:${requestId}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);
    const pricingModel = resolveModel4(session.model);
    const displayModel = modelForDisplay(session.model);
    const costUSD = calculateCost(pricingModel, inputTokens, outputTokens, 0, 0, 0);
    results.push({
      provider: "cursor",
      model: displayModel,
      inputTokens,
      outputTokens,
      cacheCreationInputTokens: 0,
      cacheReadInputTokens: 0,
      cachedInputTokens: 0,
      reasoningTokens: 0,
      webSearchRequests: 0,
      costUSD,
      tools: [],
      bashCommands: [],
      timestamp: agentKvTimestamp,
      speed: "standard",
      deduplicationKey: dedupKey,
      userMessage: session.userText,
      sessionId: requestId
    });
  }
  return { calls: results };
}
function createParser16(source, seenKeys) {
  return {
    async *parse() {
      if (!isSqliteAvailable()) {
        process.stderr.write(getSqliteLoadError() + "\n");
        return;
      }
      const { dbPath, workspaceTag } = decodeSourcePath2(source.path);
      let composerFilter = null;
      let filterMode = "include";
      if (workspaceTag !== "__all__") {
        const wsMap = loadWorkspaceMap(getCursorWorkspaceStorageDir(dbPath));
        if (workspaceTag === ORPHAN_TAG) {
          composerFilter = new Set(wsMap.composerToWorkspace.keys());
          filterMode = "exclude";
        } else {
          composerFilter = /* @__PURE__ */ new Set();
          for (const [composerId, folder] of wsMap.composerToWorkspace) {
            if (folder === workspaceTag) composerFilter.add(composerId);
          }
          filterMode = "include";
        }
      }
      let allCalls = null;
      const cached = await readCachedResults(dbPath);
      if (cached) {
        allCalls = cached;
      } else {
        let db;
        try {
          db = openDatabase(dbPath);
        } catch (err) {
          process.stderr.write(`codeburn: cannot open Cursor database: ${err instanceof Error ? err.message : err}
`);
          return;
        }
        try {
          if (!validateSchema4(db)) {
            process.stderr.write("codeburn: Cursor storage format not recognized. You may need to update CodeBurn.\n");
            return;
          }
          const localSeen = /* @__PURE__ */ new Set();
          const { calls: bubbleCalls } = parseBubbles(db, localSeen);
          const { calls: agentKvCalls } = parseAgentKv(db, localSeen, dbPath);
          allCalls = [...bubbleCalls, ...agentKvCalls];
          await writeCachedResults(dbPath, allCalls);
        } finally {
          db.close();
        }
      }
      for (const call of allCalls) {
        if (composerFilter !== null) {
          const inSet = composerFilter.has(call.sessionId);
          if (filterMode === "include" && !inSet) continue;
          if (filterMode === "exclude" && inSet) continue;
        }
        if (seenKeys.has(call.deduplicationKey)) continue;
        seenKeys.add(call.deduplicationKey);
        yield call;
      }
    }
  };
}
function createCursorProvider(dbPathOverride) {
  return {
    name: "cursor",
    displayName: "Cursor",
    modelDisplayName(model) {
      return modelDisplayNames9[model] ?? model;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      if (!isSqliteAvailable()) return [];
      const dbPath = dbPathOverride ?? getCursorDbPath();
      if (!existsSync4(dbPath)) return [];
      const wsMap = loadWorkspaceMap(getCursorWorkspaceStorageDir(dbPath));
      const sources = [];
      for (const [folder, project] of wsMap.workspaceProjectName) {
        sources.push({
          path: encodeSourcePath(dbPath, folder),
          project,
          provider: "cursor"
        });
      }
      sources.push({
        path: encodeSourcePath(dbPath, ORPHAN_TAG),
        project: ORPHAN_PROJECT,
        provider: "cursor"
      });
      return sources;
    },
    createSessionParser(source, seenKeys) {
      return createParser16(source, seenKeys);
    }
  };
}
var CURSOR_COST_MODEL, modelDisplayNames9, CHARS_PER_TOKEN5, ORPHAN_TAG, ORPHAN_PROJECT, workspaceMapCache, workspaceMapCacheRoot, WORKSPACE_SEP, BUBBLE_QUERY_BASE, AGENTKV_QUERY, USER_MESSAGES_QUERY, BUBBLE_QUERY_SINCE_HEAD, BUBBLE_QUERY_SINCE_TAIL, BUBBLE_QUERY_SINCE, cursor;
var init_cursor = __esm({
  "src/providers/cursor.ts"() {
    "use strict";
    init_models();
    init_cursor_cache();
    init_sqlite();
    CURSOR_COST_MODEL = "claude-sonnet-4-5";
    modelDisplayNames9 = {
      "claude-4.5-opus-high-thinking": "Opus 4.5 (Thinking)",
      "claude-4-opus": "Opus 4",
      "claude-4-sonnet-thinking": "Sonnet 4 (Thinking)",
      "claude-4.5-sonnet-thinking": "Sonnet 4.5 (Thinking)",
      "claude-4.6-sonnet": "Sonnet 4.6",
      "composer-1": "Composer 1",
      "grok-code-fast-1": "Grok Code Fast",
      "gemini-3-pro": "Gemini 3 Pro",
      "gpt-5.2-low": "GPT-5.2 Low",
      "gpt-5.2": "GPT-5.2",
      "gpt-5.1-codex-high": "GPT-5.1 Codex",
      "gpt-5": "GPT-5",
      "gpt-4.1": "GPT-4.1",
      "cursor-auto": "Cursor (auto)"
    };
    CHARS_PER_TOKEN5 = 4;
    ORPHAN_TAG = "__orphan__";
    ORPHAN_PROJECT = "cursor";
    workspaceMapCache = null;
    workspaceMapCacheRoot = null;
    WORKSPACE_SEP = "#cursor-ws=";
    BUBBLE_QUERY_BASE = `
  SELECT
    key as bubble_key,
    json_extract(value, '$.tokenCount.inputTokens') as input_tokens,
    json_extract(value, '$.tokenCount.outputTokens') as output_tokens,
    json_extract(value, '$.modelInfo.modelName') as model,
    json_extract(value, '$.createdAt') as created_at,
    json_extract(value, '$.conversationId') as conversation_id,
    CAST(substr(json_extract(value, '$.text'), 1, 500) AS BLOB) as user_text,
    length(json_extract(value, '$.text')) as text_length,
    json_extract(value, '$.type') as bubble_type,
    CAST(json_extract(value, '$.codeBlocks') AS BLOB) as code_blocks
  FROM cursorDiskKV
  WHERE key LIKE 'bubbleId:%'
`;
    AGENTKV_QUERY = `
  SELECT
    key,
    json_extract(value, '$.role') as role,
    CAST(json_extract(value, '$.content') AS BLOB) as content,
    json_extract(value, '$.providerOptions.cursor.requestId') as request_id,
    length(value) as content_length
  FROM cursorDiskKV
  WHERE key LIKE 'agentKv:blob:%'
    AND hex(substr(value, 1, 1)) = '7B'
  ORDER BY ROWID ASC
`;
    USER_MESSAGES_QUERY = `
  SELECT
    json_extract(value, '$.conversationId') as conversation_id,
    json_extract(value, '$.createdAt') as created_at,
    CAST(substr(json_extract(value, '$.text'), 1, 500) AS BLOB) as text
  FROM cursorDiskKV
  WHERE key LIKE 'bubbleId:%'
    AND json_extract(value, '$.type') = 1
    AND (json_extract(value, '$.createdAt') > ? OR json_extract(value, '$.createdAt') IS NULL)
  ORDER BY ROWID ASC
`;
    BUBBLE_QUERY_SINCE_HEAD = BUBBLE_QUERY_BASE + `
    AND json_extract(value, '$.createdAt') IS NOT NULL
    AND json_extract(value, '$.createdAt') > ?`;
    BUBBLE_QUERY_SINCE_TAIL = `
  ORDER BY ROWID ASC
`;
    BUBBLE_QUERY_SINCE = BUBBLE_QUERY_SINCE_HEAD + BUBBLE_QUERY_SINCE_TAIL;
    cursor = createCursorProvider();
  }
});

// src/providers/opencode.ts
var opencode_exports = {};
__export(opencode_exports, {
  createOpenCodeProvider: () => createOpenCodeProvider,
  opencode: () => opencode
});
import { join as join31 } from "path";
import { homedir as homedir28 } from "os";
function getDataDir(dataDir) {
  const base = dataDir ?? process.env["XDG_DATA_HOME"] ?? join31(homedir28(), ".local", "share");
  return join31(base, "opencode");
}
function getSqliteConfig2(dataDir) {
  return {
    providerName: "opencode",
    displayName: "OpenCode",
    dbDir: getDataDir(dataDir),
    dbFilePrefix: "opencode"
  };
}
function createOpenCodeProvider(dataDir) {
  const sqliteConfig = getSqliteConfig2(dataDir);
  return {
    name: "opencode",
    displayName: "OpenCode",
    modelDisplayName(model) {
      const stripped = model.replace(/^[^/]+\//, "");
      return getShortModelName(stripped);
    },
    toolDisplayName(rawTool) {
      return toolNameMap14[rawTool] ?? rawTool;
    },
    async discoverSessions() {
      return discoverSqliteSessions(sqliteConfig);
    },
    createSessionParser(source, seenKeys) {
      return createSqliteSessionParser(source, seenKeys, sqliteConfig);
    }
  };
}
var toolNameMap14, opencode;
var init_opencode = __esm({
  "src/providers/opencode.ts"() {
    "use strict";
    init_models();
    init_sqlite_session_parser();
    toolNameMap14 = {
      bash: "Bash",
      read: "Read",
      edit: "Edit",
      write: "Write",
      glob: "Glob",
      grep: "Grep",
      task: "Agent",
      fetch: "WebFetch",
      search: "WebSearch",
      todo: "TodoWrite",
      skill: "Skill",
      patch: "Patch"
    };
    opencode = createOpenCodeProvider();
  }
});

// src/providers/cursor-agent.ts
var cursor_agent_exports = {};
__export(cursor_agent_exports, {
  createCursorAgentProvider: () => createCursorAgentProvider,
  cursor_agent: () => cursor_agent
});
import { createHash as createHash3 } from "crypto";
import { existsSync as existsSync5 } from "fs";
import { readdir as readdir17, readFile as readFile17, stat as stat19 } from "fs/promises";
import { join as join32, basename as basename15 } from "path";
import { homedir as homedir29 } from "os";
function getCursorAgentBaseDir(baseDirOverride) {
  if (baseDirOverride) return baseDirOverride;
  return join32(homedir29(), ".cursor");
}
function getProjectsDir(baseDir) {
  return join32(baseDir, "projects");
}
function getAttributionDbPath(baseDir) {
  return join32(baseDir, "ai-tracking", "ai-code-tracking.db");
}
function estimateTokens(charCount) {
  if (charCount <= 0) return 0;
  return Math.ceil(charCount / CHARS_PER_TOKEN6);
}
function parseToolName(raw) {
  const clean = raw.trim();
  if (clean.length === 0) return "unknown";
  return clean.toLowerCase().replace(/\s+/g, "-");
}
function normalizeTimestamp(raw) {
  if (raw === null || raw === void 0) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return null;
    if (DIGITS_ONLY.test(trimmed)) {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) {
        const ms2 = num < 1e12 ? num * 1e3 : num;
        return new Date(ms2).toISOString();
      }
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return null;
  }
  const ms = raw < 1e12 ? raw * 1e3 : raw;
  return new Date(ms).toISOString();
}
function prettifyProjectId(raw) {
  if (!raw) return raw;
  if (DIGITS_ONLY.test(raw)) {
    const num = Number(raw);
    if (!Number.isNaN(num) && raw.length >= 13) {
      const iso = new Date(num).toISOString();
      return `cursor-agent:${iso}`;
    }
  }
  const withoutPrefix = raw.replace(/^-Users-/, "");
  const parts = withoutPrefix.split("-").filter(Boolean);
  if (parts.length > 0) return parts[parts.length - 1];
  return raw;
}
function resolveModel5(raw) {
  if (!raw || raw === "default") return "cursor-agent-auto";
  return raw;
}
function costModel(model) {
  return model === "cursor-agent-auto" ? CURSOR_AGENT_COST_MODEL : model;
}
function toConversationId(transcriptPath) {
  const filename = basename15(transcriptPath, ".txt");
  if (filename.length === 36 && UUID_LIKE.test(filename)) return filename;
  return createHash3("sha1").update(transcriptPath).digest("hex").slice(0, 16);
}
function extractUserQuery(userBlock) {
  const chunks = [];
  let cursor2 = 0;
  while (cursor2 < userBlock.length) {
    const openIndex = userBlock.indexOf(USER_QUERY_OPEN, cursor2);
    if (openIndex === -1) break;
    const start = openIndex + USER_QUERY_OPEN.length;
    const closeIndex = userBlock.indexOf(USER_QUERY_CLOSE, start);
    if (closeIndex === -1) {
      chunks.push(userBlock.slice(start).trim());
      break;
    }
    chunks.push(userBlock.slice(start, closeIndex).trim());
    cursor2 = closeIndex + USER_QUERY_CLOSE.length;
  }
  const combined = chunks.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return combined.slice(0, MAX_USER_TEXT_LENGTH);
}
function parseJsonlTranscript(raw) {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { turns: [], recognized: false };
  const turns = [];
  let currentUserMessage = "";
  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.role === "user") {
      const texts = (entry.message?.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "");
      const combined = texts.join(" ");
      currentUserMessage = extractUserQuery(combined) || combined.slice(0, MAX_USER_TEXT_LENGTH);
      continue;
    }
    if (entry.role === "assistant" && currentUserMessage) {
      const content = entry.message?.content ?? [];
      const bodyParts = [];
      const tools = [];
      for (const block of content) {
        if (block.type === "text" && block.text) {
          bodyParts.push(block.text);
        } else if (block.type === "tool_use" && block.name) {
          tools.push(`cursor:${block.name.toLowerCase()}`);
        }
      }
      turns.push({
        userMessage: currentUserMessage,
        assistant: {
          body: bodyParts.join("\n").trim(),
          reasoning: "",
          tools
        }
      });
      currentUserMessage = "";
    }
  }
  return { turns, recognized: turns.length > 0 };
}
function parseTranscript(raw) {
  const lines = raw.split(/\r?\n/);
  let recognized = false;
  const pendingUsers = [];
  const turns = [];
  let active2 = "none";
  let userLines = [];
  let assistantLines = [];
  const flushUser = () => {
    if (userLines.length === 0) return;
    const userQuery = extractUserQuery(userLines.join("\n"));
    if (userQuery.length > 0) pendingUsers.push(userQuery);
    userLines = [];
  };
  const flushAssistant = () => {
    if (assistantLines.length === 0) return;
    let output = "";
    let reasoning = "";
    const toolsByTurn = /* @__PURE__ */ Object.create(null);
    for (const line of assistantLines) {
      if (TOOL_RESULT_MARKER.test(line)) continue;
      const thinkingMatch = line.match(THINKING_MARKER);
      if (thinkingMatch) {
        const body = line.replace(THINKING_MARKER, "").trim();
        if (body.length > 0) reasoning += `${body}
`;
        continue;
      }
      const toolMatch = line.match(TOOL_CALL_MARKER);
      if (toolMatch) {
        const parsedTool = parseToolName(toolMatch[1] ?? "");
        const toolKey = `cursor:${parsedTool}`;
        toolsByTurn[toolKey] = true;
        continue;
      }
      output += `${line}
`;
    }
    if (pendingUsers.length > 0) {
      const userMessage = pendingUsers.shift();
      const tools = Object.keys(toolsByTurn);
      turns.push({
        userMessage,
        assistant: {
          body: output.trim(),
          reasoning: reasoning.trim(),
          tools
        }
      });
    }
    assistantLines = [];
  };
  for (const line of lines) {
    if (USER_MARKER.test(line)) {
      recognized = true;
      if (active2 === "user") flushUser();
      if (active2 === "assistant") flushAssistant();
      active2 = "user";
      userLines = [line.replace(USER_MARKER, "")];
      continue;
    }
    if (ASSISTANT_MARKER.test(line)) {
      recognized = true;
      if (active2 === "user") flushUser();
      if (active2 === "assistant") flushAssistant();
      active2 = "assistant";
      assistantLines = [line.replace(ASSISTANT_MARKER, "")];
      continue;
    }
    if (active2 === "user") {
      userLines.push(line);
      continue;
    }
    if (active2 === "assistant") {
      assistantLines.push(line);
    }
  }
  if (active2 === "user") flushUser();
  if (active2 === "assistant") flushAssistant();
  return { turns, recognized };
}
function createParser17(source, seenKeys, dbPath, summariesByConversationId) {
  return {
    async *parse() {
      const conversationId = toConversationId(source.path);
      let summary = summariesByConversationId[conversationId];
      let db = null;
      try {
        if (!summary) {
          if (existsSync5(dbPath)) {
            try {
              db = openDatabase(dbPath);
              const rows = db.query(CONVERSATION_SUMMARY_QUERY, [conversationId]);
              if (rows.length > 0) {
                const row = rows[0];
                summary = {
                  conversationId: row.conversationId,
                  model: row.model,
                  title: row.title,
                  updatedAt: normalizeTimestamp(row.updatedAt)
                };
                summariesByConversationId[conversationId] = summary;
              }
            } catch {
              summary = void 0;
            }
          }
        }
        const transcript = await readFile17(source.path, "utf-8");
        const isJsonl = source.path.endsWith(".jsonl");
        const parsed = isJsonl ? parseJsonlTranscript(transcript) : parseTranscript(transcript);
        if (!parsed.recognized) {
          process.stderr.write(`codeburn: skipped ${basename15(source.path)}: unrecognized cursor-agent transcript format
`);
          return;
        }
        let timestamp = summary?.updatedAt ?? null;
        if (!timestamp) {
          const fileStat = await stat19(source.path);
          timestamp = fileStat.mtime.toISOString();
        }
        const model = resolveModel5(summary?.model ?? null);
        for (let turnIndex = 0; turnIndex < parsed.turns.length; turnIndex++) {
          const turn = parsed.turns[turnIndex];
          const inputTokens = estimateTokens(turn.userMessage.length);
          const outputTokens = estimateTokens(turn.assistant.body.length);
          const reasoningTokens = estimateTokens(turn.assistant.reasoning.length);
          const deduplicationKey = `cursor-agent:${conversationId}:${turnIndex}`;
          if (seenKeys.has(deduplicationKey)) continue;
          seenKeys.add(deduplicationKey);
          const costUSD = calculateCost(
            costModel(model),
            inputTokens,
            outputTokens + reasoningTokens,
            0,
            0,
            0
          );
          yield {
            provider: "cursor-agent",
            model,
            inputTokens,
            outputTokens,
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
            cachedInputTokens: 0,
            reasoningTokens,
            webSearchRequests: 0,
            costUSD,
            tools: turn.assistant.tools,
            bashCommands: [],
            timestamp,
            speed: "standard",
            deduplicationKey,
            userMessage: turn.userMessage,
            sessionId: conversationId
          };
        }
      } finally {
        db?.close();
      }
    }
  };
}
function createCursorAgentProvider(baseDirOverride) {
  const baseDir = getCursorAgentBaseDir(baseDirOverride);
  const projectsDir = getProjectsDir(baseDir);
  const dbPath = getAttributionDbPath(baseDir);
  const summariesByConversationId = /* @__PURE__ */ Object.create(null);
  return {
    name: "cursor-agent",
    displayName: "Cursor Agent",
    modelDisplayName(model) {
      if (model === "cursor-agent-auto") return "Cursor (auto)";
      const label = modelDisplayNames10[model] ?? model;
      return `${label} (est.)`;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      if (!existsSync5(projectsDir)) return [];
      const projectEntries = await readdir17(projectsDir, { withFileTypes: true });
      const sources = [];
      for (const entry of projectEntries) {
        if (!entry.isDirectory()) continue;
        const projectId = prettifyProjectId(entry.name);
        const transcriptDir = join32(projectsDir, entry.name, "agent-transcripts");
        if (!existsSync5(transcriptDir)) continue;
        const transcriptEntries = await readdir17(transcriptDir, { withFileTypes: true });
        for (const transcript of transcriptEntries) {
          if (transcript.isFile() && transcript.name.endsWith(".txt")) {
            const transcriptPath = join32(transcriptDir, transcript.name);
            sources.push({
              path: transcriptPath,
              project: projectId,
              provider: "cursor-agent"
            });
            continue;
          }
          if (transcript.isDirectory() && UUID_LIKE.test(transcript.name)) {
            const subdir = join32(transcriptDir, transcript.name);
            const subEntries = await readdir17(subdir, { withFileTypes: true }).catch(() => []);
            for (const sub of subEntries) {
              if (sub.isFile() && (sub.name.endsWith(".jsonl") || sub.name.endsWith(".txt"))) {
                sources.push({
                  path: join32(subdir, sub.name),
                  project: projectId,
                  provider: "cursor-agent"
                });
              }
              if (sub.isDirectory() && sub.name === "subagents") {
                const subagentEntries = await readdir17(join32(subdir, sub.name), { withFileTypes: true }).catch(() => []);
                for (const sa of subagentEntries) {
                  if (!sa.isFile()) continue;
                  if (!sa.name.endsWith(".jsonl") && !sa.name.endsWith(".txt")) continue;
                  sources.push({
                    path: join32(subdir, sub.name, sa.name),
                    project: projectId,
                    provider: "cursor-agent"
                  });
                }
              }
            }
          }
        }
      }
      return sources;
    },
    createSessionParser(source, seenKeys) {
      return createParser17(source, seenKeys, dbPath, summariesByConversationId);
    }
  };
}
var CURSOR_AGENT_COST_MODEL, CHARS_PER_TOKEN6, MAX_USER_TEXT_LENGTH, DIGITS_ONLY, UUID_LIKE, USER_MARKER, ASSISTANT_MARKER, THINKING_MARKER, TOOL_CALL_MARKER, TOOL_RESULT_MARKER, USER_QUERY_OPEN, USER_QUERY_CLOSE, CONVERSATION_SUMMARY_QUERY, modelDisplayNames10, cursor_agent;
var init_cursor_agent = __esm({
  "src/providers/cursor-agent.ts"() {
    "use strict";
    init_models();
    init_sqlite();
    CURSOR_AGENT_COST_MODEL = "claude-sonnet-4-5";
    CHARS_PER_TOKEN6 = 4;
    MAX_USER_TEXT_LENGTH = 500;
    DIGITS_ONLY = /^\d+$/;
    UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    USER_MARKER = /^\s*user:\s*/i;
    ASSISTANT_MARKER = /^\s*A:\s*/;
    THINKING_MARKER = /^\s*\[Thinking\]\s*/;
    TOOL_CALL_MARKER = /^\s*\[Tool call\]\s*(.+?)\s*$/i;
    TOOL_RESULT_MARKER = /^\s*\[Tool result\]\b/i;
    USER_QUERY_OPEN = "<user_query>";
    USER_QUERY_CLOSE = "</user_query>";
    CONVERSATION_SUMMARY_QUERY = `
  SELECT conversationId, model, title, updatedAt
  FROM conversation_summaries
  WHERE conversationId = ?
`;
    modelDisplayNames10 = {
      "claude-4.5-opus-high-thinking": "Opus 4.5 (Thinking)",
      "claude-4-opus": "Opus 4",
      "claude-4-sonnet-thinking": "Sonnet 4 (Thinking)",
      "claude-4.5-sonnet-thinking": "Sonnet 4.5 (Thinking)",
      "claude-4.6-sonnet": "Sonnet 4.6",
      "composer-1": "Composer 1",
      "grok-code-fast-1": "Grok Code Fast",
      "gemini-3-pro": "Gemini 3 Pro",
      "gpt-5.1-codex-high": "GPT-5.1 Codex",
      "gpt-5": "GPT-5",
      "gpt-4.1": "GPT-4.1",
      default: "Auto (Sonnet est.)"
    };
    cursor_agent = createCursorAgentProvider();
  }
});

// src/providers/crush.ts
var crush_exports = {};
__export(crush_exports, {
  createCrushProvider: () => createCrushProvider,
  crush: () => crush
});
import { readFile as readFile18 } from "fs/promises";
import { join as join33, resolve as resolve3 } from "path";
import { homedir as homedir30, platform as platform3 } from "os";
function getRegistryPath() {
  const explicit = process.env["CRUSH_GLOBAL_DATA"];
  if (explicit) return join33(explicit, "projects.json");
  if (platform3() === "win32") {
    const localAppData = process.env["LOCALAPPDATA"] ?? join33(homedir30(), "AppData", "Local");
    return join33(localAppData, "crush", "projects.json");
  }
  const xdg = process.env["XDG_DATA_HOME"] ?? join33(homedir30(), ".local", "share");
  return join33(xdg, "crush", "projects.json");
}
async function loadRegistry(path) {
  let raw;
  try {
    raw = await readFile18(path, "utf-8");
  } catch {
    return [];
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  let entries;
  if (Array.isArray(parsed)) {
    entries = parsed;
  } else if (parsed && typeof parsed === "object") {
    entries = Object.values(parsed);
  } else {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e || typeof e !== "object") continue;
    const obj = e;
    if (typeof obj["path"] !== "string" || typeof obj["data_dir"] !== "string") continue;
    out.push({ path: obj["path"], data_dir: obj["data_dir"] });
  }
  return out;
}
function resolveDbPath(entry) {
  return join33(resolve3(entry.path, entry.data_dir), "crush.db");
}
function sanitizeProject3(path) {
  return path.replace(/^\//, "").replace(/\//g, "-");
}
function validateSchema5(db) {
  try {
    db.query("SELECT COUNT(*) as cnt FROM sessions LIMIT 1");
    db.query("SELECT COUNT(*) as cnt FROM messages LIMIT 1");
    return true;
  } catch {
    return false;
  }
}
function epochSecondsToIso(epochSeconds) {
  if (epochSeconds === null || !Number.isFinite(epochSeconds)) {
    return (/* @__PURE__ */ new Date(0)).toISOString();
  }
  return new Date(epochSeconds * 1e3).toISOString();
}
function dominantModel(db, sessionId) {
  try {
    const rows = db.query(
      `SELECT model FROM messages
       WHERE session_id = ? AND model IS NOT NULL AND model <> ''
       GROUP BY model
       ORDER BY COUNT(*) DESC
       LIMIT 1`,
      [sessionId]
    );
    if (rows.length === 0) return "unknown";
    return rows[0].model ?? "unknown";
  } catch {
    return "unknown";
  }
}
function createParser18(source, seenKeys) {
  return {
    async *parse() {
      if (!isSqliteAvailable()) {
        process.stderr.write(getSqliteLoadError() + "\n");
        return;
      }
      const segments = source.path.split(":");
      const sessionId = segments[segments.length - 1];
      const dbPath = segments.slice(0, -1).join(":");
      let db;
      try {
        db = openDatabase(dbPath);
      } catch (err) {
        process.stderr.write(
          `codeburn: cannot open Crush database: ${err instanceof Error ? err.message : err}
`
        );
        return;
      }
      try {
        if (!validateSchema5(db)) return;
        const rows = db.query(
          `SELECT id, prompt_tokens, completion_tokens, cost, created_at, updated_at, message_count
           FROM sessions
           WHERE id = ? AND parent_session_id IS NULL`,
          [sessionId]
        );
        if (rows.length === 0) return;
        const session = rows[0];
        const inputTokens = session.prompt_tokens ?? 0;
        const outputTokens = session.completion_tokens ?? 0;
        const cost = session.cost ?? 0;
        if (inputTokens === 0 && outputTokens === 0 && cost === 0) return;
        const dedupKey = `crush:${sessionId}`;
        if (seenKeys.has(dedupKey)) return;
        seenKeys.add(dedupKey);
        const model = dominantModel(db, sessionId);
        const costUSD = cost > 0 ? cost : calculateCost(model, inputTokens, outputTokens, 0, 0, 0);
        yield {
          provider: "crush",
          model,
          inputTokens,
          outputTokens,
          cacheCreationInputTokens: 0,
          cacheReadInputTokens: 0,
          cachedInputTokens: 0,
          reasoningTokens: 0,
          webSearchRequests: 0,
          costUSD,
          tools: [],
          bashCommands: [],
          timestamp: epochSecondsToIso(session.updated_at ?? session.created_at),
          speed: "standard",
          deduplicationKey: dedupKey,
          userMessage: "",
          sessionId
        };
      } finally {
        db.close();
      }
    }
  };
}
async function discoverFromDb4(dbPath, project) {
  let db;
  try {
    db = openDatabase(dbPath);
  } catch {
    return [];
  }
  try {
    if (!validateSchema5(db)) return [];
    const rows = db.query(
      `SELECT id FROM sessions
       WHERE parent_session_id IS NULL
         AND (cost > 0 OR prompt_tokens > 0 OR completion_tokens > 0)
       ORDER BY created_at DESC`
    );
    return rows.map((row) => ({
      path: `${dbPath}:${row.id}`,
      project,
      provider: "crush"
    }));
  } catch {
    return [];
  } finally {
    db.close();
  }
}
function createCrushProvider() {
  return {
    name: "crush",
    displayName: "Crush",
    modelDisplayName(model) {
      return model;
    },
    toolDisplayName(rawTool) {
      return rawTool;
    },
    async discoverSessions() {
      if (!isSqliteAvailable()) return [];
      const registry = await loadRegistry(getRegistryPath());
      const sources = [];
      for (const entry of registry) {
        const dbPath = resolveDbPath(entry);
        const project = sanitizeProject3(entry.path);
        const found = await discoverFromDb4(dbPath, project);
        sources.push(...found);
      }
      return sources;
    },
    createSessionParser(source, seenKeys) {
      return createParser18(source, seenKeys);
    }
  };
}
var crush;
var init_crush = __esm({
  "src/providers/crush.ts"() {
    "use strict";
    init_models();
    init_sqlite();
    crush = createCrushProvider();
  }
});

// src/providers/index.ts
async function loadAntigravity() {
  if (antigravityLoadAttempted) return antigravityProvider;
  antigravityLoadAttempted = true;
  try {
    const { antigravity: antigravity2 } = await Promise.resolve().then(() => (init_antigravity(), antigravity_exports));
    antigravityProvider = antigravity2;
    return antigravity2;
  } catch {
    return null;
  }
}
async function loadWarp() {
  if (warpLoadAttempted) return warpProvider;
  warpLoadAttempted = true;
  try {
    const { warp: warp2 } = await Promise.resolve().then(() => (init_warp(), warp_exports));
    warpProvider = warp2;
    return warp2;
  } catch {
    return null;
  }
}
async function loadForge() {
  if (forgeLoadAttempted) return forgeProvider;
  forgeLoadAttempted = true;
  try {
    const { forge: forge2 } = await Promise.resolve().then(() => (init_forge(), forge_exports));
    forgeProvider = forge2;
    return forge2;
  } catch {
    return null;
  }
}
async function loadGoose() {
  if (gooseLoadAttempted) return gooseProvider;
  gooseLoadAttempted = true;
  try {
    const { goose: goose2 } = await Promise.resolve().then(() => (init_goose(), goose_exports));
    gooseProvider = goose2;
    return goose2;
  } catch {
    return null;
  }
}
async function loadCursor() {
  if (cursorLoadAttempted) return cursorProvider;
  cursorLoadAttempted = true;
  try {
    const { cursor: cursor2 } = await Promise.resolve().then(() => (init_cursor(), cursor_exports));
    cursorProvider = cursor2;
    return cursor2;
  } catch {
    return null;
  }
}
async function loadOpenCode() {
  if (opencodeLoadAttempted) return opencodeProvider;
  opencodeLoadAttempted = true;
  try {
    const { opencode: opencode2 } = await Promise.resolve().then(() => (init_opencode(), opencode_exports));
    opencodeProvider = opencode2;
    return opencode2;
  } catch {
    return null;
  }
}
async function loadCursorAgent() {
  if (cursorAgentLoadAttempted) return cursorAgentProvider;
  cursorAgentLoadAttempted = true;
  try {
    const { cursor_agent: cursor_agent2 } = await Promise.resolve().then(() => (init_cursor_agent(), cursor_agent_exports));
    cursorAgentProvider = cursor_agent2;
    return cursor_agent2;
  } catch {
    return null;
  }
}
async function loadCrush() {
  if (crushLoadAttempted) return crushProvider;
  crushLoadAttempted = true;
  try {
    const { crush: crush2 } = await Promise.resolve().then(() => (init_crush(), crush_exports));
    crushProvider = crush2;
    return crush2;
  } catch {
    return null;
  }
}
async function getAllProviders() {
  const [ag, forge2, gs, cursor2, opencode2, cursorAgent, crush2, warp2] = await Promise.all([loadAntigravity(), loadForge(), loadGoose(), loadCursor(), loadOpenCode(), loadCursorAgent(), loadCrush(), loadWarp()]);
  const all = [...coreProviders];
  if (ag) all.push(ag);
  if (forge2) all.push(forge2);
  if (gs) all.push(gs);
  if (cursor2) all.push(cursor2);
  if (opencode2) all.push(opencode2);
  if (cursorAgent) all.push(cursorAgent);
  if (crush2) all.push(crush2);
  if (warp2) all.push(warp2);
  return all;
}
async function discoverAllSessions(providerFilter) {
  const allProviders = await getAllProviders();
  const filtered = providerFilter && providerFilter !== "all" ? allProviders.filter((p) => p.name === providerFilter) : allProviders;
  const all = [];
  for (const provider of filtered) {
    const sessions = await provider.discoverSessions();
    all.push(...sessions);
  }
  return all;
}
async function getProvider(name) {
  if (name === "antigravity") {
    const ag = await loadAntigravity();
    return ag ?? void 0;
  }
  if (name === "forge") {
    const forge2 = await loadForge();
    return forge2 ?? void 0;
  }
  if (name === "goose") {
    const gs = await loadGoose();
    return gs ?? void 0;
  }
  if (name === "cursor") {
    const cursor2 = await loadCursor();
    return cursor2 ?? void 0;
  }
  if (name === "opencode") {
    const oc = await loadOpenCode();
    return oc ?? void 0;
  }
  if (name === "cursor-agent") {
    const ca = await loadCursorAgent();
    return ca ?? void 0;
  }
  if (name === "crush") {
    const c = await loadCrush();
    return c ?? void 0;
  }
  if (name === "warp") {
    const w = await loadWarp();
    return w ?? void 0;
  }
  return coreProviders.find((p) => p.name === name);
}
var antigravityProvider, antigravityLoadAttempted, warpProvider, warpLoadAttempted, forgeProvider, forgeLoadAttempted, gooseProvider, gooseLoadAttempted, cursorProvider, cursorLoadAttempted, opencodeProvider, opencodeLoadAttempted, cursorAgentProvider, cursorAgentLoadAttempted, crushProvider, crushLoadAttempted, coreProviders;
var init_providers = __esm({
  "src/providers/index.ts"() {
    "use strict";
    init_claude();
    init_cline();
    init_codebuff();
    init_codex();
    init_copilot();
    init_droid();
    init_gemini();
    init_ibm_bob();
    init_kilo_code();
    init_kiro();
    init_kimi();
    init_mistral_vibe();
    init_openclaw();
    init_pi();
    init_qwen();
    init_roo_code();
    antigravityProvider = null;
    antigravityLoadAttempted = false;
    warpProvider = null;
    warpLoadAttempted = false;
    forgeProvider = null;
    forgeLoadAttempted = false;
    gooseProvider = null;
    gooseLoadAttempted = false;
    cursorProvider = null;
    cursorLoadAttempted = false;
    opencodeProvider = null;
    opencodeLoadAttempted = false;
    cursorAgentProvider = null;
    cursorAgentLoadAttempted = false;
    crushProvider = null;
    crushLoadAttempted = false;
    coreProviders = [claude, cline, codebuff, codex, copilot, droid, gemini, ibmBob, kiloCode, kiro, kimi, mistralVibe, openclaw, pi, omp, qwen, rooCode];
  }
});

// src/session-cache.ts
import { readFile as readFile19, stat as stat20, open as open5, rename as rename6, unlink as unlink4, readdir as readdir18, mkdir as mkdir9 } from "fs/promises";
import { existsSync as existsSync6 } from "fs";
import { createHash as createHash4, randomBytes as randomBytes5 } from "crypto";
import { join as join34 } from "path";
import { homedir as homedir31 } from "os";
function getCacheDir6() {
  return process.env["CODEBURN_CACHE_DIR"] ?? join34(homedir31(), ".cache", "codeburn");
}
function getCachePath5() {
  return join34(getCacheDir6(), CACHE_FILE3);
}
function computeEnvFingerprint(provider) {
  const vars = PROVIDER_ENV_VARS[provider] ?? [];
  const parts = vars.map((v) => `${v}=${process.env[v] ?? ""}`);
  const parseVersion = PROVIDER_PARSE_VERSIONS[provider];
  if (parseVersion) parts.push(`parser=${parseVersion}`);
  return createHash4("sha256").update(parts.join("\0")).digest("hex").slice(0, 16);
}
function emptyCache() {
  return { version: CACHE_VERSION2, providers: {} };
}
function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function isStringArray(v) {
  return Array.isArray(v) && v.every((e) => typeof e === "string");
}
function isOptionalString(v) {
  return v === void 0 || typeof v === "string";
}
function isOptionalNum(v) {
  return v === void 0 || isNum(v);
}
function isToolCall(v) {
  if (!v || typeof v !== "object") return false;
  const o = v;
  return typeof o["tool"] === "string" && isOptionalString(o["file"]) && isOptionalString(o["command"]);
}
function isToolCallArray(v) {
  return Array.isArray(v) && v.every(isToolCall);
}
function validateFingerprint(fp) {
  if (!fp || typeof fp !== "object") return false;
  const f = fp;
  return isNum(f["dev"]) && isNum(f["ino"]) && isNum(f["mtimeMs"]) && isNum(f["sizeBytes"]);
}
function validateUsage(u) {
  if (!u || typeof u !== "object") return false;
  const o = u;
  return isNum(o["inputTokens"]) && isNum(o["outputTokens"]) && isNum(o["cacheCreationInputTokens"]) && isNum(o["cacheReadInputTokens"]) && isNum(o["cachedInputTokens"]) && isNum(o["reasoningTokens"]) && isNum(o["webSearchRequests"]) && isNum(o["cacheCreationOneHourTokens"]);
}
function validateCall(c) {
  if (!c || typeof c !== "object") return false;
  const o = c;
  return typeof o["provider"] === "string" && typeof o["model"] === "string" && typeof o["deduplicationKey"] === "string" && typeof o["timestamp"] === "string" && (o["speed"] === "standard" || o["speed"] === "fast") && isOptionalNum(o["costUSD"]) && isStringArray(o["tools"]) && isStringArray(o["bashCommands"]) && isStringArray(o["skills"]) && (o["subagentTypes"] === void 0 || isStringArray(o["subagentTypes"])) && isOptionalString(o["project"]) && isOptionalString(o["projectPath"]) && (o["toolSequence"] === void 0 || Array.isArray(o["toolSequence"]) && o["toolSequence"].every((s) => isToolCallArray(s))) && validateUsage(o["usage"]);
}
function validateTurn(t) {
  if (!t || typeof t !== "object") return false;
  const o = t;
  return typeof o["timestamp"] === "string" && typeof o["sessionId"] === "string" && typeof o["userMessage"] === "string" && Array.isArray(o["calls"]) && o["calls"].every(validateCall);
}
function validateCachedFile(f) {
  if (!f || typeof f !== "object") return false;
  const o = f;
  return validateFingerprint(o["fingerprint"]) && isOptionalNum(o["lastCompleteLineOffset"]) && isOptionalString(o["canonicalCwd"]) && isOptionalString(o["canonicalProjectName"]) && isStringArray(o["mcpInventory"]) && Array.isArray(o["turns"]) && o["turns"].every(validateTurn);
}
function validateProviderSection(s) {
  if (!s || typeof s !== "object") return false;
  const o = s;
  if (typeof o["envFingerprint"] !== "string") return false;
  if (!o["files"] || typeof o["files"] !== "object" || Array.isArray(o["files"])) return false;
  return Object.values(o["files"]).every(validateCachedFile);
}
function validateCache(raw) {
  if (!raw || typeof raw !== "object") return false;
  const o = raw;
  if (o["version"] !== CACHE_VERSION2) return false;
  if (!o["providers"] || typeof o["providers"] !== "object" || Array.isArray(o["providers"])) return false;
  return Object.values(o["providers"]).every(validateProviderSection);
}
async function loadCache3() {
  try {
    const raw = await readFile19(getCachePath5(), "utf-8");
    const parsed = JSON.parse(raw);
    if (!validateCache(parsed)) return emptyCache();
    return parsed;
  } catch {
    return emptyCache();
  }
}
async function saveCache(cache) {
  const dir = getCacheDir6();
  if (!existsSync6(dir)) await mkdir9(dir, { recursive: true });
  const finalPath = getCachePath5();
  const tempPath = `${finalPath}.${randomBytes5(8).toString("hex")}.tmp`;
  delete cache._dirty;
  const payload = JSON.stringify(cache);
  const handle = await open5(tempPath, "w", 384);
  try {
    await handle.writeFile(payload, { encoding: "utf-8" });
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename6(tempPath, finalPath);
  } catch (err) {
    try {
      await unlink4(tempPath);
    } catch {
    }
    throw err;
  }
}
async function fingerprintFile2(filePath) {
  try {
    const s = await stat20(filePath);
    return { dev: s.dev, ino: s.ino, mtimeMs: s.mtimeMs, sizeBytes: s.size };
  } catch {
    const hashIdx = filePath.indexOf("#");
    if (hashIdx > 0) {
      try {
        const s = await stat20(filePath.slice(0, hashIdx));
        return { dev: s.dev, ino: s.ino, mtimeMs: s.mtimeMs, sizeBytes: s.size };
      } catch {
      }
    }
    const colonIdx = filePath.lastIndexOf(":");
    if (colonIdx > 0) {
      try {
        const s = await stat20(filePath.slice(0, colonIdx));
        return { dev: s.dev, ino: s.ino, mtimeMs: s.mtimeMs, sizeBytes: s.size };
      } catch {
        return null;
      }
    }
    return null;
  }
}
function reconcileFile(current, cached) {
  if (!cached) return { action: "new" };
  const fp = cached.fingerprint;
  if (fp.dev === current.dev && fp.ino === current.ino && fp.mtimeMs === current.mtimeMs && fp.sizeBytes === current.sizeBytes) {
    return { action: "unchanged" };
  }
  if (cached.lastCompleteLineOffset !== void 0 && fp.dev === current.dev && fp.ino === current.ino && current.sizeBytes > fp.sizeBytes) {
    return { action: "appended", readFromOffset: cached.lastCompleteLineOffset };
  }
  return { action: "modified" };
}
async function cleanupOrphanedTempFiles() {
  const dir = getCacheDir6();
  if (!existsSync6(dir)) return;
  try {
    const entries = await readdir18(dir);
    const now = Date.now();
    const prefix = "session-cache.json.";
    for (const entry of entries) {
      if (!entry.startsWith(prefix) || !entry.endsWith(".tmp")) continue;
      try {
        const fullPath = join34(dir, entry);
        const s = await stat20(fullPath);
        if (now - s.mtimeMs > TEMP_FILE_MAX_AGE_MS) {
          await unlink4(fullPath);
        }
      } catch {
      }
    }
  } catch {
  }
}
var CACHE_VERSION2, CACHE_FILE3, TEMP_FILE_MAX_AGE_MS, PROVIDER_ENV_VARS, PROVIDER_PARSE_VERSIONS;
var init_session_cache = __esm({
  "src/session-cache.ts"() {
    "use strict";
    CACHE_VERSION2 = 3;
    CACHE_FILE3 = "session-cache.json";
    TEMP_FILE_MAX_AGE_MS = 5 * 60 * 1e3;
    PROVIDER_ENV_VARS = {
      claude: ["CLAUDE_CONFIG_DIRS", "CLAUDE_CONFIG_DIR"],
      codex: ["CODEX_HOME"],
      droid: ["FACTORY_DIR"],
      cursor: ["XDG_DATA_HOME"],
      "cursor-agent": ["XDG_DATA_HOME"],
      opencode: ["XDG_DATA_HOME"],
      goose: ["XDG_DATA_HOME"],
      crush: ["XDG_DATA_HOME"],
      warp: ["WARP_DB_PATH"],
      antigravity: ["CODEBURN_CACHE_DIR"],
      qwen: ["QWEN_DATA_DIR"],
      "ibm-bob": ["XDG_CONFIG_HOME"]
    };
    PROVIDER_PARSE_VERSIONS = {
      claude: "cowork-space-grouping-v1",
      cline: "worktree-project-grouping-v1",
      copilot: "mcp-tool-normalization-v1",
      "ibm-bob": "worktree-project-grouping-v1",
      "kilo-code": "worktree-project-grouping-v1",
      "roo-code": "worktree-project-grouping-v1",
      warp: "worktree-project-grouping-v1"
    };
  }
});

// src/classifier.ts
function hasEditTools(tools) {
  return tools.some((t) => EDIT_TOOLS.has(t));
}
function hasReadTools(tools) {
  return tools.some((t) => READ_TOOLS.has(t));
}
function hasBashTool(tools) {
  return tools.some((t) => BASH_TOOLS.has(t));
}
function hasTaskTools(tools) {
  return tools.some((t) => TASK_TOOLS.has(t));
}
function hasSearchTools(tools) {
  return tools.some((t) => SEARCH_TOOLS.has(t));
}
function hasMcpTools(tools) {
  return tools.some((t) => t.startsWith("mcp__"));
}
function hasSkillTool(tools) {
  return tools.some((t) => t === "Skill");
}
function getAllTools(turn) {
  return turn.assistantCalls.flatMap((c) => c.tools);
}
function getAllSkills(turn) {
  return turn.assistantCalls.flatMap((c) => c.skills ?? []);
}
function classifyByToolPattern(turn) {
  const tools = getAllTools(turn);
  if (tools.length === 0) return null;
  if (turn.assistantCalls.some((c) => c.hasPlanMode)) return "planning";
  if (turn.assistantCalls.some((c) => c.hasAgentSpawn)) return "delegation";
  const hasEdits = hasEditTools(tools);
  const hasReads = hasReadTools(tools);
  const hasBash = hasBashTool(tools);
  const hasTasks = hasTaskTools(tools);
  const hasSearch = hasSearchTools(tools);
  const hasMcp = hasMcpTools(tools);
  const hasSkill = hasSkillTool(tools);
  if (hasBash && !hasEdits) {
    const userMsg = turn.userMessage;
    if (TEST_PATTERNS.test(userMsg)) return "testing";
    if (GIT_PATTERNS.test(userMsg)) return "git";
    if (BUILD_PATTERNS.test(userMsg)) return "build/deploy";
    if (INSTALL_PATTERNS.test(userMsg)) return "build/deploy";
  }
  if (hasEdits) return "coding";
  if (hasBash && hasReads) return "exploration";
  if (hasBash) return "coding";
  if (hasSearch || hasMcp) return "exploration";
  if (hasReads && !hasEdits) return "exploration";
  if (hasTasks && !hasEdits) return "planning";
  if (hasSkill) return "general";
  return null;
}
function firstMatchingCategory(text, candidates) {
  let best = null;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const m = c.regex.exec(text);
    if (!m) continue;
    if (!best || m.index < best.index || m.index === best.index && i < best.order) {
      best = { index: m.index, order: i, category: c.category };
    }
  }
  return best?.category ?? null;
}
function refineByKeywords(category, userMessage) {
  if (category === "coding") {
    return firstMatchingCategory(userMessage, [
      { regex: REFACTOR_KEYWORDS, category: "refactoring" },
      { regex: FEATURE_KEYWORDS, category: "feature" },
      { regex: DEBUG_KEYWORDS, category: "debugging" }
    ]) ?? "coding";
  }
  if (category === "exploration") {
    if (RESEARCH_KEYWORDS.test(userMessage)) return "exploration";
    if (DEBUG_KEYWORDS.test(userMessage)) return "debugging";
    return "exploration";
  }
  return category;
}
function classifyConversation(userMessage) {
  if (BRAINSTORM_KEYWORDS.test(userMessage)) return "brainstorming";
  if (RESEARCH_KEYWORDS.test(userMessage)) return "exploration";
  const debugOrFeature = firstMatchingCategory(userMessage, [
    { regex: FEATURE_KEYWORDS, category: "feature" },
    { regex: DEBUG_KEYWORDS, category: "debugging" }
  ]);
  if (debugOrFeature) return debugOrFeature;
  if (FILE_PATTERNS.test(userMessage)) return "coding";
  if (SCRIPT_PATTERNS.test(userMessage)) return "coding";
  if (URL_PATTERN.test(userMessage)) return "exploration";
  return "conversation";
}
function countRetries(turn) {
  const steps = [];
  for (const call of turn.assistantCalls) {
    if (call.toolSequence && call.toolSequence.length > 0) {
      steps.push(...call.toolSequence);
    } else if (call.tools.length > 0) {
      steps.push(call.tools.map((t) => ({ tool: t })));
    }
  }
  const lastEditStep = /* @__PURE__ */ new Map();
  let lastVerifyStep = -1;
  let retries = 0;
  steps.forEach((step, i) => {
    for (const call of step) {
      if (BASH_TOOLS.has(call.tool)) {
        lastVerifyStep = i;
      }
      if (EDIT_TOOLS.has(call.tool)) {
        const fileKey = call.file ?? "__no_file__";
        const prevStep = lastEditStep.get(fileKey);
        if (prevStep !== void 0 && lastVerifyStep > prevStep && lastVerifyStep < i) {
          retries++;
        }
        lastEditStep.set(fileKey, i);
      }
    }
  });
  return retries;
}
function turnHasEdits(turn) {
  return turn.assistantCalls.some((c) => c.tools.some((t) => EDIT_TOOLS.has(t)));
}
function classifyTurn(turn) {
  const tools = getAllTools(turn);
  let category;
  if (tools.length === 0) {
    category = classifyConversation(turn.userMessage);
  } else {
    const toolCategory = classifyByToolPattern(turn);
    if (toolCategory) {
      category = refineByKeywords(toolCategory, turn.userMessage);
    } else {
      category = classifyConversation(turn.userMessage);
    }
  }
  const result = { ...turn, category, retries: countRetries(turn), hasEdits: turnHasEdits(turn) };
  if (category === "general") {
    const skills = getAllSkills(turn);
    if (skills.length > 0) result.subCategory = skills[0];
  }
  return result;
}
var TEST_PATTERNS, GIT_PATTERNS, BUILD_PATTERNS, INSTALL_PATTERNS, DEBUG_KEYWORDS, FEATURE_KEYWORDS, REFACTOR_KEYWORDS, BRAINSTORM_KEYWORDS, RESEARCH_KEYWORDS, FILE_PATTERNS, SCRIPT_PATTERNS, URL_PATTERN, EDIT_TOOLS, READ_TOOLS, BASH_TOOLS, TASK_TOOLS, SEARCH_TOOLS;
var init_classifier = __esm({
  "src/classifier.ts"() {
    "use strict";
    TEST_PATTERNS = /\b(test|pytest|vitest|jest|mocha|spec|coverage|npm\s+test|npx\s+vitest|npx\s+jest)\b/i;
    GIT_PATTERNS = /\bgit\s+(push|pull|commit|merge|rebase|checkout|branch|stash|log|diff|status|add|reset|cherry-pick|tag)\b/i;
    BUILD_PATTERNS = /\b(npm\s+run\s+build|npm\s+publish|pip\s+install|docker|deploy|make\s+build|npm\s+run\s+dev|npm\s+start|pm2|systemctl|brew|cargo\s+build)\b/i;
    INSTALL_PATTERNS = /\b(npm\s+install|pip\s+install|brew\s+install|apt\s+install|cargo\s+add)\b/i;
    DEBUG_KEYWORDS = /\b(fix|bug|error|broken|failing|crash|issue|debug|traceback|exception|stack\s*trace|not\s+working|wrong|unexpected|status\s+code|404|500|401|403)\b/i;
    FEATURE_KEYWORDS = /\b(add|create|implement|new|build|feature|introduce|set\s*up|scaffold|generate|make\s+(?:a|me|the)|write\s+(?:a|me|the))\b/i;
    REFACTOR_KEYWORDS = /\b(refactor|clean\s*up|rename|reorganize|simplify|extract|restructure|move|migrate|split)\b/i;
    BRAINSTORM_KEYWORDS = /\b(brainstorm|idea|what\s+if|explore|think\s+about|approach|strategy|design|consider|how\s+should|what\s+would|opinion|suggest|recommend)\b/i;
    RESEARCH_KEYWORDS = /\b(research|investigate|look\s+into|find\s+out|check|search|analyze|review|understand|explain|how\s+does|what\s+is|show\s+me|list|compare)\b/i;
    FILE_PATTERNS = /\.(py|js|ts|tsx|jsx|json|yaml|yml|toml|sql|sh|go|rs|java|rb|php|css|html|md|csv|xml)\b/i;
    SCRIPT_PATTERNS = /\b(run\s+\S+\.\w+|execute|scrip?t|curl|api\s+\S+|endpoint|request\s+url|fetch\s+\S+|query|database|db\s+\S+)\b/i;
    URL_PATTERN = /https?:\/\/\S+/i;
    EDIT_TOOLS = /* @__PURE__ */ new Set(["Edit", "Write", "FileEditTool", "FileWriteTool", "NotebookEdit", "cursor:edit"]);
    READ_TOOLS = /* @__PURE__ */ new Set(["Read", "Grep", "Glob", "FileReadTool", "GrepTool", "GlobTool"]);
    BASH_TOOLS = /* @__PURE__ */ new Set(["Bash", "BashTool", "PowerShellTool"]);
    TASK_TOOLS = /* @__PURE__ */ new Set(["TaskCreate", "TaskUpdate", "TaskGet", "TaskList", "TaskOutput", "TaskStop", "TodoWrite"]);
    SEARCH_TOOLS = /* @__PURE__ */ new Set(["WebSearch", "WebFetch", "ToolSearch"]);
  }
});

// src/parser.ts
import { lstat as lstat2, readFile as readFile20, readdir as readdir19, stat as stat21 } from "fs/promises";
import { basename as basename16, dirname as dirname6, join as join35, resolve as resolve4, sep } from "path";
function unsanitizePath(dirName) {
  return dirName.replace(/-/g, "/");
}
function normalizeProjectPathKey(projectPath) {
  const normalized = projectPath.trim().replace(/\\/g, "/");
  return (normalized.replace(/\/+$/, "") || normalized).toLowerCase();
}
function projectNameFromPath2(projectPath, fallback) {
  const normalized = projectPath.trim().replace(/\\/g, "/").replace(/\/+$/, "");
  return normalized.split("/").filter(Boolean).pop() ?? fallback;
}
function isCoworkSession(cwd, filePath) {
  const base = resolve4(getDesktopSessionsDir());
  const inBase = (p) => p.startsWith(base + sep) || p.startsWith(base + "/");
  return inBase(resolve4(cwd)) || inBase(resolve4(filePath));
}
async function resolveCanonicalProjectPath(cwd) {
  const trimmed = cwd.trim();
  if (!trimmed) return { path: cwd, isWorktree: false };
  const isAbsoluteOnCurrentPlatform = process.platform === "win32" ? /^[a-zA-Z]:[/\\]/.test(trimmed) : trimmed.startsWith("/");
  if (!isAbsoluteOnCurrentPlatform) return { path: cwd, isWorktree: false };
  let dir = trimmed;
  while (true) {
    const gitEntry = join35(dir, ".git");
    const entryStat = await lstat2(gitEntry).catch(() => null);
    if (entryStat?.isDirectory()) return { path: dir, isWorktree: false };
    if (entryStat?.isFile()) {
      const gitFile = await readFile20(gitEntry, "utf-8").catch(() => null);
      if (gitFile === null) return { path: dir, isWorktree: false };
      const match = gitFile.match(/^gitdir:\s*(.+?)\s*$/m);
      if (!match?.[1]) return { path: dir, isWorktree: false };
      const gitDir = resolve4(dir, match[1]);
      const normalizedGitDir = gitDir.replace(/\\/g, "/");
      const worktreeMarker = "/.git/worktrees/";
      const markerIndex = normalizedGitDir.lastIndexOf(worktreeMarker);
      if (markerIndex === -1) return { path: dir, isWorktree: false };
      return { path: normalizedGitDir.slice(0, markerIndex), isWorktree: true };
    }
    const parent = dirname6(dir);
    if (parent === dir) return { path: cwd, isWorktree: false };
    dir = parent;
  }
}
function parseJsonlLine(line) {
  if (Buffer.isBuffer(line)) {
    if (line.length > LARGE_JSONL_LINE_BYTES) return parseLargeJsonlBuffer(line);
    try {
      return JSON.parse(line.toString("utf-8"));
    } catch {
      return null;
    }
  }
  if (line.length > LARGE_JSONL_LINE_BYTES) return parseLargeJsonlLine(line);
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
function findJsonStringEnd(source, start, limit = source.length) {
  for (let i = start + 1; i < limit; i++) {
    const ch = source.charCodeAt(i);
    if (ch === 92) {
      i++;
      continue;
    }
    if (ch === 34) return i;
  }
  return -1;
}
function findJsonContainerEnd(source, start, open8, close, limit = source.length) {
  let depth = 0;
  let inString = false;
  for (let i = start; i < limit; i++) {
    const ch = source.charCodeAt(i);
    if (inString) {
      if (ch === 92) {
        i++;
      } else if (ch === 34) {
        inString = false;
      }
      continue;
    }
    if (ch === 34) {
      inString = true;
    } else if (ch === open8) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function findJsonValueBounds(source, start, limit = source.length) {
  let i = start;
  while (i < limit && /\s/.test(source[i])) i++;
  if (i >= limit) return null;
  const ch = source.charCodeAt(i);
  if (ch === 34) {
    const end2 = findJsonStringEnd(source, i, limit);
    return end2 === -1 ? null : { start: i, end: end2 + 1, kind: "string" };
  }
  if (ch === 123) {
    const end2 = findJsonContainerEnd(source, i, 123, 125, limit);
    return end2 === -1 ? null : { start: i, end: end2 + 1, kind: "object" };
  }
  if (ch === 91) {
    const end2 = findJsonContainerEnd(source, i, 91, 93, limit);
    return end2 === -1 ? null : { start: i, end: end2 + 1, kind: "array" };
  }
  let end = i;
  while (end < limit) {
    const c = source.charCodeAt(end);
    if (c === 44 || c === 125 || c === 93 || /\s/.test(source[end])) break;
    end++;
  }
  return { start: i, end, kind: "scalar" };
}
function findObjectFieldValue(source, objectStart, objectEnd, field) {
  if (source.charCodeAt(objectStart) !== 123) return null;
  let i = objectStart + 1;
  while (i < objectEnd - 1) {
    while (i < objectEnd && /\s/.test(source[i])) i++;
    if (source.charCodeAt(i) === 44) {
      i++;
      continue;
    }
    if (source.charCodeAt(i) !== 34) {
      i++;
      continue;
    }
    const keyEnd = findJsonStringEnd(source, i, objectEnd);
    if (keyEnd === -1) return null;
    const key = source.slice(i + 1, keyEnd);
    i = keyEnd + 1;
    while (i < objectEnd && /\s/.test(source[i])) i++;
    if (source.charCodeAt(i) !== 58) continue;
    const value = findJsonValueBounds(source, i + 1, objectEnd);
    if (!value) return null;
    if (key === field) return value;
    i = value.end;
  }
  return null;
}
function readJsonString(source, bounds, cap = Number.POSITIVE_INFINITY) {
  if (!bounds || bounds.kind !== "string") return void 0;
  let out = "";
  for (let i = bounds.start + 1; i < bounds.end - 1 && out.length < cap; i++) {
    const ch = source[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = source[++i];
    if (!next) break;
    if (next === "n") out += "\n";
    else if (next === "r") out += "\r";
    else if (next === "t") out += "	";
    else if (next === "b") out += "\b";
    else if (next === "f") out += "\f";
    else if (next === "u" && i + 4 < bounds.end) {
      const hex = source.slice(i + 1, i + 5);
      const code = Number.parseInt(hex, 16);
      if (Number.isFinite(code)) out += String.fromCharCode(code);
      i += 4;
    } else {
      out += next;
    }
  }
  return out;
}
function readJsonNumberField(source, objectBounds, field) {
  if (!objectBounds || objectBounds.kind !== "object") return void 0;
  const bounds = findObjectFieldValue(source, objectBounds.start, objectBounds.end, field);
  if (!bounds) return void 0;
  const value = Number(source.slice(bounds.start, bounds.end));
  return Number.isFinite(value) ? value : void 0;
}
function parseLargeUsage(source, usageBounds) {
  const usage = {
    input_tokens: readJsonNumberField(source, usageBounds, "input_tokens") ?? 0,
    output_tokens: readJsonNumberField(source, usageBounds, "output_tokens") ?? 0,
    cache_creation_input_tokens: readJsonNumberField(source, usageBounds, "cache_creation_input_tokens"),
    cache_read_input_tokens: readJsonNumberField(source, usageBounds, "cache_read_input_tokens")
  };
  if (usageBounds?.kind === "object") {
    const cacheCreation = findObjectFieldValue(source, usageBounds.start, usageBounds.end, "cache_creation");
    const ephemeral5m = readJsonNumberField(source, cacheCreation, "ephemeral_5m_input_tokens");
    const ephemeral1h = readJsonNumberField(source, cacheCreation, "ephemeral_1h_input_tokens");
    if (ephemeral5m !== void 0 || ephemeral1h !== void 0) {
      ;
      usage.cache_creation = {
        ...ephemeral5m !== void 0 ? { ephemeral_5m_input_tokens: ephemeral5m } : {},
        ...ephemeral1h !== void 0 ? { ephemeral_1h_input_tokens: ephemeral1h } : {}
      };
    }
    const serverToolUse = findObjectFieldValue(source, usageBounds.start, usageBounds.end, "server_tool_use");
    const webSearch = readJsonNumberField(source, serverToolUse, "web_search_requests");
    const webFetch = readJsonNumberField(source, serverToolUse, "web_fetch_requests");
    if (webSearch !== void 0 || webFetch !== void 0) {
      ;
      usage.server_tool_use = {
        ...webSearch !== void 0 ? { web_search_requests: webSearch } : {},
        ...webFetch !== void 0 ? { web_fetch_requests: webFetch } : {}
      };
    }
    const speed = readJsonString(source, findObjectFieldValue(source, usageBounds.start, usageBounds.end, "speed"));
    if (speed === "standard" || speed === "fast") usage.speed = speed;
  }
  return usage;
}
function extractLargeToolBlocks(source, contentBounds) {
  if (!contentBounds || contentBounds.kind !== "array") return [];
  const tools = [];
  let i = contentBounds.start + 1;
  while (i < contentBounds.end - 1 && tools.length < MAX_TOOL_BLOCKS) {
    while (i < contentBounds.end && /\s/.test(source[i])) i++;
    if (source.charCodeAt(i) === 44) {
      i++;
      continue;
    }
    if (source.charCodeAt(i) !== 123) {
      i++;
      continue;
    }
    const objectEnd = findJsonContainerEnd(source, i, 123, 125, contentBounds.end);
    if (objectEnd === -1) break;
    const objectBounds = { start: i, end: objectEnd + 1, kind: "object" };
    const blockType = readJsonString(source, findObjectFieldValue(source, objectBounds.start, objectBounds.end, "type"));
    if (blockType === "tool_use") {
      const name = readJsonString(source, findObjectFieldValue(source, objectBounds.start, objectBounds.end, "name")) ?? "";
      const id = readJsonString(source, findObjectFieldValue(source, objectBounds.start, objectBounds.end, "id")) ?? "";
      const inputBounds = findObjectFieldValue(source, objectBounds.start, objectBounds.end, "input");
      const input = {};
      if (inputBounds?.kind === "object") {
        if (name === "Skill") {
          const skill = readJsonString(source, findObjectFieldValue(source, inputBounds.start, inputBounds.end, "skill"), 200);
          const skillName = readJsonString(source, findObjectFieldValue(source, inputBounds.start, inputBounds.end, "name"), 200);
          if (skill !== void 0) input["skill"] = skill;
          if (skillName !== void 0) input["name"] = skillName;
        } else if (name === "Read" || name === "FileReadTool" || EDIT_TOOLS.has(name)) {
          const filePath = readJsonString(source, findObjectFieldValue(source, inputBounds.start, inputBounds.end, "file_path"), BASH_COMMAND_CAP);
          if (filePath !== void 0) input["file_path"] = filePath;
        } else if (name === "Agent" || name === "Task") {
          const subagentType = readJsonString(source, findObjectFieldValue(source, inputBounds.start, inputBounds.end, "subagent_type"), 200);
          if (subagentType !== void 0) input["subagent_type"] = subagentType;
        } else if (BASH_TOOLS.has(name)) {
          const command = readJsonString(source, findObjectFieldValue(source, inputBounds.start, inputBounds.end, "command"), BASH_COMMAND_CAP);
          if (command !== void 0) input["command"] = command;
        }
      }
      tools.push({ type: "tool_use", id, name, input });
    }
    i = objectEnd + 1;
  }
  return tools;
}
function extractLargeUserText(source, contentBounds) {
  if (!contentBounds) return void 0;
  if (contentBounds.kind === "string") return readJsonString(source, contentBounds, USER_TEXT_CAP);
  if (contentBounds.kind !== "array") return void 0;
  let text = "";
  let i = contentBounds.start + 1;
  while (i < contentBounds.end - 1 && text.length < USER_TEXT_CAP) {
    while (i < contentBounds.end && /\s/.test(source[i])) i++;
    if (source.charCodeAt(i) === 44) {
      i++;
      continue;
    }
    if (source.charCodeAt(i) !== 123) {
      i++;
      continue;
    }
    const objectEnd = findJsonContainerEnd(source, i, 123, 125, contentBounds.end);
    if (objectEnd === -1) break;
    const objectBounds = { start: i, end: objectEnd + 1, kind: "object" };
    const type = readJsonString(source, findObjectFieldValue(source, objectBounds.start, objectBounds.end, "type"));
    if (type === "text" || type === "input_text") {
      const part = readJsonString(
        source,
        findObjectFieldValue(source, objectBounds.start, objectBounds.end, "text"),
        USER_TEXT_CAP - text.length
      );
      if (part) text += (text ? " " : "") + part;
    }
    i = objectEnd + 1;
  }
  return text || void 0;
}
function extractLargeAddedNames(source, attachmentBounds) {
  if (!attachmentBounds || attachmentBounds.kind !== "object") return [];
  const attachmentType = readJsonString(source, findObjectFieldValue(source, attachmentBounds.start, attachmentBounds.end, "type"));
  if (attachmentType !== "deferred_tools_delta") return [];
  const addedNames = findObjectFieldValue(source, attachmentBounds.start, attachmentBounds.end, "addedNames");
  if (!addedNames || addedNames.kind !== "array") return [];
  const names = [];
  let i = addedNames.start + 1;
  while (i < addedNames.end - 1 && names.length < MAX_ADDED_NAMES) {
    while (i < addedNames.end && /\s/.test(source[i])) i++;
    if (source.charCodeAt(i) === 44) {
      i++;
      continue;
    }
    if (source.charCodeAt(i) !== 34) {
      i++;
      continue;
    }
    const end = findJsonStringEnd(source, i, addedNames.end);
    if (end === -1) break;
    const name = readJsonString(source, { start: i, end: end + 1, kind: "string" }, 500);
    if (name) names.push(name);
    i = end + 1;
  }
  return names;
}
function parseLargeJsonlLine(line) {
  const rootEnd = findJsonContainerEnd(line, 0, 123, 125);
  if (rootEnd === -1) return null;
  const rootStart = 0;
  const rootLimit = rootEnd + 1;
  const type = readJsonString(line, findObjectFieldValue(line, rootStart, rootLimit, "type"));
  if (!type) return null;
  const entry = { type };
  const timestamp = readJsonString(line, findObjectFieldValue(line, rootStart, rootLimit, "timestamp"));
  const sessionId = readJsonString(line, findObjectFieldValue(line, rootStart, rootLimit, "sessionId"));
  const cwd = readJsonString(line, findObjectFieldValue(line, rootStart, rootLimit, "cwd"));
  if (timestamp !== void 0) entry.timestamp = timestamp;
  if (sessionId !== void 0) entry.sessionId = sessionId;
  if (cwd !== void 0) entry.cwd = cwd;
  const addedNames = extractLargeAddedNames(line, findObjectFieldValue(line, rootStart, rootLimit, "attachment"));
  if (addedNames.length > 0) {
    ;
    entry["attachment"] = { type: "deferred_tools_delta", addedNames };
  }
  if (type === "user") {
    const message2 = findObjectFieldValue(line, rootStart, rootLimit, "message");
    if (message2?.kind === "object") {
      const content = findObjectFieldValue(line, message2.start, message2.end, "content");
      const text = extractLargeUserText(line, content);
      if (text !== void 0) entry.message = { role: "user", content: text };
    }
    return entry;
  }
  if (type !== "assistant") return entry;
  const message = findObjectFieldValue(line, rootStart, rootLimit, "message");
  if (message?.kind !== "object") return entry;
  const model = readJsonString(line, findObjectFieldValue(line, message.start, message.end, "model"));
  const usageBounds = findObjectFieldValue(line, message.start, message.end, "usage");
  if (!model || usageBounds?.kind !== "object") return entry;
  const id = readJsonString(line, findObjectFieldValue(line, message.start, message.end, "id"));
  const contentBounds = findObjectFieldValue(line, message.start, message.end, "content");
  entry.message = {
    type: "message",
    role: "assistant",
    model,
    ...id !== void 0 ? { id } : {},
    content: extractLargeToolBlocks(line, contentBounds),
    usage: parseLargeUsage(line, usageBounds)
  };
  return entry;
}
function isJsonWhitespaceByte(ch) {
  return ch === 32 || ch === 10 || ch === 13 || ch === 9;
}
function findJsonStringEndBuffer(source, start, limit = source.length) {
  for (let i = start + 1; i < limit; i++) {
    const ch = source[i];
    if (ch === 92) {
      i++;
      continue;
    }
    if (ch === 34) return i;
  }
  return -1;
}
function findJsonContainerEndBuffer(source, start, open8, close, limit = source.length) {
  let depth = 0;
  let inString = false;
  for (let i = start; i < limit; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === 92) {
        i++;
      } else if (ch === 34) {
        inString = false;
      }
      continue;
    }
    if (ch === 34) {
      inString = true;
    } else if (ch === open8) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}
function findJsonValueBoundsBuffer(source, start, limit = source.length) {
  let i = start;
  while (i < limit && isJsonWhitespaceByte(source[i])) i++;
  if (i >= limit) return null;
  const ch = source[i];
  if (ch === 34) {
    const end2 = findJsonStringEndBuffer(source, i, limit);
    return end2 === -1 ? null : { start: i, end: end2 + 1, kind: "string" };
  }
  if (ch === 123) {
    const end2 = findJsonContainerEndBuffer(source, i, 123, 125, limit);
    return end2 === -1 ? null : { start: i, end: end2 + 1, kind: "object" };
  }
  if (ch === 91) {
    const end2 = findJsonContainerEndBuffer(source, i, 91, 93, limit);
    return end2 === -1 ? null : { start: i, end: end2 + 1, kind: "array" };
  }
  let end = i;
  while (end < limit) {
    const c = source[end];
    if (c === 44 || c === 125 || c === 93 || isJsonWhitespaceByte(c)) break;
    end++;
  }
  return { start: i, end, kind: "scalar" };
}
function bufferKeyEquals(source, keyStart, keyEnd, field) {
  if (keyEnd - keyStart !== field.length) return false;
  return source.subarray(keyStart, keyEnd).equals(Buffer.from(field));
}
function findObjectFieldValueBuffer(source, objectStart, objectEnd, field) {
  if (source[objectStart] !== 123) return null;
  let i = objectStart + 1;
  while (i < objectEnd - 1) {
    while (i < objectEnd && isJsonWhitespaceByte(source[i])) i++;
    if (source[i] === 44) {
      i++;
      continue;
    }
    if (source[i] !== 34) {
      i++;
      continue;
    }
    const keyEnd = findJsonStringEndBuffer(source, i, objectEnd);
    if (keyEnd === -1) return null;
    const keyStart = i + 1;
    i = keyEnd + 1;
    while (i < objectEnd && isJsonWhitespaceByte(source[i])) i++;
    if (source[i] !== 58) continue;
    const value = findJsonValueBoundsBuffer(source, i + 1, objectEnd);
    if (!value) return null;
    if (bufferKeyEquals(source, keyStart, keyEnd, field)) return value;
    i = value.end;
  }
  return null;
}
function appendBufferJsonSegment(source, start, end, current, cap) {
  if (start >= end || current.length >= cap) return current;
  const remaining = cap - current.length;
  const cappedEnd = Number.isFinite(cap) ? Math.min(end, start + remaining * 4) : end;
  return current + source.subarray(start, cappedEnd).toString("utf-8").slice(0, remaining);
}
function readJsonStringBuffer(source, bounds, cap = Number.POSITIVE_INFINITY) {
  if (!bounds || bounds.kind !== "string") return void 0;
  let out = "";
  let segmentStart = bounds.start + 1;
  for (let i = bounds.start + 1; i < bounds.end - 1 && out.length < cap; i++) {
    const ch = source[i];
    if (ch !== 92) continue;
    out = appendBufferJsonSegment(source, segmentStart, i, out, cap);
    if (out.length >= cap) break;
    const next = source[++i];
    if (next === void 0) break;
    if (next === 110) out += "\n";
    else if (next === 114) out += "\r";
    else if (next === 116) out += "	";
    else if (next === 98) out += "\b";
    else if (next === 102) out += "\f";
    else if (next === 117 && i + 4 < bounds.end) {
      const hex = source.subarray(i + 1, i + 5).toString("ascii");
      const code = Number.parseInt(hex, 16);
      if (Number.isFinite(code)) out += String.fromCharCode(code);
      i += 4;
    } else {
      out += String.fromCharCode(next);
    }
    segmentStart = i + 1;
  }
  return appendBufferJsonSegment(source, segmentStart, bounds.end - 1, out, cap);
}
function readJsonNumberFieldBuffer(source, objectBounds, field) {
  if (!objectBounds || objectBounds.kind !== "object") return void 0;
  const bounds = findObjectFieldValueBuffer(source, objectBounds.start, objectBounds.end, field);
  if (!bounds) return void 0;
  const value = Number(source.subarray(bounds.start, bounds.end).toString("ascii"));
  return Number.isFinite(value) ? value : void 0;
}
function parseLargeUsageBuffer(source, usageBounds) {
  const usage = {
    input_tokens: readJsonNumberFieldBuffer(source, usageBounds, "input_tokens") ?? 0,
    output_tokens: readJsonNumberFieldBuffer(source, usageBounds, "output_tokens") ?? 0,
    cache_creation_input_tokens: readJsonNumberFieldBuffer(source, usageBounds, "cache_creation_input_tokens"),
    cache_read_input_tokens: readJsonNumberFieldBuffer(source, usageBounds, "cache_read_input_tokens")
  };
  if (usageBounds?.kind === "object") {
    const cacheCreation = findObjectFieldValueBuffer(source, usageBounds.start, usageBounds.end, "cache_creation");
    const ephemeral5m = readJsonNumberFieldBuffer(source, cacheCreation, "ephemeral_5m_input_tokens");
    const ephemeral1h = readJsonNumberFieldBuffer(source, cacheCreation, "ephemeral_1h_input_tokens");
    if (ephemeral5m !== void 0 || ephemeral1h !== void 0) {
      ;
      usage.cache_creation = {
        ...ephemeral5m !== void 0 ? { ephemeral_5m_input_tokens: ephemeral5m } : {},
        ...ephemeral1h !== void 0 ? { ephemeral_1h_input_tokens: ephemeral1h } : {}
      };
    }
    const serverToolUse = findObjectFieldValueBuffer(source, usageBounds.start, usageBounds.end, "server_tool_use");
    const webSearch = readJsonNumberFieldBuffer(source, serverToolUse, "web_search_requests");
    const webFetch = readJsonNumberFieldBuffer(source, serverToolUse, "web_fetch_requests");
    if (webSearch !== void 0 || webFetch !== void 0) {
      ;
      usage.server_tool_use = {
        ...webSearch !== void 0 ? { web_search_requests: webSearch } : {},
        ...webFetch !== void 0 ? { web_fetch_requests: webFetch } : {}
      };
    }
    const speed = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, usageBounds.start, usageBounds.end, "speed"));
    if (speed === "standard" || speed === "fast") usage.speed = speed;
  }
  return usage;
}
function extractLargeToolBlocksBuffer(source, contentBounds) {
  if (!contentBounds || contentBounds.kind !== "array") return [];
  const tools = [];
  let i = contentBounds.start + 1;
  while (i < contentBounds.end - 1 && tools.length < MAX_TOOL_BLOCKS) {
    while (i < contentBounds.end && isJsonWhitespaceByte(source[i])) i++;
    if (source[i] === 44) {
      i++;
      continue;
    }
    if (source[i] !== 123) {
      i++;
      continue;
    }
    const objectEnd = findJsonContainerEndBuffer(source, i, 123, 125, contentBounds.end);
    if (objectEnd === -1) break;
    const objectBounds = { start: i, end: objectEnd + 1, kind: "object" };
    const blockType = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, objectBounds.start, objectBounds.end, "type"));
    if (blockType === "tool_use") {
      const name = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, objectBounds.start, objectBounds.end, "name")) ?? "";
      const id = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, objectBounds.start, objectBounds.end, "id")) ?? "";
      const inputBounds = findObjectFieldValueBuffer(source, objectBounds.start, objectBounds.end, "input");
      const input = {};
      if (inputBounds?.kind === "object") {
        if (name === "Skill") {
          const skill = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, inputBounds.start, inputBounds.end, "skill"), 200);
          const skillName = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, inputBounds.start, inputBounds.end, "name"), 200);
          if (skill !== void 0) input["skill"] = skill;
          if (skillName !== void 0) input["name"] = skillName;
        } else if (name === "Read" || name === "FileReadTool" || EDIT_TOOLS.has(name)) {
          const filePath = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, inputBounds.start, inputBounds.end, "file_path"), BASH_COMMAND_CAP);
          if (filePath !== void 0) input["file_path"] = filePath;
        } else if (name === "Agent" || name === "Task") {
          const subagentType = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, inputBounds.start, inputBounds.end, "subagent_type"), 200);
          if (subagentType !== void 0) input["subagent_type"] = subagentType;
        } else if (BASH_TOOLS.has(name)) {
          const command = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, inputBounds.start, inputBounds.end, "command"), BASH_COMMAND_CAP);
          if (command !== void 0) input["command"] = command;
        }
      }
      tools.push({ type: "tool_use", id, name, input });
    }
    i = objectEnd + 1;
  }
  return tools;
}
function extractLargeUserTextBuffer(source, contentBounds) {
  if (!contentBounds) return void 0;
  if (contentBounds.kind === "string") return readJsonStringBuffer(source, contentBounds, USER_TEXT_CAP);
  if (contentBounds.kind !== "array") return void 0;
  let text = "";
  let i = contentBounds.start + 1;
  while (i < contentBounds.end - 1 && text.length < USER_TEXT_CAP) {
    while (i < contentBounds.end && isJsonWhitespaceByte(source[i])) i++;
    if (source[i] === 44) {
      i++;
      continue;
    }
    if (source[i] !== 123) {
      i++;
      continue;
    }
    const objectEnd = findJsonContainerEndBuffer(source, i, 123, 125, contentBounds.end);
    if (objectEnd === -1) break;
    const objectBounds = { start: i, end: objectEnd + 1, kind: "object" };
    const type = readJsonStringBuffer(source, findObjectFieldValueBuffer(source, objectBounds.start, objectBounds.end, "type"));
    if (type === "text" || type === "input_text") {
      const part = readJsonStringBuffer(
        source,
        findObjectFieldValueBuffer(source, objectBounds.start, objectBounds.end, "text"),
        USER_TEXT_CAP - text.length
      );
      if (part) text += (text ? " " : "") + part;
    }
    i = objectEnd + 1;
  }
  return text || void 0;
}
function extractLargeAddedNamesBuffer(source, attachmentBounds) {
  if (!attachmentBounds || attachmentBounds.kind !== "object") return [];
  const attachmentType = readJsonStringBuffer(
    source,
    findObjectFieldValueBuffer(source, attachmentBounds.start, attachmentBounds.end, "type")
  );
  if (attachmentType !== "deferred_tools_delta") return [];
  const addedNames = findObjectFieldValueBuffer(source, attachmentBounds.start, attachmentBounds.end, "addedNames");
  if (!addedNames || addedNames.kind !== "array") return [];
  const names = [];
  let i = addedNames.start + 1;
  while (i < addedNames.end - 1 && names.length < MAX_ADDED_NAMES) {
    while (i < addedNames.end && isJsonWhitespaceByte(source[i])) i++;
    if (source[i] === 44) {
      i++;
      continue;
    }
    if (source[i] !== 34) {
      i++;
      continue;
    }
    const end = findJsonStringEndBuffer(source, i, addedNames.end);
    if (end === -1) break;
    const name = readJsonStringBuffer(source, { start: i, end: end + 1, kind: "string" }, 500);
    if (name) names.push(name);
    i = end + 1;
  }
  return names;
}
function parseLargeJsonlBuffer(line) {
  let rootStart = 0;
  while (rootStart < line.length && isJsonWhitespaceByte(line[rootStart])) rootStart++;
  if (line[rootStart] !== 123) return null;
  const rootEnd = findJsonContainerEndBuffer(line, rootStart, 123, 125);
  if (rootEnd === -1) return null;
  const rootLimit = rootEnd + 1;
  const type = readJsonStringBuffer(line, findObjectFieldValueBuffer(line, rootStart, rootLimit, "type"));
  if (!type) return null;
  const entry = { type };
  const timestamp = readJsonStringBuffer(line, findObjectFieldValueBuffer(line, rootStart, rootLimit, "timestamp"));
  const sessionId = readJsonStringBuffer(line, findObjectFieldValueBuffer(line, rootStart, rootLimit, "sessionId"));
  const cwd = readJsonStringBuffer(line, findObjectFieldValueBuffer(line, rootStart, rootLimit, "cwd"));
  if (timestamp !== void 0) entry.timestamp = timestamp;
  if (sessionId !== void 0) entry.sessionId = sessionId;
  if (cwd !== void 0) entry.cwd = cwd;
  const addedNames = extractLargeAddedNamesBuffer(line, findObjectFieldValueBuffer(line, rootStart, rootLimit, "attachment"));
  if (addedNames.length > 0) {
    ;
    entry["attachment"] = { type: "deferred_tools_delta", addedNames };
  }
  if (type === "user") {
    const message2 = findObjectFieldValueBuffer(line, rootStart, rootLimit, "message");
    if (message2?.kind === "object") {
      const content = findObjectFieldValueBuffer(line, message2.start, message2.end, "content");
      const text = extractLargeUserTextBuffer(line, content);
      if (text !== void 0) entry.message = { role: "user", content: text };
    }
    return entry;
  }
  if (type !== "assistant") return entry;
  const message = findObjectFieldValueBuffer(line, rootStart, rootLimit, "message");
  if (message?.kind !== "object") return entry;
  const model = readJsonStringBuffer(line, findObjectFieldValueBuffer(line, message.start, message.end, "model"));
  const usageBounds = findObjectFieldValueBuffer(line, message.start, message.end, "usage");
  if (!model || usageBounds?.kind !== "object") return entry;
  const id = readJsonStringBuffer(line, findObjectFieldValueBuffer(line, message.start, message.end, "id"));
  const contentBounds = findObjectFieldValueBuffer(line, message.start, message.end, "content");
  entry.message = {
    type: "message",
    role: "assistant",
    model,
    ...id !== void 0 ? { id } : {},
    content: extractLargeToolBlocksBuffer(line, contentBounds),
    usage: parseLargeUsageBuffer(line, usageBounds)
  };
  return entry;
}
function getTopLevelRawJsonStringField(head, field) {
  let i = 0;
  while (i < head.length && /\s/.test(head[i])) i++;
  if (head.charCodeAt(i) !== 123) return null;
  i++;
  while (i < head.length) {
    while (i < head.length && /\s/.test(head[i])) i++;
    if (head.charCodeAt(i) === 44) {
      i++;
      continue;
    }
    if (head.charCodeAt(i) === 125) return null;
    if (head.charCodeAt(i) !== 34) return null;
    const keyEnd = findJsonStringEnd(head, i);
    if (keyEnd === -1) return null;
    const key = head.slice(i + 1, keyEnd);
    i = keyEnd + 1;
    while (i < head.length && /\s/.test(head[i])) i++;
    if (head.charCodeAt(i) !== 58) return null;
    const value = findJsonValueBounds(head, i + 1);
    if (!value) return null;
    if (key === field) return readJsonString(head, value) ?? null;
    i = value.end;
  }
  return null;
}
function shouldSkipLine(line, threshold) {
  const head = line.length > RAW_HEAD_BYTES2 ? line.slice(0, RAW_HEAD_BYTES2) : line;
  const type = getTopLevelRawJsonStringField(head, "type");
  if (type !== "user" && type !== "assistant") return false;
  const ts = getTopLevelRawJsonStringField(head, "timestamp");
  if (!ts || ts.length < 10) return false;
  return ts < threshold;
}
function compactEntry(raw) {
  const entry = { type: raw.type };
  if (raw.timestamp !== void 0) entry.timestamp = raw.timestamp;
  if (raw.sessionId !== void 0) entry.sessionId = raw.sessionId;
  if (raw.cwd !== void 0) entry.cwd = raw.cwd;
  const att = raw["attachment"];
  if (att && typeof att === "object") {
    const a = att;
    if (a["type"] === "deferred_tools_delta" && Array.isArray(a["addedNames"])) {
      const names = [];
      for (let i = 0; i < Math.min(a["addedNames"].length, MAX_ADDED_NAMES); i++) {
        const n = a["addedNames"][i];
        if (typeof n === "string") names.push(n);
      }
      ;
      entry["attachment"] = { type: "deferred_tools_delta", addedNames: names };
    }
  }
  if (!raw.message) return entry;
  if (raw.message.role === "user") {
    const content = raw.message.content;
    if (typeof content === "string") {
      entry.message = { role: "user", content: content.slice(0, USER_TEXT_CAP) };
    } else if (Array.isArray(content)) {
      let remaining = USER_TEXT_CAP;
      const blocks = [];
      for (const b of content) {
        if (remaining <= 0) break;
        if (!b || typeof b !== "object" || b.type !== "text") continue;
        const text = b.text;
        if (typeof text !== "string") continue;
        const sliced = text.slice(0, remaining);
        blocks.push({ type: "text", text: sliced });
        remaining -= sliced.length;
      }
      entry.message = { role: "user", content: blocks };
    }
    return entry;
  }
  const msg = raw.message;
  if (!msg.usage || !msg.model) return entry;
  const rawContent = msg.content;
  const contentArr = Array.isArray(rawContent) ? rawContent : [];
  const toolBlocks = contentArr.filter((b) => b != null && typeof b === "object" && b.type === "tool_use");
  const compactContent = toolBlocks.slice(0, MAX_TOOL_BLOCKS).map((tb) => {
    let input = {};
    if (tb.name === "Skill") {
      const ri = tb.input ?? {};
      if (typeof ri["skill"] === "string") input["skill"] = ri["skill"].slice(0, 200);
      if (typeof ri["name"] === "string") input["name"] = ri["name"].slice(0, 200);
    } else if (tb.name === "Read" || tb.name === "FileReadTool" || EDIT_TOOLS.has(tb.name)) {
      const ri = tb.input ?? {};
      if (typeof ri["file_path"] === "string") input["file_path"] = ri["file_path"].slice(0, BASH_COMMAND_CAP);
    } else if (tb.name === "Agent" || tb.name === "Task") {
      const ri = tb.input ?? {};
      if (typeof ri["subagent_type"] === "string") input["subagent_type"] = ri["subagent_type"].slice(0, 200);
    } else if (BASH_TOOLS.has(tb.name)) {
      const ri = tb.input ?? {};
      if (typeof ri["command"] === "string") {
        input["command"] = ri["command"].slice(0, BASH_COMMAND_CAP);
      }
    }
    return { type: "tool_use", id: tb.id ?? "", name: tb.name, input };
  });
  const u = msg.usage;
  const compactUsage = {
    input_tokens: u.input_tokens,
    output_tokens: u.output_tokens
  };
  if (u.cache_creation_input_tokens) compactUsage.cache_creation_input_tokens = u.cache_creation_input_tokens;
  if (u.cache_creation) {
    compactUsage.cache_creation = {
      ...u.cache_creation.ephemeral_5m_input_tokens ? { ephemeral_5m_input_tokens: u.cache_creation.ephemeral_5m_input_tokens } : {},
      ...u.cache_creation.ephemeral_1h_input_tokens ? { ephemeral_1h_input_tokens: u.cache_creation.ephemeral_1h_input_tokens } : {}
    };
  }
  if (u.cache_read_input_tokens) compactUsage.cache_read_input_tokens = u.cache_read_input_tokens;
  if (u.server_tool_use) {
    compactUsage.server_tool_use = {
      ...u.server_tool_use.web_search_requests ? { web_search_requests: u.server_tool_use.web_search_requests } : {},
      ...u.server_tool_use.web_fetch_requests ? { web_fetch_requests: u.server_tool_use.web_fetch_requests } : {}
    };
  }
  if (u.speed) compactUsage.speed = u.speed;
  entry.message = {
    type: "message",
    role: "assistant",
    model: msg.model,
    usage: compactUsage,
    content: compactContent,
    ...msg.id ? { id: msg.id } : {}
  };
  return entry;
}
function extractToolNames2(content) {
  return content.filter((b) => b.type === "tool_use").map((b) => b.name);
}
function extractMcpTools(tools) {
  return tools.filter((t) => t.startsWith("mcp__"));
}
function extractSkillNames(content) {
  return content.filter((b) => b.type === "tool_use" && b.name === "Skill").map((b) => {
    const input = b.input ?? {};
    const raw = input["skill"] ?? input["name"];
    return typeof raw === "string" ? raw.trim() : "";
  }).filter((name) => name.length > 0);
}
function extractSubagentTypes(content) {
  return content.filter((b) => b.type === "tool_use" && (b.name === "Agent" || b.name === "Task")).map((b) => {
    const input = b.input ?? {};
    const raw = input["subagent_type"];
    return typeof raw === "string" ? raw.trim() : "";
  }).filter((name) => name.length > 0);
}
function extractCoreTools(tools) {
  return tools.filter((t) => !t.startsWith("mcp__"));
}
function extractBashCommandsFromContent(content) {
  return content.filter((b) => b.type === "tool_use" && BASH_TOOLS.has(b.name)).flatMap((b) => {
    const command = b.input?.command;
    return typeof command === "string" ? extractBashCommands(command) : [];
  });
}
function getUserMessageText(entry) {
  if (!entry.message || entry.message.role !== "user") return "";
  const content = entry.message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.filter((b) => b.type === "text").map((b) => b.text).join(" ");
  }
  return "";
}
function getMessageId(entry) {
  if (entry.type !== "assistant") return null;
  const msg = entry.message;
  return msg?.id ?? null;
}
function positiveNumber(n) {
  return n !== void 0 && Number.isFinite(n) && n > 0 ? n : 0;
}
function extractClaudeCacheCreation(usage) {
  const legacyTotal = positiveNumber(usage.cache_creation_input_tokens);
  const cacheCreation = usage.cache_creation;
  const fiveMinuteTokens = positiveNumber(cacheCreation?.ephemeral_5m_input_tokens);
  const oneHourTokens = positiveNumber(cacheCreation?.ephemeral_1h_input_tokens);
  const splitTotal = fiveMinuteTokens + oneHourTokens;
  if (splitTotal === 0) return { totalTokens: legacyTotal, oneHourTokens: 0 };
  const totalTokens = Math.max(legacyTotal, splitTotal);
  return {
    totalTokens,
    oneHourTokens: Math.min(oneHourTokens, totalTokens)
  };
}
function parseApiCall(entry) {
  if (entry.type !== "assistant") return null;
  const msg = entry.message;
  if (!msg?.usage || !msg?.model) return null;
  const usage = msg.usage;
  const cacheCreation = extractClaudeCacheCreation(usage);
  const tokens = {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheCreationInputTokens: cacheCreation.totalTokens,
    cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
    cachedInputTokens: 0,
    reasoningTokens: 0,
    webSearchRequests: usage.server_tool_use?.web_search_requests ?? 0
  };
  const tools = extractToolNames2(msg.content ?? []);
  const skills = extractSkillNames(msg.content ?? []);
  const subagentTypes = extractSubagentTypes(msg.content ?? []);
  const costUSD = calculateCost(
    msg.model,
    tokens.inputTokens,
    tokens.outputTokens,
    tokens.cacheCreationInputTokens,
    tokens.cacheReadInputTokens,
    tokens.webSearchRequests,
    usage.speed ?? "standard",
    cacheCreation.oneHourTokens
  );
  const bashCmds = extractBashCommandsFromContent(msg.content ?? []);
  const toolSeq = (msg.content ?? []).filter((b) => b.type === "tool_use").map((b) => {
    const call = { tool: b.name };
    const inp = b.input ?? {};
    if (typeof inp["file_path"] === "string") call.file = inp["file_path"];
    if (typeof inp["command"] === "string") call.command = inp["command"];
    return [call];
  });
  return {
    provider: "claude",
    model: msg.model,
    usage: tokens,
    costUSD,
    tools,
    mcpTools: extractMcpTools(tools),
    skills,
    subagentTypes,
    hasAgentSpawn: tools.includes("Agent"),
    hasPlanMode: tools.includes("EnterPlanMode"),
    speed: usage.speed ?? "standard",
    timestamp: entry.timestamp ?? "",
    bashCommands: bashCmds,
    deduplicationKey: msg.id ?? `claude:${entry.timestamp}`,
    cacheCreationOneHourTokens: cacheCreation.oneHourTokens || void 0,
    toolSequence: toolSeq.length > 0 ? toolSeq : void 0
  };
}
function dedupeStreamingMessageIds(entries) {
  const firstIdxById = /* @__PURE__ */ new Map();
  const lastIdxById = /* @__PURE__ */ new Map();
  for (let i = 0; i < entries.length; i++) {
    const id = getMessageId(entries[i]);
    if (!id) continue;
    if (!firstIdxById.has(id)) firstIdxById.set(id, i);
    lastIdxById.set(id, i);
  }
  if (lastIdxById.size === 0) return entries;
  const result = [];
  for (let i = 0; i < entries.length; i++) {
    const id = getMessageId(entries[i]);
    if (id && lastIdxById.get(id) !== i) continue;
    if (id && firstIdxById.get(id) !== i) {
      const firstTs = entries[firstIdxById.get(id)].timestamp;
      result.push({ ...entries[i], timestamp: firstTs ?? entries[i].timestamp });
      continue;
    }
    result.push(entries[i]);
  }
  return result;
}
function groupIntoTurns(entries, seenMsgIds) {
  const turns = [];
  let currentUserMessage = "";
  let currentCalls = [];
  let currentTimestamp = "";
  let currentSessionId = "";
  for (const entry of entries) {
    if (entry.type === "user") {
      const text = getUserMessageText(entry);
      if (text.trim()) {
        if (currentCalls.length > 0) {
          turns.push({
            userMessage: currentUserMessage,
            assistantCalls: currentCalls,
            timestamp: currentTimestamp,
            sessionId: currentSessionId
          });
        }
        currentUserMessage = text;
        currentCalls = [];
        currentTimestamp = entry.timestamp ?? "";
        currentSessionId = entry.sessionId ?? "";
      }
    } else if (entry.type === "assistant") {
      const msgId = getMessageId(entry);
      if (msgId && seenMsgIds.has(msgId)) continue;
      if (msgId) seenMsgIds.add(msgId);
      const call = parseApiCall(entry);
      if (call) currentCalls.push(call);
    }
  }
  if (currentCalls.length > 0) {
    turns.push({
      userMessage: currentUserMessage,
      assistantCalls: currentCalls,
      timestamp: currentTimestamp,
      sessionId: currentSessionId
    });
  }
  return turns;
}
function isMcpToolName(name) {
  if (!name.startsWith("mcp__")) return false;
  const rest = name.slice(5);
  const sep2 = rest.indexOf("__");
  if (sep2 <= 0) return false;
  if (sep2 >= rest.length - 2) return false;
  return true;
}
function extractMcpInventory(entries) {
  const inventory = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    const att = entry["attachment"];
    if (!att || typeof att !== "object") continue;
    const a = att;
    if (a.type !== "deferred_tools_delta") continue;
    if (!Array.isArray(a.addedNames)) continue;
    for (const name of a.addedNames) {
      if (typeof name !== "string") continue;
      if (!isMcpToolName(name)) continue;
      inventory.add(name);
    }
  }
  if (inventory.size === 0) return [];
  return Array.from(inventory).sort();
}
function extractCanonicalCwd(entries) {
  for (const entry of entries) {
    if (typeof entry.cwd !== "string") continue;
    const cwd = entry.cwd.trim();
    if (cwd) return cwd;
  }
  return void 0;
}
function buildSessionSummary(sessionId, project, turns, mcpInventory) {
  const modelBreakdown = /* @__PURE__ */ Object.create(null);
  const toolBreakdown = /* @__PURE__ */ Object.create(null);
  const mcpBreakdown = /* @__PURE__ */ Object.create(null);
  const bashBreakdown = /* @__PURE__ */ Object.create(null);
  const categoryBreakdown = /* @__PURE__ */ Object.create(null);
  const skillBreakdown = /* @__PURE__ */ Object.create(null);
  const subagentBreakdown = /* @__PURE__ */ Object.create(null);
  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let apiCalls = 0;
  let firstTs = "";
  let lastTs = "";
  for (const turn of turns) {
    const turnCost = turn.assistantCalls.reduce((s, c) => s + c.costUSD, 0);
    if (!categoryBreakdown[turn.category]) {
      categoryBreakdown[turn.category] = { turns: 0, costUSD: 0, retries: 0, editTurns: 0, oneShotTurns: 0 };
    }
    categoryBreakdown[turn.category].turns++;
    categoryBreakdown[turn.category].costUSD += turnCost;
    if (turn.hasEdits) {
      categoryBreakdown[turn.category].editTurns++;
      categoryBreakdown[turn.category].retries += turn.retries;
      if (turn.retries === 0) categoryBreakdown[turn.category].oneShotTurns++;
    }
    if (turn.subCategory) {
      const skillKey = turn.subCategory;
      if (!skillBreakdown[skillKey]) {
        skillBreakdown[skillKey] = { turns: 0, costUSD: 0, editTurns: 0, oneShotTurns: 0 };
      }
      skillBreakdown[skillKey].turns++;
      skillBreakdown[skillKey].costUSD += turnCost;
      if (turn.hasEdits) {
        skillBreakdown[skillKey].editTurns++;
        if (turn.retries === 0) skillBreakdown[skillKey].oneShotTurns++;
      }
    }
    for (const call of turn.assistantCalls) {
      totalCost += call.costUSD;
      totalInput += call.usage.inputTokens;
      totalOutput += call.usage.outputTokens;
      totalCacheRead += call.usage.cacheReadInputTokens;
      totalCacheWrite += call.usage.cacheCreationInputTokens;
      apiCalls++;
      const modelKey = getShortModelName(call.model);
      if (!modelBreakdown[modelKey]) {
        modelBreakdown[modelKey] = {
          calls: 0,
          costUSD: 0,
          tokens: { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0, cachedInputTokens: 0, reasoningTokens: 0, webSearchRequests: 0 }
        };
      }
      modelBreakdown[modelKey].calls++;
      modelBreakdown[modelKey].costUSD += call.costUSD;
      modelBreakdown[modelKey].tokens.inputTokens += call.usage.inputTokens;
      modelBreakdown[modelKey].tokens.outputTokens += call.usage.outputTokens;
      modelBreakdown[modelKey].tokens.cacheReadInputTokens += call.usage.cacheReadInputTokens;
      modelBreakdown[modelKey].tokens.cacheCreationInputTokens += call.usage.cacheCreationInputTokens;
      for (const tool of extractCoreTools(call.tools)) {
        toolBreakdown[tool] = toolBreakdown[tool] ?? { calls: 0 };
        toolBreakdown[tool].calls++;
      }
      for (const mcp of call.mcpTools) {
        const server = mcp.split("__")[1] ?? mcp;
        mcpBreakdown[server] = mcpBreakdown[server] ?? { calls: 0 };
        mcpBreakdown[server].calls++;
      }
      for (const cmd of call.bashCommands) {
        bashBreakdown[cmd] = bashBreakdown[cmd] ?? { calls: 0 };
        bashBreakdown[cmd].calls++;
      }
      for (const sat of call.subagentTypes) {
        subagentBreakdown[sat] = subagentBreakdown[sat] ?? { calls: 0, costUSD: 0 };
        subagentBreakdown[sat].calls++;
        subagentBreakdown[sat].costUSD += call.costUSD;
      }
      if (!firstTs || call.timestamp < firstTs) firstTs = call.timestamp;
      if (!lastTs || call.timestamp > lastTs) lastTs = call.timestamp;
    }
  }
  return {
    sessionId,
    project,
    firstTimestamp: firstTs || turns[0]?.timestamp || "",
    lastTimestamp: lastTs || turns[turns.length - 1]?.timestamp || "",
    totalCostUSD: totalCost,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalCacheReadTokens: totalCacheRead,
    totalCacheWriteTokens: totalCacheWrite,
    apiCalls,
    turns,
    modelBreakdown,
    toolBreakdown,
    mcpBreakdown,
    bashBreakdown,
    categoryBreakdown,
    skillBreakdown,
    subagentBreakdown,
    ...mcpInventory && mcpInventory.length > 0 ? { mcpInventory } : {}
  };
}
async function collectJsonlFiles(dirPath) {
  const files = await readdir19(dirPath).catch(() => []);
  const jsonlFiles = new Set(files.filter((f) => f.endsWith(".jsonl")).map((f) => join35(dirPath, f)));
  const directSubagentsPath = join35(dirPath, "subagents");
  const directSubFiles = await readdir19(directSubagentsPath).catch(() => []);
  for (const sf of directSubFiles) {
    if (sf.endsWith(".jsonl")) jsonlFiles.add(join35(directSubagentsPath, sf));
  }
  for (const entry of files) {
    if (entry.endsWith(".jsonl")) continue;
    const subagentsPath = join35(dirPath, entry, "subagents");
    const subFiles = await readdir19(subagentsPath).catch(() => []);
    for (const sf of subFiles) {
      if (sf.endsWith(".jsonl")) jsonlFiles.add(join35(subagentsPath, sf));
    }
  }
  return [...jsonlFiles];
}
async function scanProjectDirs(dirs, seenMsgIds, diskCache, dateRange) {
  const section = getOrCreateProviderSection(diskCache, "claude");
  const allDiscoveredFiles = /* @__PURE__ */ new Set();
  const unchangedFiles = [];
  const changedFiles = [];
  for (const { path: dirPath, name: dirName } of dirs) {
    const jsonlFiles = await collectJsonlFiles(dirPath);
    for (const filePath of jsonlFiles) {
      allDiscoveredFiles.add(filePath);
      const fp = await fingerprintFile2(filePath);
      if (!fp) continue;
      const action = reconcileFile(fp, section.files[filePath]);
      if (action.action === "unchanged") {
        unchangedFiles.push({ filePath, dirName, cached: section.files[filePath] });
      } else {
        changedFiles.push({ filePath, info: { dirName, fp } });
      }
    }
  }
  for (const { cached } of unchangedFiles) {
    for (const turn of cached.turns) {
      for (const call of turn.calls) {
        seenMsgIds.add(call.deduplicationKey);
      }
    }
  }
  for (const { filePath, info } of changedFiles) {
    delete section.files[filePath];
    const tracker = { lastCompleteLineOffset: 0 };
    const entries = await parseClaudeEntries(filePath, tracker);
    if (!entries) continue;
    const turns = groupIntoTurns(dedupeStreamingMessageIds(entries), seenMsgIds);
    const cwd = extractCanonicalCwd(entries);
    const canonical = cwd && !isCoworkSession(cwd, filePath) ? await resolveCanonicalProjectPath(cwd) : void 0;
    section.files[filePath] = {
      fingerprint: info.fp,
      lastCompleteLineOffset: tracker.lastCompleteLineOffset,
      canonicalCwd: canonical?.path,
      canonicalProjectName: canonical?.isWorktree ? projectNameFromPath2(canonical.path, info.dirName) : void 0,
      mcpInventory: extractMcpInventory(entries),
      turns: turns.map(parsedTurnToCachedTurn)
    };
    diskCache._dirty = true;
  }
  if (dirs.length > 0) {
    for (const cachedPath of Object.keys(section.files)) {
      if (!allDiscoveredFiles.has(cachedPath)) {
        delete section.files[cachedPath];
        diskCache._dirty = true;
      }
    }
  }
  const projectMap = /* @__PURE__ */ new Map();
  const allFiles = [
    ...unchangedFiles.map((f) => ({ filePath: f.filePath, dirName: f.dirName })),
    ...changedFiles.map((f) => ({ filePath: f.filePath, dirName: f.info.dirName }))
  ];
  for (const { filePath, dirName } of allFiles) {
    const cachedFile = section.files[filePath];
    if (!cachedFile || cachedFile.turns.length === 0) continue;
    let classifiedTurns = cachedFile.turns.map(cachedTurnToClassified);
    if (dateRange) {
      classifiedTurns = classifiedTurns.filter((turn) => {
        if (turn.assistantCalls.length === 0) return false;
        const firstCallTs = turn.assistantCalls[0].timestamp;
        if (!firstCallTs) return false;
        const ts = new Date(firstCallTs);
        return ts >= dateRange.start && ts <= dateRange.end;
      });
    }
    if (classifiedTurns.length === 0) continue;
    const sessionId = basename16(filePath, ".jsonl");
    const projectPath = cachedFile.canonicalCwd ?? unsanitizePath(dirName);
    const projectName = cachedFile.canonicalProjectName ?? dirName;
    const mcpInv = cachedFile.mcpInventory.length > 0 ? cachedFile.mcpInventory : void 0;
    const session = buildSessionSummary(sessionId, projectName, classifiedTurns, mcpInv);
    if (session.apiCalls > 0) {
      const projectKey = cachedFile.canonicalCwd ? normalizeProjectPathKey(cachedFile.canonicalCwd) : `slug:${dirName}`;
      const existing = projectMap.get(projectKey);
      if (existing) {
        existing.sessions.push(session);
        existing.dirNames.add(dirName);
      } else {
        projectMap.set(projectKey, { project: projectName, projectPath, sessions: [session], dirNames: /* @__PURE__ */ new Set([dirName]) });
      }
    }
  }
  const cwdKeyByDirName = /* @__PURE__ */ new Map();
  for (const [key, entry] of projectMap) {
    if (key.startsWith("slug:")) continue;
    for (const dirName of entry.dirNames) {
      if (!cwdKeyByDirName.has(dirName)) cwdKeyByDirName.set(dirName, key);
    }
  }
  for (const [key, entry] of [...projectMap]) {
    if (!key.startsWith("slug:")) continue;
    const cwdKey = cwdKeyByDirName.get(entry.project);
    if (!cwdKey) continue;
    const target = projectMap.get(cwdKey);
    target.sessions.push(...entry.sessions);
    projectMap.delete(key);
  }
  const projects = [];
  for (const { project, projectPath, sessions } of projectMap.values()) {
    projects.push({
      project,
      projectPath,
      sessions,
      totalCostUSD: sessions.reduce((s, sess) => s + sess.totalCostUSD, 0),
      totalApiCalls: sessions.reduce((s, sess) => s + sess.apiCalls, 0)
    });
  }
  return projects;
}
function providerCallToCachedCall(call) {
  return {
    provider: call.provider,
    model: call.model,
    usage: {
      inputTokens: call.inputTokens,
      outputTokens: call.outputTokens,
      cacheCreationInputTokens: call.cacheCreationInputTokens,
      cacheReadInputTokens: call.cacheReadInputTokens,
      cachedInputTokens: call.cachedInputTokens,
      reasoningTokens: call.reasoningTokens,
      webSearchRequests: call.webSearchRequests,
      cacheCreationOneHourTokens: 0
    },
    costUSD: call.provider === "mistral-vibe" || call.provider === "antigravity" ? call.costUSD : void 0,
    speed: call.speed,
    timestamp: call.timestamp,
    tools: call.tools,
    bashCommands: call.bashCommands,
    skills: [],
    subagentTypes: [],
    deduplicationKey: call.deduplicationKey,
    project: call.project,
    projectPath: call.projectPath,
    toolSequence: call.toolSequence
  };
}
async function canonicalizeProviderCallProject(call) {
  if (!call.projectPath) return call;
  const canonical = await resolveCanonicalProjectPath(call.projectPath);
  if (!canonical.isWorktree) return call;
  return {
    ...call,
    project: projectNameFromPath2(canonical.path, call.project ?? canonical.path),
    projectPath: canonical.path
  };
}
function apiCallToCachedCall(call) {
  return {
    provider: call.provider,
    model: call.model,
    usage: { ...call.usage, cacheCreationOneHourTokens: call.cacheCreationOneHourTokens ?? 0 },
    speed: call.speed,
    timestamp: call.timestamp,
    tools: call.tools,
    bashCommands: call.bashCommands,
    skills: call.skills,
    subagentTypes: call.subagentTypes,
    deduplicationKey: call.deduplicationKey,
    toolSequence: call.toolSequence
  };
}
function parsedTurnToCachedTurn(turn) {
  return {
    timestamp: turn.timestamp,
    sessionId: turn.sessionId,
    userMessage: turn.userMessage.slice(0, 2e3),
    calls: turn.assistantCalls.map(apiCallToCachedCall)
  };
}
function providerCallToCachedTurn(call) {
  return {
    timestamp: call.timestamp,
    sessionId: call.sessionId,
    userMessage: call.userMessage.slice(0, 2e3),
    calls: [providerCallToCachedCall(call)]
  };
}
function providerCallsToCachedTurns(calls) {
  const turns = [];
  const grouped = /* @__PURE__ */ new Map();
  for (const call of calls) {
    if (!call.turnId) {
      turns.push(providerCallToCachedTurn(call));
      continue;
    }
    const key = `${call.sessionId}\0${call.turnId}`;
    let turn = grouped.get(key);
    if (!turn) {
      turn = {
        timestamp: call.timestamp,
        sessionId: call.sessionId,
        userMessage: call.userMessage.slice(0, 2e3),
        calls: []
      };
      grouped.set(key, turn);
      turns.push(turn);
    }
    turn.calls.push(providerCallToCachedCall(call));
  }
  return turns;
}
function cachedCallToApiCall(call) {
  const u = call.usage;
  const outputForCost = call.provider === "claude" ? u.outputTokens : u.outputTokens + u.reasoningTokens;
  const costUSD = calculateCost(
    call.model,
    u.inputTokens,
    outputForCost,
    u.cacheCreationInputTokens,
    u.cacheReadInputTokens,
    u.webSearchRequests,
    call.speed,
    u.cacheCreationOneHourTokens
  );
  return {
    provider: call.provider,
    model: call.model,
    usage: {
      inputTokens: u.inputTokens,
      outputTokens: u.outputTokens,
      cacheCreationInputTokens: u.cacheCreationInputTokens,
      cacheReadInputTokens: u.cacheReadInputTokens,
      cachedInputTokens: u.cachedInputTokens,
      reasoningTokens: u.reasoningTokens,
      webSearchRequests: u.webSearchRequests
    },
    costUSD: call.costUSD ?? costUSD,
    tools: call.tools,
    mcpTools: extractMcpTools(call.tools),
    skills: call.skills,
    subagentTypes: call.subagentTypes ?? [],
    hasAgentSpawn: call.tools.includes("Agent"),
    hasPlanMode: call.tools.includes("EnterPlanMode"),
    speed: call.speed,
    timestamp: call.timestamp,
    bashCommands: call.bashCommands,
    deduplicationKey: call.deduplicationKey,
    cacheCreationOneHourTokens: u.cacheCreationOneHourTokens || void 0,
    toolSequence: call.toolSequence
  };
}
function cachedTurnToClassified(turn) {
  const parsed = {
    userMessage: turn.userMessage,
    assistantCalls: turn.calls.map(cachedCallToApiCall),
    timestamp: turn.timestamp,
    sessionId: turn.sessionId
  };
  return classifyTurn(parsed);
}
async function parseClaudeEntries(filePath, tracker) {
  const entries = [];
  let hasLines = false;
  for await (const line of readSessionLines(filePath, void 0, {
    largeLineAsBuffer: true,
    byteOffsetTracker: tracker
  })) {
    hasLines = true;
    const entry = parseJsonlLine(line);
    if (entry) entries.push(compactEntry(entry));
  }
  if (!hasLines || entries.length === 0) return null;
  return entries;
}
function getOrCreateProviderSection(cache, provider) {
  const envFp = computeEnvFingerprint(provider);
  const existing = cache.providers[provider];
  if (existing && existing.envFingerprint === envFp) return existing;
  const section = { envFingerprint: envFp, files: {} };
  cache.providers[provider] = section;
  return section;
}
function cachedFileNeedsProviderReparse(providerName, sourcePath, cached) {
  if (providerName === "antigravity") return shouldReparseAntigravitySource(sourcePath, cached.turns.length);
  if (providerName !== "gemini") return false;
  return cached.turns.some(
    (turn) => turn.calls.some((call) => call.deduplicationKey === `gemini:${turn.sessionId}`)
  );
}
function warnProviderReadFailureOnce(providerName, err) {
  const key = `${providerName}:sqlite-busy`;
  if (warnedProviderReadFailures.has(key)) return;
  warnedProviderReadFailures.add(key);
  if (isSqliteBusyError(err)) {
    process.stderr.write(
      `codeburn: skipped ${providerName} data because its SQLite database is temporarily locked; will retry on the next refresh.
`
    );
  }
}
async function parseProviderSources(providerName, sources, seenKeys, diskCache, dateRange) {
  const provider = await getProvider(providerName);
  if (!provider) return [];
  const section = getOrCreateProviderSection(diskCache, providerName);
  const allDiscoveredFiles = /* @__PURE__ */ new Set();
  const unchangedSources = [];
  const changedSources = [];
  for (const source of sources) {
    allDiscoveredFiles.add(source.path);
    const fp = await fingerprintFile2(source.path);
    if (!fp) continue;
    const cached = section.files[source.path];
    const action = reconcileFile(fp, cached);
    if (action.action === "unchanged" && cached && !cachedFileNeedsProviderReparse(providerName, source.path, cached)) {
      unchangedSources.push({ source, cached });
    } else {
      changedSources.push({ source, fp });
    }
  }
  const parserDedup = new Set(seenKeys);
  for (const { cached } of unchangedSources) {
    for (const turn of cached.turns) {
      for (const call of turn.calls) {
        parserDedup.add(call.deduplicationKey);
      }
    }
  }
  let didParse = false;
  try {
    for (const { source, fp } of changedSources) {
      if (dateRange) {
        if (fp.mtimeMs < dateRange.start.getTime()) continue;
      }
      delete section.files[source.path];
      const parser = provider.createSessionParser(
        { path: source.path, project: source.project, provider: providerName },
        parserDedup
      );
      try {
        const providerCalls = [];
        for await (const call of parser.parse()) {
          providerCalls.push(call);
        }
        const canonicalCalls = await Promise.all(providerCalls.map(canonicalizeProviderCallProject));
        const turns = providerCallsToCachedTurns(canonicalCalls);
        section.files[source.path] = { fingerprint: fp, mcpInventory: [], turns };
        didParse = true;
        diskCache._dirty = true;
      } catch (err) {
        if (isSqliteBusyError(err)) {
          warnProviderReadFailureOnce(providerName, err);
          continue;
        }
        throw err;
      }
    }
  } finally {
    if (didParse && providerName === "codex") await flushCodexCache();
    if (didParse && providerName === "antigravity") {
      const liveIds = new Set(sources.map((s) => antigravityCascadeIdFromPath(s.path)));
      await flushAntigravityCache(liveIds);
    }
  }
  if (sources.length > 0) {
    for (const cachedPath of Object.keys(section.files)) {
      if (!allDiscoveredFiles.has(cachedPath)) {
        delete section.files[cachedPath];
        diskCache._dirty = true;
      }
    }
  }
  const sessionMap = /* @__PURE__ */ new Map();
  for (const source of sources) {
    const cachedFile = section.files[source.path];
    if (!cachedFile) continue;
    for (const turn of cachedFile.turns) {
      const hasDup = turn.calls.some((c) => seenKeys.has(c.deduplicationKey));
      if (hasDup) continue;
      for (const c of turn.calls) seenKeys.add(c.deduplicationKey);
      if (dateRange) {
        const callTs = turn.calls[0]?.timestamp;
        if (!callTs) continue;
        const ts = new Date(callTs);
        if (ts < dateRange.start || ts > dateRange.end) continue;
      }
      const classified = cachedTurnToClassified(turn);
      const project = turn.calls[0]?.project ?? source.project;
      const key = `${providerName}:${turn.sessionId}:${project}`;
      const existing = sessionMap.get(key);
      if (existing) {
        existing.turns.push(classified);
        if (!existing.projectPath && turn.calls[0]?.projectPath) {
          existing.projectPath = turn.calls[0].projectPath;
        }
      } else {
        sessionMap.set(key, { project, projectPath: turn.calls[0]?.projectPath, turns: [classified] });
      }
    }
  }
  const projectMap = /* @__PURE__ */ new Map();
  for (const [key, { project, projectPath, turns }] of sessionMap) {
    const sessionId = key.split(":")[1] ?? key;
    const session = buildSessionSummary(sessionId, project, turns);
    if (session.apiCalls > 0) {
      const existing = projectMap.get(project);
      if (existing) {
        existing.sessions.push(session);
        if (!existing.projectPath && projectPath) existing.projectPath = projectPath;
      } else {
        projectMap.set(project, { projectPath, sessions: [session] });
      }
    }
  }
  const projects = [];
  for (const [dirName, { projectPath, sessions }] of projectMap) {
    projects.push({
      project: dirName,
      projectPath: projectPath ?? unsanitizePath(dirName),
      sessions,
      totalCostUSD: sessions.reduce((s, sess) => s + sess.totalCostUSD, 0),
      totalApiCalls: sessions.reduce((s, sess) => s + sess.apiCalls, 0)
    });
  }
  return projects;
}
function cacheKey(dateRange, providerFilter) {
  const s = dateRange ? `${dateRange.start.getTime()}:${dateRange.end.getTime()}` : "none";
  const claudeEnv = (process.env["CLAUDE_CONFIG_DIRS"] ?? "") + "|" + (process.env["CLAUDE_CONFIG_DIR"] ?? "");
  return `${s}:${providerFilter ?? "all"}:${claudeEnv}`;
}
function clearSessionCache() {
  sessionCache.clear();
}
function cachePut(key, data) {
  const now = Date.now();
  for (const [k, v] of sessionCache) {
    if (now - v.ts > CACHE_TTL_MS3) sessionCache.delete(k);
  }
  if (sessionCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = [...sessionCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) sessionCache.delete(oldest[0]);
  }
  sessionCache.set(key, { data, ts: now });
}
function filterProjectsByName(projects, include, exclude) {
  let result = projects;
  if (include && include.length > 0) {
    const patterns = include.map((s) => s.toLowerCase());
    result = result.filter((p) => {
      const name = p.project.toLowerCase();
      const path = p.projectPath.toLowerCase();
      return patterns.some((pat) => name.includes(pat) || path.includes(pat));
    });
  }
  if (exclude && exclude.length > 0) {
    const patterns = exclude.map((s) => s.toLowerCase());
    result = result.filter((p) => {
      const name = p.project.toLowerCase();
      const path = p.projectPath.toLowerCase();
      return !patterns.some((pat) => name.includes(pat) || path.includes(pat));
    });
  }
  return result;
}
function turnIsInDateRange(turn, dateRange) {
  if (turn.assistantCalls.length === 0) return false;
  const firstCallTs = turn.assistantCalls[0].timestamp;
  if (!firstCallTs) return false;
  const ts = new Date(firstCallTs);
  return ts >= dateRange.start && ts <= dateRange.end;
}
function turnDayString(turn) {
  if (turn.assistantCalls.length === 0) return null;
  const ts = turn.assistantCalls[0].timestamp;
  if (!ts) return null;
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function filterProjectsByDays(projects, days) {
  const filtered = [];
  for (const project of projects) {
    const sessions = [];
    for (const session of project.sessions) {
      const turns = session.turns.filter((turn) => {
        const ds = turnDayString(turn);
        return ds !== null && days.has(ds);
      });
      if (turns.length === 0) continue;
      sessions.push(buildSessionSummary(session.sessionId, session.project, turns, session.mcpInventory));
    }
    if (sessions.length === 0) continue;
    filtered.push({
      project: project.project,
      projectPath: project.projectPath,
      sessions,
      totalCostUSD: sessions.reduce((s, sess) => s + sess.totalCostUSD, 0),
      totalApiCalls: sessions.reduce((s, sess) => s + sess.apiCalls, 0)
    });
  }
  return filtered.sort((a, b) => b.totalCostUSD - a.totalCostUSD);
}
function filterProjectsByDateRange(projects, dateRange) {
  const filtered = [];
  for (const project of projects) {
    const sessions = [];
    for (const session of project.sessions) {
      const turns = session.turns.filter((turn) => turnIsInDateRange(turn, dateRange));
      if (turns.length === 0) continue;
      sessions.push(buildSessionSummary(session.sessionId, session.project, turns, session.mcpInventory));
    }
    if (sessions.length === 0) continue;
    filtered.push({
      project: project.project,
      projectPath: project.projectPath,
      sessions,
      totalCostUSD: sessions.reduce((s, sess) => s + sess.totalCostUSD, 0),
      totalApiCalls: sessions.reduce((s, sess) => s + sess.apiCalls, 0)
    });
  }
  return filtered.sort((a, b) => b.totalCostUSD - a.totalCostUSD);
}
async function parseAllSessions(dateRange, providerFilter) {
  const key = cacheKey(dateRange, providerFilter);
  const cached = sessionCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS3) return cached.data;
  const diskCache = await loadCache3();
  await cleanupOrphanedTempFiles();
  const seenMsgIds = /* @__PURE__ */ new Set();
  const seenKeys = /* @__PURE__ */ new Set();
  const allSources = await discoverAllSessions(providerFilter);
  const claudeSources = allSources.filter((s) => s.provider === "claude");
  const nonClaudeSources = allSources.filter((s) => s.provider !== "claude");
  const claudeDirs = claudeSources.map((s) => ({ path: s.path, name: s.project }));
  const claudeProjects = await scanProjectDirs(claudeDirs, seenMsgIds, diskCache, dateRange);
  const providerGroups = /* @__PURE__ */ new Map();
  for (const source of nonClaudeSources) {
    const existing = providerGroups.get(source.provider) ?? [];
    existing.push({ path: source.path, project: source.project });
    providerGroups.set(source.provider, existing);
  }
  const otherProjects = [];
  for (const [providerName, sources] of providerGroups) {
    const projects = await parseProviderSources(providerName, sources, seenKeys, diskCache, dateRange);
    otherProjects.push(...projects);
  }
  if (diskCache._dirty) {
    try {
      await saveCache(diskCache);
    } catch {
    }
  }
  const resolvedOtherProjects = await Promise.all(otherProjects.map(async (p) => {
    const absPath = p.projectPath.startsWith("/") || p.projectPath.startsWith("\\") ? p.projectPath : "/" + p.projectPath;
    const canonical = await resolveCanonicalProjectPath(absPath);
    if (!canonical.isWorktree && canonical.path === absPath.replace(/[/\\]+$/, "")) return p;
    return { ...p, project: projectNameFromPath2(canonical.path, p.project), projectPath: canonical.path };
  }));
  const crossProviderKey = (p) => {
    const path = p.projectPath.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
    return path.includes("/") ? path : p.project.toLowerCase();
  };
  const mergedMap = /* @__PURE__ */ new Map();
  for (const p of [...claudeProjects, ...resolvedOtherProjects]) {
    const key2 = crossProviderKey(p);
    const existing = mergedMap.get(key2);
    if (existing) {
      existing.sessions.push(...p.sessions);
      existing.totalCostUSD += p.totalCostUSD;
      existing.totalApiCalls += p.totalApiCalls;
    } else {
      mergedMap.set(key2, { ...p });
    }
  }
  const result = Array.from(mergedMap.values()).sort((a, b) => b.totalCostUSD - a.totalCostUSD);
  cachePut(key, result);
  return result;
}
var LARGE_JSONL_LINE_BYTES, RAW_HEAD_BYTES2, USER_TEXT_CAP, BASH_COMMAND_CAP, MAX_TOOL_BLOCKS, MAX_ADDED_NAMES, warnedProviderReadFailures, CACHE_TTL_MS3, MAX_CACHE_ENTRIES, sessionCache;
var init_parser = __esm({
  "src/parser.ts"() {
    "use strict";
    init_fs_utils();
    init_models();
    init_providers();
    init_codex_cache();
    init_antigravity();
    init_claude();
    init_sqlite();
    init_session_cache();
    init_classifier();
    init_bash_utils();
    LARGE_JSONL_LINE_BYTES = 32 * 1024;
    RAW_HEAD_BYTES2 = 2048;
    USER_TEXT_CAP = 2e3;
    BASH_COMMAND_CAP = 2e3;
    MAX_TOOL_BLOCKS = 500;
    MAX_ADDED_NAMES = 1e3;
    warnedProviderReadFailures = /* @__PURE__ */ new Set();
    CACHE_TTL_MS3 = 18e4;
    MAX_CACHE_ENTRIES = 10;
    sessionCache = /* @__PURE__ */ new Map();
  }
});

// src/format.ts
import chalk from "chalk";
function formatTokens(n) {
  if (!Number.isFinite(n)) return "?";
  if (n < 0) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toString();
}
function localDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function renderStatusBar(projects) {
  const now = /* @__PURE__ */ new Date();
  const today = localDateString(now);
  const monthStart = `${today.slice(0, 7)}-01`;
  let todayCost = 0, todayCalls = 0, monthCost = 0, monthCalls = 0;
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (turn.assistantCalls.length === 0) continue;
        const bucketTs = turn.assistantCalls[0].timestamp;
        if (!bucketTs) continue;
        const day = localDateString(new Date(bucketTs));
        const turnCost = turn.assistantCalls.reduce((s, c) => s + c.costUSD, 0);
        const turnCalls = turn.assistantCalls.length;
        if (day === today) {
          todayCost += turnCost;
          todayCalls += turnCalls;
        }
        if (day >= monthStart) {
          monthCost += turnCost;
          monthCalls += turnCalls;
        }
      }
    }
  }
  const lines = [""];
  lines.push(`  ${chalk.bold("Today")}  ${chalk.yellowBright(formatCost(todayCost))}  ${chalk.dim(`${todayCalls} calls`)}    ${chalk.bold("Month")}  ${chalk.yellowBright(formatCost(monthCost))}  ${chalk.dim(`${monthCalls} calls`)}`);
  lines.push("");
  return lines.join("\n");
}
var init_format = __esm({
  "src/format.ts"() {
    "use strict";
    init_currency();
  }
});

// src/models-report.ts
var models_report_exports = {};
__export(models_report_exports, {
  aggregateModels: () => aggregateModels,
  renderCsv: () => renderCsv,
  renderJson: () => renderJson,
  renderMarkdown: () => renderMarkdown,
  renderTable: () => renderTable
});
import chalk3 from "chalk";
function bucketKey(provider, model, category) {
  return `${provider} ${model} ${category ?? ""}`;
}
async function aggregateModels(projects, opts = {}) {
  const buckets = /* @__PURE__ */ new Map();
  const perModelCategoryCost = /* @__PURE__ */ new Map();
  const perModelTotalCost = /* @__PURE__ */ new Map();
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (opts.taskFilter && turn.category !== opts.taskFilter) continue;
        for (const call of turn.assistantCalls) {
          const provider = call.provider || "unknown";
          const model = call.model || "unknown";
          const category = opts.byTask ? turn.category : null;
          const key = bucketKey(provider, model, category);
          let bucket = buckets.get(key);
          if (!bucket) {
            bucket = {
              provider,
              model,
              category,
              inputTokens: 0,
              outputTokens: 0,
              cacheWriteTokens: 0,
              cacheReadTokens: 0,
              costUSD: 0,
              calls: 0
            };
            buckets.set(key, bucket);
          }
          bucket.inputTokens += call.usage.inputTokens;
          bucket.outputTokens += call.usage.outputTokens + call.usage.reasoningTokens;
          bucket.cacheWriteTokens += call.usage.cacheCreationInputTokens;
          bucket.cacheReadTokens += call.usage.cacheReadInputTokens + call.usage.cachedInputTokens;
          bucket.costUSD += call.costUSD;
          bucket.calls += 1;
          const modelKey = `${provider} ${model}`;
          let perCat = perModelCategoryCost.get(modelKey);
          if (!perCat) {
            perCat = /* @__PURE__ */ new Map();
            perModelCategoryCost.set(modelKey, perCat);
          }
          perCat.set(turn.category, (perCat.get(turn.category) ?? 0) + call.costUSD);
          perModelTotalCost.set(modelKey, (perModelTotalCost.get(modelKey) ?? 0) + call.costUSD);
        }
      }
    }
  }
  const providerCache = /* @__PURE__ */ new Map();
  async function resolveProvider(name) {
    const cached = providerCache.get(name);
    if (cached) return cached;
    const p = await getProvider(name);
    const entry = {
      displayName: p?.displayName ?? name,
      formatModel: p ? (m) => p.modelDisplayName(m) : (m) => m
    };
    providerCache.set(name, entry);
    return entry;
  }
  const rows = [];
  for (const bucket of buckets.values()) {
    const meta = await resolveProvider(bucket.provider);
    const total = bucket.inputTokens + bucket.outputTokens + bucket.cacheWriteTokens + bucket.cacheReadTokens;
    const row = {
      provider: bucket.provider,
      providerDisplayName: meta.displayName,
      model: bucket.model,
      modelDisplayName: meta.formatModel(bucket.model),
      category: bucket.category,
      inputTokens: bucket.inputTokens,
      outputTokens: bucket.outputTokens,
      cacheWriteTokens: bucket.cacheWriteTokens,
      cacheReadTokens: bucket.cacheReadTokens,
      totalTokens: total,
      costUSD: bucket.costUSD,
      calls: bucket.calls
    };
    if (!opts.byTask) {
      const perCat = perModelCategoryCost.get(`${bucket.provider} ${bucket.model}`);
      if (perCat && perCat.size > 0) {
        let topCat = "general";
        let topCost = -1;
        let totalCost = 0;
        for (const [cat, cost] of perCat.entries()) {
          totalCost += cost;
          if (cost > topCost) {
            topCost = cost;
            topCat = cat;
          }
        }
        row.topCategory = topCat;
        row.topCategoryCost = topCost;
        row.topCategoryShare = totalCost > 0 ? topCost / totalCost : 0;
      }
    }
    rows.push(row);
  }
  if (opts.byTask) {
    rows.sort((a, b) => {
      const aTotal = perModelTotalCost.get(`${a.provider} ${a.model}`) ?? 0;
      const bTotal = perModelTotalCost.get(`${b.provider} ${b.model}`) ?? 0;
      if (aTotal !== bTotal) return bTotal - aTotal;
      if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
      if (a.model !== b.model) return a.model.localeCompare(b.model);
      return b.costUSD - a.costUSD;
    });
  } else {
    rows.sort((a, b) => b.costUSD - a.costUSD);
  }
  let filtered = rows;
  if (opts.minCost !== void 0) {
    filtered = filtered.filter((r) => r.costUSD >= opts.minCost);
  }
  if (opts.topN !== void 0) {
    filtered = filtered.slice(0, opts.topN);
  }
  return filtered;
}
function visibleLength(text) {
  return stripAnsi(text).length;
}
function pad(text, width, align = "left") {
  const visible = visibleLength(text);
  if (visible >= width) return text;
  const filler = " ".repeat(width - visible);
  return align === "left" ? text + filler : filler + text;
}
function categoryLabel(c) {
  return CATEGORY_LABELS[c] ?? c;
}
function defaultColumns(byTask) {
  return [
    { key: "provider", header: "Provider", align: "left", width: 8, priority: 0 },
    { key: "model", header: "Model", align: "left", width: 8, priority: 0 },
    { key: "task", header: byTask ? "Task" : "Top Task", align: "left", width: 8, priority: 1 },
    { key: "input", header: "Input", align: "right", width: 6, priority: 2 },
    { key: "output", header: "Output", align: "right", width: 6, priority: 2 },
    { key: "cacheWrite", header: "Cache Write", align: "right", width: 11, priority: 3 },
    { key: "cacheRead", header: "Cache Read", align: "right", width: 10, priority: 3 },
    { key: "total", header: "Total", align: "right", width: 6, priority: 0 },
    { key: "cost", header: "Cost", align: "right", width: 6, priority: 0 }
  ];
}
function sizeColumnsToContent(columns, rows) {
  return columns.map((col, i) => {
    let maxLen = visibleLength(col.header);
    for (const row of rows) {
      const cell = row[i] ?? "";
      const len = visibleLength(cell);
      if (len > maxLen) maxLen = len;
    }
    return { ...col, width: Math.max(col.width, maxLen) };
  });
}
function frameWidth(columns) {
  if (columns.length === 0) return 0;
  return 2 + columns.reduce((acc, c) => acc + c.width + 2, 0) + (columns.length - 1);
}
function chooseColumns(byTask, available) {
  const all = defaultColumns(byTask);
  if (frameWidth(all) <= available) return all;
  const kept = new Set(all);
  for (const group of DROP_COLUMN_GROUPS) {
    for (const key of group) {
      const col = all.find((c) => c.key === key);
      if (col) kept.delete(col);
    }
    const remaining = all.filter((c) => kept.has(c));
    if (frameWidth(remaining) <= available) return remaining;
  }
  return all.filter((c) => c.priority === 0);
}
function expandedColumnWeight(col) {
  switch (col.key) {
    case "task":
    case "model":
      return 3;
    case "provider":
      return 2;
    default:
      return 1;
  }
}
function expandColumnsToWidth(columns, targetWidth) {
  let remaining = targetWidth - frameWidth(columns);
  if (remaining <= 0 || columns.length === 0) return columns;
  const expanded = columns.map((c) => ({ ...c }));
  const weights = expanded.map(expandedColumnWeight);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < expanded.length; i++) {
    const add = Math.floor((targetWidth - frameWidth(columns)) * (weights[i] / totalWeight));
    if (add <= 0) continue;
    expanded[i].width += add;
    remaining -= add;
  }
  const preferred = ["task", "model", "provider", "total", "cost", "input", "output", "cacheRead", "cacheWrite"];
  while (remaining > 0) {
    let changed = false;
    for (const key of preferred) {
      const col = expanded.find((c) => c.key === key);
      if (!col) continue;
      col.width += 1;
      remaining -= 1;
      changed = true;
      if (remaining === 0) break;
    }
    if (!changed) break;
  }
  return expanded;
}
function renderRow(cells, columns) {
  const padded = cells.map((c, i) => pad(c, columns[i].width, columns[i].align));
  return BOX.vertical + " " + padded.join(" " + BOX.vertical + " ") + " " + BOX.vertical;
}
function renderBorder(columns, left, mid, right) {
  const segments = columns.map((c) => BOX.horizontal.repeat(c.width + 2));
  return left + segments.join(mid) + right;
}
function defaultTerminalWidth() {
  const cols = process.stdout.columns;
  if (typeof cols === "number" && cols > 0) return cols;
  const envCols = process.env["COLUMNS"] ? parseInt(process.env["COLUMNS"], 10) : NaN;
  if (Number.isFinite(envCols) && envCols > 0) return envCols;
  return 100;
}
function renderTable(rows, opts = {}) {
  const byTask = opts.byTask ?? false;
  const showTotals = opts.showTotals ?? true;
  const available = opts.terminalWidth ?? defaultTerminalWidth();
  const fullWidth = opts.fullWidth ?? true;
  const valueOf = (row, key, isNewGroup) => {
    switch (key) {
      case "provider":
        return isNewGroup ? row.providerDisplayName : "";
      case "model":
        return isNewGroup ? row.modelDisplayName : "";
      case "task":
        if (byTask) return row.category ? categoryLabel(row.category) : "";
        return row.topCategory ? `${categoryLabel(row.topCategory)} ${chalk3.dim(`(${Math.round((row.topCategoryShare ?? 0) * 100)}%)`)}` : chalk3.dim("-");
      case "input":
        return formatTokens(row.inputTokens);
      case "output":
        return formatTokens(row.outputTokens);
      case "cacheWrite":
        return formatTokens(row.cacheWriteTokens);
      case "cacheRead":
        return formatTokens(row.cacheReadTokens);
      case "total":
        return formatTokens(row.totalTokens);
      case "cost":
        return formatCost(row.costUSD);
    }
  };
  const rowEntries = [];
  let prevProviderModel = "";
  for (const row of rows) {
    const groupKey = `${row.provider} ${row.model}`;
    const isNewGroup = !byTask || groupKey !== prevProviderModel;
    prevProviderModel = groupKey;
    const allCells = defaultColumns(byTask).map((col) => {
      const raw = valueOf(row, col.key, isNewGroup);
      if (col.key === "provider" && raw) return chalk3.dim(raw);
      return raw;
    });
    rowEntries.push({ kind: "data", cells: allCells, isNewGroup });
  }
  let totalsEntry = null;
  if (showTotals && rows.length > 0) {
    const totals = rows.reduce(
      (acc, r) => {
        acc.input += r.inputTokens;
        acc.output += r.outputTokens;
        acc.cacheWrite += r.cacheWriteTokens;
        acc.cacheRead += r.cacheReadTokens;
        acc.total += r.totalTokens;
        acc.cost += r.costUSD;
        return acc;
      },
      { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, total: 0, cost: 0 }
    );
    const cells = defaultColumns(byTask).map((col) => {
      switch (col.key) {
        case "provider":
          return "";
        case "model":
          return chalk3.yellow.bold("Total");
        case "task":
          return "";
        case "input":
          return chalk3.yellow(formatTokens(totals.input));
        case "output":
          return chalk3.yellow(formatTokens(totals.output));
        case "cacheWrite":
          return chalk3.yellow(formatTokens(totals.cacheWrite));
        case "cacheRead":
          return chalk3.yellow(formatTokens(totals.cacheRead));
        case "total":
          return chalk3.yellow.bold(formatTokens(totals.total));
        case "cost":
          return chalk3.yellow.bold(formatCost(totals.cost));
      }
    });
    totalsEntry = { kind: "totals", cells, isNewGroup: true };
  }
  const allKeys = defaultColumns(byTask).map((c) => c.key);
  const indexByKey = new Map(allKeys.map((k, i) => [k, i]));
  const columns = chooseColumns(byTask, available);
  const projectColumns = (cols, entry) => cols.map((c) => entry.cells[indexByKey.get(c.key)] ?? "");
  const cellMatrix = [
    ...rowEntries.map((e) => projectColumns(columns, e)),
    ...totalsEntry ? [projectColumns(columns, totalsEntry)] : []
  ];
  const sized = sizeColumnsToContent(columns, cellMatrix);
  let final = sized;
  if (frameWidth(final) > available) {
    let reduced = columns;
    for (const group of DROP_COLUMN_GROUPS) {
      reduced = reduced.filter((c) => !group.includes(c.key));
      const reducedMatrix = [
        ...rowEntries.map((e) => projectColumns(reduced, e)),
        ...totalsEntry ? [projectColumns(reduced, totalsEntry)] : []
      ];
      const candidate = sizeColumnsToContent(reduced, reducedMatrix);
      final = candidate;
      if (frameWidth(candidate) <= available) break;
    }
  }
  if (fullWidth && frameWidth(final) < available) {
    final = expandColumnsToWidth(final, available);
  }
  const lines = [];
  lines.push(renderBorder(final, BOX.topLeft, BOX.topT, BOX.topRight));
  lines.push(renderRow(final.map((c) => chalk3.cyan.bold(c.header)), final));
  lines.push(renderBorder(final, BOX.leftT, BOX.cross, BOX.rightT));
  let isFirstRow = true;
  for (const entry of rowEntries) {
    if (byTask && entry.isNewGroup && !isFirstRow) {
      lines.push(renderBorder(final, BOX.leftT, BOX.cross, BOX.rightT));
    }
    isFirstRow = false;
    lines.push(renderRow(projectColumns(final, entry), final));
  }
  if (totalsEntry) {
    lines.push(renderBorder(final, BOX.leftT, BOX.cross, BOX.rightT));
    lines.push(renderRow(projectColumns(final, totalsEntry), final));
  }
  lines.push(renderBorder(final, BOX.bottomLeft, BOX.bottomT, BOX.bottomRight));
  return lines.join("\n");
}
function renderJson(rows) {
  return JSON.stringify(
    rows.map((r) => ({
      provider: r.provider,
      providerDisplayName: r.providerDisplayName,
      model: r.model,
      modelDisplayName: r.modelDisplayName,
      category: r.category ?? r.topCategory ?? null,
      topCategory: r.topCategory ?? null,
      topCategoryShare: r.topCategoryShare ?? null,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cacheWriteTokens: r.cacheWriteTokens,
      cacheReadTokens: r.cacheReadTokens,
      totalTokens: r.totalTokens,
      calls: r.calls,
      costUSD: r.costUSD
    })),
    null,
    2
  );
}
function csvEscape(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
function mdEscape(value) {
  return value.replace(/\|/g, "\\|");
}
function renderMarkdown(rows, opts = {}) {
  const byTask = opts.byTask ?? false;
  const showTotals = opts.showTotals ?? true;
  const header = byTask ? ["Provider", "Model", "Task", "Input", "Output", "Cache Write", "Cache Read", "Total", "Cost"] : ["Provider", "Model", "Top Task", "Input", "Output", "Cache Write", "Cache Read", "Total", "Cost"];
  const align = ["---", "---", "---", "---:", "---:", "---:", "---:", "---:", "---:"];
  const lines = [];
  lines.push(`| ${header.join(" | ")} |`);
  lines.push(`| ${align.join(" | ")} |`);
  for (const row of rows) {
    const taskCell = byTask ? row.category ? categoryLabel(row.category) : "" : row.topCategory ? `${categoryLabel(row.topCategory)} (${Math.round((row.topCategoryShare ?? 0) * 100)}%)` : "-";
    const cells = [
      mdEscape(row.providerDisplayName),
      `\`${mdEscape(row.modelDisplayName)}\``,
      taskCell,
      formatTokens(row.inputTokens),
      formatTokens(row.outputTokens),
      formatTokens(row.cacheWriteTokens),
      formatTokens(row.cacheReadTokens),
      formatTokens(row.totalTokens),
      formatCost(row.costUSD)
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }
  if (showTotals && rows.length > 0) {
    const totals = rows.reduce(
      (acc, r) => {
        acc.input += r.inputTokens;
        acc.output += r.outputTokens;
        acc.cacheWrite += r.cacheWriteTokens;
        acc.cacheRead += r.cacheReadTokens;
        acc.total += r.totalTokens;
        acc.cost += r.costUSD;
        return acc;
      },
      { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, total: 0, cost: 0 }
    );
    const totalCells = [
      "",
      "**Total**",
      "",
      `**${formatTokens(totals.input)}**`,
      `**${formatTokens(totals.output)}**`,
      `**${formatTokens(totals.cacheWrite)}**`,
      `**${formatTokens(totals.cacheRead)}**`,
      `**${formatTokens(totals.total)}**`,
      `**${formatCost(totals.cost)}**`
    ];
    lines.push(`| ${totalCells.join(" | ")} |`);
  }
  return lines.join("\n");
}
function renderCsv(rows, opts = {}) {
  const byTask = opts.byTask ?? false;
  const header = byTask ? ["provider", "model", "task", "input_tokens", "output_tokens", "cache_write_tokens", "cache_read_tokens", "total_tokens", "calls", "cost_usd"] : ["provider", "model", "top_task", "top_task_share", "input_tokens", "output_tokens", "cache_write_tokens", "cache_read_tokens", "total_tokens", "calls", "cost_usd"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const cells = byTask ? [
      csvEscape(r.providerDisplayName),
      csvEscape(r.modelDisplayName),
      r.category ? categoryLabel(r.category) : "",
      String(r.inputTokens),
      String(r.outputTokens),
      String(r.cacheWriteTokens),
      String(r.cacheReadTokens),
      String(r.totalTokens),
      String(r.calls),
      r.costUSD.toFixed(6)
    ] : [
      csvEscape(r.providerDisplayName),
      csvEscape(r.modelDisplayName),
      r.topCategory ? categoryLabel(r.topCategory) : "",
      r.topCategoryShare !== void 0 ? r.topCategoryShare.toFixed(4) : "",
      String(r.inputTokens),
      String(r.outputTokens),
      String(r.cacheWriteTokens),
      String(r.cacheReadTokens),
      String(r.totalTokens),
      String(r.calls),
      r.costUSD.toFixed(6)
    ];
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}
var BOX, DROP_COLUMN_GROUPS;
var init_models_report = __esm({
  "src/models-report.ts"() {
    "use strict";
    init_strip_ansi();
    init_format();
    init_providers();
    init_types();
    BOX = {
      topLeft: "\u250C",
      topRight: "\u2510",
      bottomLeft: "\u2514",
      bottomRight: "\u2518",
      topT: "\u252C",
      bottomT: "\u2534",
      leftT: "\u251C",
      rightT: "\u2524",
      cross: "\u253C",
      horizontal: "\u2500",
      vertical: "\u2502"
    };
    DROP_COLUMN_GROUPS = [
      ["cacheWrite", "cacheRead"],
      ["input", "output"],
      ["task"]
    ];
  }
});

// src/yield.ts
var yield_exports = {};
__export(yield_exports, {
  computeYield: () => computeYield,
  formatYieldSummary: () => formatYieldSummary
});
import { execFileSync } from "child_process";
function runGit(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}
function isGitRepo(dir) {
  return runGit(["rev-parse", "--is-inside-work-tree"], dir) === "true";
}
function getMainBranch(cwd) {
  const result = runGit(["symbolic-ref", "refs/remotes/origin/HEAD"], cwd);
  if (result) {
    const branch = result.replace("refs/remotes/origin/", "");
    if (SAFE_REF_PATTERN.test(branch)) return branch;
  }
  const branches = runGit(["branch", "-a"], cwd) ?? "";
  if (branches.includes("main")) return "main";
  if (branches.includes("master")) return "master";
  return "main";
}
function getRevertedShas(cwd) {
  const bodies = runGit(
    ["log", "--all", "--grep=^This reverts commit", "--format=%B%x1e"],
    cwd
  ) ?? "";
  const set = /* @__PURE__ */ new Set();
  const re = /This reverts commit ([0-9a-f]{7,40})/g;
  let m;
  while ((m = re.exec(bodies)) !== null) {
    set.add(m[1].toLowerCase());
  }
  return set;
}
function getCommitsInRange(cwd, since, until, mainBranch) {
  const sinceStr = since.toISOString();
  const untilStr = until.toISOString();
  const log = runGit(
    ["log", "--all", `--since=${sinceStr}`, `--until=${untilStr}`, "--format=%H|%aI|%s"],
    cwd
  );
  if (!log) return [];
  const mainCommits = new Set(
    (runGit(["log", mainBranch, "--format=%H"], cwd) ?? "").split("\n").filter(Boolean)
  );
  const revertedShas = getRevertedShas(cwd);
  return log.split("\n").filter(Boolean).map((line) => {
    const [sha] = line.split("|");
    const timestamp = line.split("|")[1] ?? "";
    return {
      sha,
      timestamp: new Date(timestamp),
      inMain: mainCommits.has(sha),
      // wasReverted: matches when ANY later commit's body says
      // "This reverts commit <sha>". Compare against the full SHA AND its
      // 7-char short prefix to be safe; git revert sometimes records the
      // short form.
      wasReverted: revertedShas.has(sha.toLowerCase()) || revertedShas.has(sha.toLowerCase().slice(0, 7))
    };
  });
}
function categorizeSession(session, commits) {
  if (!session.firstTimestamp) {
    return { category: "abandoned", commitCount: 0 };
  }
  const sessionStart = new Date(session.firstTimestamp);
  const lastTs = session.lastTimestamp ?? session.firstTimestamp;
  const sessionEnd = new Date(new Date(lastTs).getTime() + 60 * 60 * 1e3);
  const relevantCommits = commits.filter(
    (c) => c.timestamp >= sessionStart && c.timestamp <= sessionEnd
  );
  if (relevantCommits.length === 0) {
    return { category: "abandoned", commitCount: 0 };
  }
  const inMainCount = relevantCommits.filter((c) => c.inMain).length;
  const revertedCount = relevantCommits.filter((c) => c.inMain && c.wasReverted).length;
  if (revertedCount > 0 && revertedCount >= inMainCount / 2) {
    return { category: "reverted", commitCount: relevantCommits.length };
  }
  if (inMainCount > 0) {
    return { category: "productive", commitCount: inMainCount };
  }
  return { category: "abandoned", commitCount: relevantCommits.length };
}
async function computeYield(range, cwd) {
  const projects = await parseAllSessions(range, "all");
  const summary = {
    productive: { cost: 0, sessions: 0 },
    reverted: { cost: 0, sessions: 0 },
    abandoned: { cost: 0, sessions: 0 },
    total: { cost: 0, sessions: 0 },
    details: []
  };
  const commits = isGitRepo(cwd) ? getCommitsInRange(cwd, range.start, range.end, getMainBranch(cwd)) : [];
  for (const project of projects) {
    const projectCwd = project.projectPath && isGitRepo(project.projectPath) ? project.projectPath : cwd;
    const projectCommits = projectCwd !== cwd && isGitRepo(projectCwd) ? getCommitsInRange(projectCwd, range.start, range.end, getMainBranch(projectCwd)) : commits;
    for (const session of project.sessions) {
      const { category, commitCount } = categorizeSession(session, projectCommits);
      summary[category].cost += session.totalCostUSD;
      summary[category].sessions += 1;
      summary.total.cost += session.totalCostUSD;
      summary.total.sessions += 1;
      summary.details.push({
        sessionId: session.sessionId,
        project: project.project,
        cost: session.totalCostUSD,
        category,
        commitCount
      });
    }
  }
  return summary;
}
function formatYieldSummary(summary) {
  const { productive, reverted, abandoned, total } = summary;
  const pct2 = (n) => total.cost > 0 ? Math.round(n / total.cost * 100) : 0;
  const fmt = (n) => `$${n.toFixed(2)}`;
  const lines = [
    "",
    `Productive:  ${fmt(productive.cost).padStart(8)} (${pct2(productive.cost)}%) - ${productive.sessions} sessions shipped to main`,
    `Reverted:    ${fmt(reverted.cost).padStart(8)} (${pct2(reverted.cost)}%) - ${reverted.sessions} sessions were reverted`,
    `Abandoned:   ${fmt(abandoned.cost).padStart(8)} (${pct2(abandoned.cost)}%) - ${abandoned.sessions} sessions never committed`,
    "",
    `Total:       ${fmt(total.cost).padStart(8)}     - ${total.sessions} sessions`,
    ""
  ];
  return lines.join("\n");
}
var SAFE_REF_PATTERN;
var init_yield = __esm({
  "src/yield.ts"() {
    "use strict";
    init_parser();
    SAFE_REF_PATTERN = /^[A-Za-z0-9._/\-]+$/;
  }
});

// src/main.ts
import { homedir as homedir37 } from "os";
import { Command } from "commander";

// src/menubar-installer.ts
import { spawn } from "child_process";
import { createHash } from "crypto";
import { createWriteStream } from "fs";
import { chmod, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "fs/promises";
import { homedir, platform, tmpdir } from "os";
import { join as join2 } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

// src/persistent-codeburn.ts
import { constants } from "fs";
import { access } from "fs/promises";
import { delimiter, join } from "path";
var PERSISTENT_CLI_REQUIRED_MESSAGE = "CodeBurn needs a persistent codeburn command. Install CodeBurn globally first: npm install -g codeburn";
var DEFAULT_CLI_LOOKUP_PATHS = process.platform === "win32" ? [] : ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
function buildPersistentCodeburnLookupPath(existingPath = process.env.PATH ?? "") {
  const parts = existingPath.split(delimiter).filter(Boolean);
  for (const fallback of DEFAULT_CLI_LOOKUP_PATHS) {
    if (!parts.includes(fallback)) parts.push(fallback);
  }
  return parts.join(delimiter);
}
function isTransientNpxPath(path) {
  return path.includes("/_npx/") || path.includes("/.npm/_npx/") || path.includes("\\_npx\\");
}
function codeburnExecutableNames() {
  if (process.platform !== "win32") return ["codeburn"];
  return ["codeburn.cmd", "codeburn.exe", "codeburn.bat", "codeburn"];
}
async function executableExists(path) {
  try {
    await access(path, process.platform === "win32" ? constants.F_OK : constants.F_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
async function resolvePersistentCodeburnPathFromPath(lookupPath, message = PERSISTENT_CLI_REQUIRED_MESSAGE) {
  const seen = /* @__PURE__ */ new Set();
  for (const dir of lookupPath.split(delimiter).filter(Boolean)) {
    for (const executable of codeburnExecutableNames()) {
      const candidate = join(dir, executable);
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      if (isTransientNpxPath(candidate)) continue;
      if (await executableExists(candidate)) return candidate;
    }
  }
  throw new Error(message);
}
function resolvePersistentCodeburnPathFromWhichOutput(output, message = PERSISTENT_CLI_REQUIRED_MESSAGE) {
  const paths = output.split(/\r?\n/).map((path) => path.trim()).filter(Boolean);
  const persistentPath = paths.find((path) => path.startsWith("/") && !isTransientNpxPath(path));
  if (persistentPath) return persistentPath;
  throw new Error(message);
}

// src/menubar-installer.ts
var RELEASE_API = "https://api.github.com/repos/Findigs/codeburn/releases?per_page=20";
var APP_BUNDLE_NAME = "CodeBurnMenubar.app";
var EXPECTED_BUNDLE_ID = "org.agentseal.codeburn-menubar";
var VERSIONED_ASSET_PATTERN = /^CodeBurnMenubar-v.+\.zip$/;
var APP_PROCESS_NAME = "CodeBurnMenubar";
var SUPPORTED_OS = "darwin";
var MIN_MACOS_MAJOR = 14;
var PERSISTED_CLI_PATH = join2(homedir(), "Library", "Application Support", "CodeBurn", "codeburn-cli-path.v1");
var PERSISTENT_CLI_REQUIRED_MESSAGE2 = "The menubar app needs a persistent codeburn command. Install CodeBurn globally first: npm install -g codeburn";
function resolveMenubarReleaseAssets(release) {
  const zip = release.assets.find((a) => VERSIONED_ASSET_PATTERN.test(a.name));
  if (!zip) {
    throw new Error(
      `No ${APP_BUNDLE_NAME} versioned zip found in release ${release.tag_name}. Check https://github.com/Findigs/codeburn/releases.`
    );
  }
  const checksum = release.assets.find((a) => a.name === `${zip.name}.sha256`);
  if (!checksum) {
    throw new Error(`Missing checksum asset ${zip.name}.sha256 in release ${release.tag_name}.`);
  }
  return { release, zip, checksum };
}
function resolveLatestMenubarReleaseAssets(releases) {
  for (const release of releases) {
    if (!release.tag_name.startsWith("mac-v")) continue;
    try {
      return resolveMenubarReleaseAssets(release);
    } catch {
      continue;
    }
  }
  throw new Error("No mac-v* release with a CodeBurnMenubar-v*.zip and checksum was found.");
}
function userApplicationsDir() {
  return join2(homedir(), "Applications");
}
async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
async function ensureSupportedPlatform() {
  if (platform() !== SUPPORTED_OS) {
    throw new Error(`The menubar app is macOS only (detected: ${platform()}).`);
  }
  const major = Number((process.env.CODEBURN_FORCE_MACOS_MAJOR ?? "") || (await sysProductVersion()).split(".")[0]);
  if (!Number.isFinite(major) || major < MIN_MACOS_MAJOR) {
    throw new Error(`macOS ${MIN_MACOS_MAJOR}+ required (detected ${major}).`);
  }
}
async function sysProductVersion() {
  return new Promise((resolve5, reject) => {
    const proc = spawn("/usr/bin/sw_vers", ["-productVersion"]);
    let out = "";
    proc.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`sw_vers exited with ${code}`));
      else resolve5(out.trim());
    });
  });
}
async function fetchLatestReleaseAssets() {
  const response = await fetch(RELEASE_API, {
    headers: {
      "User-Agent": "codeburn-menubar-installer",
      Accept: "application/vnd.github+json"
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub release lookup failed: HTTP ${response.status}`);
  }
  const body = await response.json();
  return resolveLatestMenubarReleaseAssets(body);
}
async function verifyChecksum(archivePath, checksumUrl) {
  const response = await fetch(checksumUrl, {
    headers: { "User-Agent": "codeburn-menubar-installer" },
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error(`Checksum download failed: HTTP ${response.status}`);
  }
  const text = await response.text();
  const expected = text.trim().split(/\s+/)[0].toLowerCase();
  const fileBytes = await readFile(archivePath);
  const actual2 = createHash("sha256").update(fileBytes).digest("hex");
  if (actual2 !== expected) {
    throw new Error(
      `Checksum mismatch for ${archivePath}.
  Expected: ${expected}
  Got:      ${actual2}
The download may be corrupted or tampered with.`
    );
  }
}
async function downloadToFile(url, destPath) {
  const response = await fetch(url, {
    headers: { "User-Agent": "codeburn-menubar-installer" },
    redirect: "follow"
  });
  if (!response.ok || response.body === null) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }
  const nodeStream = Readable.fromWeb(response.body);
  await pipeline(nodeStream, createWriteStream(destPath));
}
async function runCommand(command, args) {
  return new Promise((resolve5, reject) => {
    const proc = spawn(command, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve5();
      else reject(new Error(`${command} exited with status ${code}`));
    });
  });
}
async function captureCommand(command, args) {
  return new Promise((resolve5, reject) => {
    const proc = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    proc.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve5(out.trim());
      else reject(new Error(`${command} exited with status ${code}${err ? `: ${err.trim()}` : ""}`));
    });
  });
}
async function verifyBundleIdentity(appPath) {
  const bundleID = await captureCommand("/usr/libexec/PlistBuddy", [
    "-c",
    "Print :CFBundleIdentifier",
    join2(appPath, "Contents", "Info.plist")
  ]);
  if (bundleID !== EXPECTED_BUNDLE_ID) {
    throw new Error(`Unexpected menubar bundle id ${bundleID}; expected ${EXPECTED_BUNDLE_ID}.`);
  }
  await runCommand("/usr/bin/codesign", ["--verify", "--deep", "--strict", appPath]);
}
async function resolvePersistentCodeburnPath() {
  let output = "";
  try {
    output = await captureCommand("/usr/bin/env", [
      `PATH=${buildPersistentCodeburnLookupPath()}`,
      "which",
      "-a",
      "codeburn"
    ]);
  } catch {
    throw new Error(PERSISTENT_CLI_REQUIRED_MESSAGE2);
  }
  return resolvePersistentCodeburnPathFromWhichOutput(output, PERSISTENT_CLI_REQUIRED_MESSAGE2);
}
async function persistCodeburnPath() {
  const cliPath = await resolvePersistentCodeburnPath();
  await mkdir(join2(homedir(), "Library", "Application Support", "CodeBurn"), { recursive: true, mode: 448 });
  await writeFile(PERSISTED_CLI_PATH, `${cliPath}
`, { mode: 384 });
  await chmod(PERSISTED_CLI_PATH, 384);
}
async function isAppRunning() {
  return new Promise((resolve5) => {
    const proc = spawn("/usr/bin/pgrep", ["-f", APP_PROCESS_NAME]);
    proc.on("close", (code) => resolve5(code === 0));
    proc.on("error", () => resolve5(false));
  });
}
async function killRunningApp() {
  await new Promise((resolve5) => {
    const proc = spawn("/usr/bin/pkill", ["-f", APP_PROCESS_NAME]);
    proc.on("close", () => resolve5());
    proc.on("error", () => resolve5());
  });
  for (let i = 0; i < 10; i++) {
    if (!await isAppRunning()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
}
async function installMenubarApp(options = {}) {
  await ensureSupportedPlatform();
  await persistCodeburnPath();
  const appsDir = userApplicationsDir();
  const targetPath = join2(appsDir, APP_BUNDLE_NAME);
  const alreadyInstalled = await exists(targetPath);
  if (alreadyInstalled && !options.force) {
    if (!await isAppRunning()) {
      await runCommand("/usr/bin/open", [targetPath]);
    }
    return { installedPath: targetPath, launched: true };
  }
  console.log("Looking up the latest CodeBurn Menubar release...");
  const { zip, checksum } = await fetchLatestReleaseAssets();
  const stagingDir = await mkdtemp(join2(tmpdir(), "codeburn-menubar-"));
  try {
    const archivePath = join2(stagingDir, zip.name);
    console.log(`Downloading ${zip.name}...`);
    await downloadToFile(zip.browser_download_url, archivePath);
    console.log("Verifying checksum...");
    await verifyChecksum(archivePath, checksum.browser_download_url);
    console.log("Unpacking...");
    await runCommand("/usr/bin/ditto", ["-x", "-k", archivePath, stagingDir]);
    const unpackedApp = join2(stagingDir, APP_BUNDLE_NAME);
    if (!await exists(unpackedApp)) {
      throw new Error(`Archive did not contain ${APP_BUNDLE_NAME}.`);
    }
    console.log("Verifying app bundle...");
    await verifyBundleIdentity(unpackedApp);
    await runCommand("/usr/bin/xattr", ["-dr", "com.apple.quarantine", unpackedApp]).catch(() => {
    });
    await mkdir(appsDir, { recursive: true });
    if (alreadyInstalled) {
      await killRunningApp();
      await rm(targetPath, { recursive: true, force: true });
    }
    await rename(unpackedApp, targetPath);
    console.log("Launching CodeBurn Menubar...");
    await runCommand("/usr/bin/open", [targetPath]);
    return { installedPath: targetPath, launched: true };
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}

// src/export.ts
init_types();
init_currency();
import { writeFile as writeFile5, mkdir as mkdir5, readdir, open, stat as stat2, rm as rm2 } from "fs/promises";
import { dirname, join as join6, resolve } from "path";

// src/day-aggregator.ts
init_types();
function emptyEntry(date) {
  return {
    date,
    cost: 0,
    calls: 0,
    sessions: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    editTurns: 0,
    oneShotTurns: 0,
    models: {},
    categories: {},
    providers: {}
  };
}
function dateKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function aggregateProjectsIntoDays(projects) {
  const byDate = /* @__PURE__ */ new Map();
  const ensure = (date) => {
    let d = byDate.get(date);
    if (!d) {
      d = emptyEntry(date);
      byDate.set(date, d);
    }
    return d;
  };
  for (const project of projects) {
    for (const session of project.sessions) {
      const sessionDate = dateKey(session.firstTimestamp);
      ensure(sessionDate).sessions += 1;
      for (const turn of session.turns) {
        if (turn.assistantCalls.length === 0) continue;
        const turnDate = dateKey(turn.assistantCalls[0].timestamp);
        const turnDay = ensure(turnDate);
        const editTurns = turn.hasEdits ? 1 : 0;
        const oneShotTurns = turn.hasEdits && turn.retries === 0 ? 1 : 0;
        const turnCost = turn.assistantCalls.reduce((s, c) => s + c.costUSD, 0);
        turnDay.editTurns += editTurns;
        turnDay.oneShotTurns += oneShotTurns;
        const cat = turnDay.categories[turn.category] ?? { turns: 0, cost: 0, editTurns: 0, oneShotTurns: 0 };
        cat.turns += 1;
        cat.cost += turnCost;
        cat.editTurns += editTurns;
        cat.oneShotTurns += oneShotTurns;
        turnDay.categories[turn.category] = cat;
        for (const call of turn.assistantCalls) {
          const callDate = dateKey(call.timestamp);
          const callDay = ensure(callDate);
          callDay.cost += call.costUSD;
          callDay.calls += 1;
          callDay.inputTokens += call.usage.inputTokens;
          callDay.outputTokens += call.usage.outputTokens;
          callDay.cacheReadTokens += call.usage.cacheReadInputTokens;
          callDay.cacheWriteTokens += call.usage.cacheCreationInputTokens;
          const model = callDay.models[call.model] ?? {
            calls: 0,
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0
          };
          model.calls += 1;
          model.cost += call.costUSD;
          model.inputTokens += call.usage.inputTokens;
          model.outputTokens += call.usage.outputTokens;
          model.cacheReadTokens += call.usage.cacheReadInputTokens;
          model.cacheWriteTokens += call.usage.cacheCreationInputTokens;
          callDay.models[call.model] = model;
          const provider = callDay.providers[call.provider] ?? { calls: 0, cost: 0 };
          provider.calls += 1;
          provider.cost += call.costUSD;
          callDay.providers[call.provider] = provider;
        }
      }
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}
function buildPeriodDataFromDays(days, label) {
  let cost = 0, calls = 0, sessions = 0;
  let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0;
  const catTotals = {};
  const modelTotals = {};
  for (const d of days) {
    cost += d.cost;
    calls += d.calls;
    sessions += d.sessions;
    inputTokens += d.inputTokens;
    outputTokens += d.outputTokens;
    cacheReadTokens += d.cacheReadTokens;
    cacheWriteTokens += d.cacheWriteTokens;
    for (const [name, m] of Object.entries(d.models)) {
      const acc = modelTotals[name] ?? { calls: 0, cost: 0 };
      acc.calls += m.calls;
      acc.cost += m.cost;
      modelTotals[name] = acc;
    }
    for (const [cat, c] of Object.entries(d.categories)) {
      const acc = catTotals[cat] ?? { turns: 0, cost: 0, editTurns: 0, oneShotTurns: 0 };
      acc.turns += c.turns;
      acc.cost += c.cost;
      acc.editTurns += c.editTurns;
      acc.oneShotTurns += c.oneShotTurns;
      catTotals[cat] = acc;
    }
  }
  return {
    label,
    cost,
    calls,
    sessions,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    categories: Object.entries(catTotals).sort(([, a], [, b]) => b.cost - a.cost).map(([cat, d]) => ({ name: CATEGORY_LABELS[cat] ?? cat, ...d })),
    models: Object.entries(modelTotals).sort(([, a], [, b]) => b.cost - a.cost).map(([name, d]) => ({ name, ...d }))
  };
}

// src/model-efficiency.ts
init_models();
function rate(num, den) {
  if (den === 0) return null;
  return Math.round(num / den * 1e3) / 10;
}
function aggregateModelEfficiency(projects) {
  const byModel = /* @__PURE__ */ new Map();
  function ensure(model) {
    let stats = byModel.get(model);
    if (!stats) {
      stats = { model, editTurns: 0, oneShotTurns: 0, retries: 0, editCostUSD: 0 };
      byModel.set(model, stats);
    }
    return stats;
  }
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (!turn.hasEdits || turn.assistantCalls.length === 0) continue;
        const primaryCall = turn.assistantCalls.find((c) => getShortModelName(c.model) !== "<synthetic>");
        if (!primaryCall) continue;
        const primaryModel = getShortModelName(primaryCall.model);
        const stats = ensure(primaryModel);
        stats.editTurns++;
        if (turn.retries === 0) stats.oneShotTurns++;
        stats.retries += turn.retries;
        stats.editCostUSD += turn.assistantCalls.reduce((sum, call) => {
          return getShortModelName(call.model) === "<synthetic>" ? sum : sum + call.costUSD;
        }, 0);
      }
    }
  }
  return new Map([...byModel.entries()].map(([model, stats]) => [model, {
    ...stats,
    oneShotRate: rate(stats.oneShotTurns, stats.editTurns),
    retriesPerEdit: stats.editTurns > 0 ? Math.round(stats.retries / stats.editTurns * 10) / 10 : null,
    costPerEditUSD: stats.editTurns > 0 ? stats.editCostUSD / stats.editTurns : null
  }]));
}

// src/export.ts
function escCsv(s) {
  const sanitized = /^[\t\r=+\-@]/.test(s) ? `'${s}` : s;
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}
function rowsToCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escCsv(String(row[h] ?? ""))).join(","));
  }
  return lines.join("\n") + "\n";
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function pct(n, total) {
  return total > 0 ? round2(n / total * 100) : 0;
}
function buildDailyRows(projects, period) {
  const daily = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (!turn.timestamp) continue;
        const day = dateKey(turn.timestamp);
        if (!daily[day]) {
          daily[day] = { cost: 0, calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, sessions: /* @__PURE__ */ new Set() };
        }
        daily[day].sessions.add(session.sessionId);
        for (const call of turn.assistantCalls) {
          daily[day].cost += call.costUSD;
          daily[day].calls++;
          daily[day].input += call.usage.inputTokens;
          daily[day].output += call.usage.outputTokens;
          daily[day].cacheRead += call.usage.cacheReadInputTokens;
          daily[day].cacheWrite += call.usage.cacheCreationInputTokens;
        }
      }
    }
  }
  const { code } = getCurrency();
  return Object.entries(daily).sort().map(([date, d]) => ({
    Period: period,
    Date: date,
    [`Cost (${code})`]: roundForActiveCurrency(convertCost(d.cost)),
    "API Calls": d.calls,
    Sessions: d.sessions.size,
    "Input Tokens": d.input,
    "Output Tokens": d.output,
    "Cache Read Tokens": d.cacheRead,
    "Cache Write Tokens": d.cacheWrite
  }));
}
function buildActivityRows(projects, period) {
  const catTotals = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [cat, d] of Object.entries(session.categoryBreakdown)) {
        if (!catTotals[cat]) catTotals[cat] = { turns: 0, cost: 0 };
        catTotals[cat].turns += d.turns;
        catTotals[cat].cost += d.costUSD;
      }
    }
  }
  const totalCost = Object.values(catTotals).reduce((s, d) => s + d.cost, 0);
  const { code } = getCurrency();
  return Object.entries(catTotals).sort(([, a], [, b]) => b.cost - a.cost).map(([cat, d]) => ({
    Period: period,
    Activity: CATEGORY_LABELS[cat] ?? cat,
    [`Cost (${code})`]: roundForActiveCurrency(convertCost(d.cost)),
    "Share (%)": pct(d.cost, totalCost),
    Turns: d.turns
  }));
}
function buildModelRows(projects, period) {
  const modelTotals = {};
  const modelEfficiency = aggregateModelEfficiency(projects);
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [model, d] of Object.entries(session.modelBreakdown)) {
        if (!modelTotals[model]) modelTotals[model] = { calls: 0, cost: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
        modelTotals[model].calls += d.calls;
        modelTotals[model].cost += d.costUSD;
        modelTotals[model].input += d.tokens.inputTokens;
        modelTotals[model].output += d.tokens.outputTokens;
        modelTotals[model].cacheRead += d.tokens.cacheReadInputTokens ?? 0;
        modelTotals[model].cacheWrite += d.tokens.cacheCreationInputTokens ?? 0;
      }
    }
  }
  const totalCost = Object.values(modelTotals).reduce((s, d) => s + d.cost, 0);
  const { code } = getCurrency();
  return Object.entries(modelTotals).filter(([name]) => name !== "<synthetic>").sort(([, a], [, b]) => b.cost - a.cost).map(([model, d]) => {
    const efficiency = modelEfficiency.get(model);
    return {
      Period: period,
      Model: model,
      [`Cost (${code})`]: roundForActiveCurrency(convertCost(d.cost)),
      "Share (%)": pct(d.cost, totalCost),
      "API Calls": d.calls,
      "Edit Turns": efficiency?.editTurns ?? 0,
      "One-shot Rate (%)": efficiency?.oneShotRate ?? "",
      "Retries/Edit": efficiency?.retriesPerEdit ?? "",
      [`Cost/Edit (${code})`]: efficiency?.costPerEditUSD !== null && efficiency?.costPerEditUSD !== void 0 ? roundForActiveCurrency(convertCost(efficiency.costPerEditUSD)) : "",
      "Input Tokens": d.input,
      "Output Tokens": d.output,
      "Cache Read Tokens": d.cacheRead,
      "Cache Write Tokens": d.cacheWrite
    };
  });
}
function buildToolRows(projects) {
  const toolTotals = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [tool, d] of Object.entries(session.toolBreakdown)) {
        toolTotals[tool] = (toolTotals[tool] ?? 0) + d.calls;
      }
    }
  }
  const total = Object.values(toolTotals).reduce((s, n) => s + n, 0);
  return Object.entries(toolTotals).sort(([, a], [, b]) => b - a).map(([tool, calls]) => ({
    Tool: tool,
    Calls: calls,
    "Share (%)": pct(calls, total)
  }));
}
function buildBashRows(projects) {
  const bashTotals = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [cmd, d] of Object.entries(session.bashBreakdown)) {
        bashTotals[cmd] = (bashTotals[cmd] ?? 0) + d.calls;
      }
    }
  }
  const total = Object.values(bashTotals).reduce((s, n) => s + n, 0);
  return Object.entries(bashTotals).sort(([, a], [, b]) => b - a).map(([cmd, calls]) => ({
    Command: cmd,
    Calls: calls,
    "Share (%)": pct(calls, total)
  }));
}
function buildProjectRows(projects) {
  const { code } = getCurrency();
  const total = projects.reduce((s, p) => s + p.totalCostUSD, 0);
  return projects.slice().sort((a, b) => b.totalCostUSD - a.totalCostUSD).map((p) => ({
    Project: p.projectPath,
    [`Cost (${code})`]: roundForActiveCurrency(convertCost(p.totalCostUSD)),
    [`Avg/Session (${code})`]: p.sessions.length > 0 ? roundForActiveCurrency(convertCost(p.totalCostUSD / p.sessions.length)) : "",
    "Share (%)": pct(p.totalCostUSD, total),
    "API Calls": p.totalApiCalls,
    Sessions: p.sessions.length
  }));
}
function buildSessionRows(projects) {
  const { code } = getCurrency();
  const rows = [];
  for (const p of projects) {
    for (const s of p.sessions) {
      rows.push({
        Project: p.projectPath,
        "Session ID": s.sessionId,
        "Started At": s.firstTimestamp ?? "",
        [`Cost (${code})`]: roundForActiveCurrency(convertCost(s.totalCostUSD)),
        "API Calls": s.apiCalls,
        Turns: s.turns.length
      });
    }
  }
  return rows.sort((a, b) => b[`Cost (${code})`] - a[`Cost (${code})`]);
}
function buildSummaryRows(periods) {
  const { code } = getCurrency();
  return periods.map((p) => {
    const cost = p.projects.reduce((s, proj) => s + proj.totalCostUSD, 0);
    const calls = p.projects.reduce((s, proj) => s + proj.totalApiCalls, 0);
    const sessions = p.projects.reduce((s, proj) => s + proj.sessions.length, 0);
    const projectCount = p.projects.filter((proj) => proj.totalCostUSD > 0).length;
    return {
      Period: p.label,
      [`Cost (${code})`]: roundForActiveCurrency(convertCost(cost)),
      "API Calls": calls,
      Sessions: sessions,
      Projects: projectCount
    };
  });
}
function buildReadme(periods) {
  const { code } = getCurrency();
  const generated = (/* @__PURE__ */ new Date()).toISOString();
  const lines = [
    "CodeBurn Usage Export",
    "====================",
    "",
    `Generated: ${generated}`,
    `Currency:  ${code}`,
    `Periods:   ${periods.map((p) => p.label).join(", ")}`,
    "",
    "Files",
    "-----",
    "  summary.csv           One row per period. Headline totals.",
    "  daily.csv             Day-by-day breakdown, Period column distinguishes the window.",
    "  activity.csv          Time spent per task category (Coding, Debugging, Exploration, etc.).",
    "  models.csv            Spend per model with token totals and cache usage.",
    "  projects.csv          Spend per project folder for the selected detail period.",
    "  sessions.csv          One row per session for the selected detail period.",
    "  tools.csv             Tool invocations and share for the selected detail period.",
    "  shell-commands.csv    Shell commands executed via Bash tool for the selected detail period.",
    "",
    "Notes",
    "-----",
    "  Every cost column is already converted to the active currency. Tokens are raw integer",
    "  counts from provider telemetry. Share (%) is relative to the period/table total.",
    ""
  ];
  return lines.join("\n");
}
var EXPORT_MARKER_FILE = ".codeburn-export";
async function isCodeburnExportFolder(path) {
  const markerStat = await stat2(join6(path, EXPORT_MARKER_FILE)).catch(() => null);
  return markerStat?.isFile() ?? false;
}
async function clearCodeburnExportFolder(path) {
  const entries = await readdir(path);
  for (const entry of entries) {
    await rm2(join6(path, entry), { recursive: true, force: true });
  }
}
async function exportCsv(periods, outputPath) {
  const thirtyDays = periods.find((p) => p.label === "30 Days");
  const thirtyDayProjects = thirtyDays?.projects ?? periods[periods.length - 1]?.projects ?? [];
  let folder = resolve(outputPath);
  if (folder.toLowerCase().endsWith(".csv")) {
    folder = folder.slice(0, -4);
  }
  const existingStat = await stat2(folder).catch(() => null);
  if (existingStat?.isFile()) {
    throw new Error(`Refusing to overwrite existing file at ${folder}. Pass a directory path instead.`);
  }
  if (existingStat?.isDirectory()) {
    if (!await isCodeburnExportFolder(folder)) {
      throw new Error(
        `Refusing to reuse non-empty directory ${folder}: no ${EXPORT_MARKER_FILE} marker. Delete it manually or pick a different -o path.`
      );
    }
    await clearCodeburnExportFolder(folder);
  }
  await mkdir5(folder, { recursive: true });
  await writeFile5(join6(folder, EXPORT_MARKER_FILE), "", "utf-8");
  const dailyRows = periods.flatMap((p) => buildDailyRows(p.projects, p.label));
  const activityRows = periods.flatMap((p) => buildActivityRows(p.projects, p.label));
  const modelRows = periods.flatMap((p) => buildModelRows(p.projects, p.label));
  await writeFile5(join6(folder, "README.txt"), buildReadme(periods), "utf-8");
  await writeFile5(join6(folder, "summary.csv"), rowsToCsv(buildSummaryRows(periods)), "utf-8");
  await writeFile5(join6(folder, "daily.csv"), rowsToCsv(dailyRows), "utf-8");
  await writeFile5(join6(folder, "activity.csv"), rowsToCsv(activityRows), "utf-8");
  await writeFile5(join6(folder, "models.csv"), rowsToCsv(modelRows), "utf-8");
  await writeFile5(join6(folder, "projects.csv"), rowsToCsv(buildProjectRows(thirtyDayProjects)), "utf-8");
  await writeFile5(join6(folder, "sessions.csv"), rowsToCsv(buildSessionRows(thirtyDayProjects)), "utf-8");
  await writeFile5(join6(folder, "tools.csv"), rowsToCsv(buildToolRows(thirtyDayProjects)), "utf-8");
  await writeFile5(join6(folder, "shell-commands.csv"), rowsToCsv(buildBashRows(thirtyDayProjects)), "utf-8");
  return folder;
}
async function exportJson(periods, outputPath) {
  const thirtyDays = periods.find((p) => p.label === "30 Days");
  const thirtyDayProjects = thirtyDays?.projects ?? periods[periods.length - 1]?.projects ?? [];
  const { code, rate: rate2, symbol } = getCurrency();
  const data = {
    schema: "codeburn.export.v2",
    generated: (/* @__PURE__ */ new Date()).toISOString(),
    currency: { code, rate: rate2, symbol },
    summary: buildSummaryRows(periods),
    periods: periods.map((p) => ({
      label: p.label,
      daily: buildDailyRows(p.projects, p.label),
      activity: buildActivityRows(p.projects, p.label),
      models: buildModelRows(p.projects, p.label)
    })),
    projects: buildProjectRows(thirtyDayProjects),
    sessions: buildSessionRows(thirtyDayProjects),
    tools: buildToolRows(thirtyDayProjects),
    shellCommands: buildBashRows(thirtyDayProjects)
  };
  const target = resolve(outputPath.toLowerCase().endsWith(".json") ? outputPath : `${outputPath}.json`);
  const existing = await stat2(target).catch(() => null);
  if (existing?.isFile()) {
    const fh = await open(target, "r");
    try {
      const buf = Buffer.alloc(4096);
      const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
      const head = buf.toString("utf-8", 0, bytesRead);
      if (!head.includes('"schema": "codeburn.export.v')) {
        throw new Error(
          `Refusing to overwrite ${target}: file does not look like a codeburn export. Delete it manually or pick a different -o path.`
        );
      }
    } finally {
      await fh.close();
    }
  }
  if (existing?.isDirectory()) {
    throw new Error(`Refusing to overwrite directory at ${target}. Pass a file path instead.`);
  }
  await mkdir5(dirname(target), { recursive: true });
  await writeFile5(target, JSON.stringify(data, null, 2), "utf-8");
  return target;
}

// src/main.ts
init_models();
init_parser();
init_currency();
init_format();

// src/menubar-json.ts
var TOP_ACTIVITIES_LIMIT = 20;
var TOP_MODELS_LIMIT = 20;
var TOP_FINDINGS_LIMIT = 10;
var HISTORY_DAYS_LIMIT = 365;
var SYNTHETIC_MODEL_NAME = "<synthetic>";
var TOP_PROJECTS_LIMIT = 5;
var TOP_SESSIONS_LIMIT = 3;
var MODEL_EFFICIENCY_LIMIT = 5;
function oneShotRateFor(editTurns, oneShotTurns) {
  if (editTurns === 0) return null;
  return oneShotTurns / editTurns;
}
function aggregateOneShotRate(categories) {
  let edits = 0;
  let oneShots = 0;
  for (const cat of categories) {
    edits += cat.editTurns;
    oneShots += cat.oneShotTurns;
  }
  if (edits === 0) return null;
  return oneShots / edits;
}
function cacheHitPercent(inputTokens, cacheReadTokens) {
  const denom = inputTokens + cacheReadTokens;
  if (denom === 0) return 0;
  return cacheReadTokens / denom * 100;
}
function buildTopActivities(categories) {
  return categories.slice(0, TOP_ACTIVITIES_LIMIT).map((cat) => ({
    name: cat.name,
    cost: cat.cost,
    turns: cat.turns,
    oneShotRate: oneShotRateFor(cat.editTurns, cat.oneShotTurns)
  }));
}
function buildTopModels(models) {
  return models.filter((m) => m.name !== SYNTHETIC_MODEL_NAME).slice(0, TOP_MODELS_LIMIT).map((m) => ({ name: m.name, cost: m.cost, calls: m.calls }));
}
function buildOptimize(optimize) {
  if (!optimize || optimize.findings.length === 0) {
    return { findingCount: 0, savingsUSD: 0, topFindings: [] };
  }
  const { findings, costRate } = optimize;
  const totalSavingsUSD = findings.reduce((s, f) => s + f.tokensSaved * costRate, 0);
  const topFindings = findings.slice(0, TOP_FINDINGS_LIMIT).map((f) => ({
    title: f.title,
    impact: f.impact,
    savingsUSD: f.tokensSaved * costRate
  }));
  return {
    findingCount: findings.length,
    savingsUSD: totalSavingsUSD,
    topFindings
  };
}
function buildProviders(providers) {
  const map = {};
  for (const p of providers) {
    if (p.cost < 0) continue;
    map[p.name.toLowerCase()] = p.cost;
  }
  return map;
}
function buildHistory(daily) {
  if (!daily || daily.length === 0) return { daily: [] };
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  const trimmed = sorted.slice(-HISTORY_DAYS_LIMIT);
  return { daily: trimmed };
}
function buildTopProjects(projects) {
  return (projects ?? []).filter((p) => p.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, TOP_PROJECTS_LIMIT).map((p) => ({
    name: p.name,
    cost: p.cost,
    sessions: p.sessions,
    avgCostPerSession: p.sessions > 0 ? p.cost / p.sessions : 0,
    sessionDetails: (p.sessionDetails ?? []).map((s) => ({
      cost: s.cost,
      calls: s.calls,
      inputTokens: s.inputTokens,
      outputTokens: s.outputTokens,
      date: s.date,
      models: s.models
    }))
  }));
}
function buildModelEfficiency(models) {
  return (models ?? []).filter((m) => m.costPerEdit !== null).sort((a, b) => (a.costPerEdit ?? Infinity) - (b.costPerEdit ?? Infinity)).slice(0, MODEL_EFFICIENCY_LIMIT).map((m) => ({ name: m.name, costPerEdit: m.costPerEdit, oneShotRate: m.oneShotRate }));
}
function buildTopSessions(sessions) {
  return (sessions ?? []).sort((a, b) => b.cost - a.cost).slice(0, TOP_SESSIONS_LIMIT).map((s) => ({ project: s.project, cost: s.cost, calls: s.calls, date: s.date }));
}
function buildMenubarPayload(current, providers, optimize, dailyHistory, retryTax, routingWaste, breakdowns) {
  return {
    generated: (/* @__PURE__ */ new Date()).toISOString(),
    current: {
      label: current.label,
      cost: current.cost,
      calls: current.calls,
      sessions: current.sessions,
      oneShotRate: aggregateOneShotRate(current.categories),
      inputTokens: current.inputTokens,
      outputTokens: current.outputTokens,
      cacheHitPercent: cacheHitPercent(current.inputTokens, current.cacheReadTokens),
      topActivities: buildTopActivities(current.categories),
      topModels: buildTopModels(current.models),
      providers: buildProviders(providers),
      topProjects: buildTopProjects(current.projects ?? []),
      modelEfficiency: buildModelEfficiency(current.modelEfficiency ?? []),
      topSessions: buildTopSessions(current.topSessions ?? []),
      retryTax: retryTax ?? { totalUSD: 0, retries: 0, editTurns: 0, byModel: [] },
      routingWaste: routingWaste ?? { totalSavingsUSD: 0, baselineModel: "", baselineCostPerEdit: 0, byModel: [] },
      tools: breakdowns?.tools ?? [],
      skills: breakdowns?.skills ?? [],
      subagents: breakdowns?.subagents ?? [],
      mcpServers: breakdowns?.mcpServers ?? []
    },
    optimize: buildOptimize(optimize),
    history: buildHistory(dailyHistory)
  };
}

// src/daily-cache.ts
import { randomBytes as randomBytes6 } from "crypto";
import { existsSync as existsSync7 } from "fs";
import { mkdir as mkdir10, open as open6, readFile as readFile21, rename as rename7, unlink as unlink5 } from "fs/promises";
import { homedir as homedir32 } from "os";
import { join as join36 } from "path";
var DAILY_CACHE_VERSION = 7;
var MIN_SUPPORTED_VERSION = 7;
var DAILY_CACHE_FILENAME = "daily-cache.json";
function getCacheDir7() {
  return process.env["CODEBURN_CACHE_DIR"] ?? join36(homedir32(), ".cache", "codeburn");
}
function getCachePath6() {
  return join36(getCacheDir7(), DAILY_CACHE_FILENAME);
}
function emptyCache2() {
  return { version: DAILY_CACHE_VERSION, lastComputedDate: null, days: [] };
}
function isMigratableCache(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  const c = parsed;
  if (typeof c.version !== "number") return false;
  if (!Array.isArray(c.days)) return false;
  return c.version >= MIN_SUPPORTED_VERSION && c.version <= DAILY_CACHE_VERSION;
}
function migrateDays(days) {
  return days.map((d) => ({
    date: d.date,
    cost: d.cost ?? 0,
    calls: d.calls ?? 0,
    sessions: d.sessions ?? 0,
    inputTokens: d.inputTokens ?? 0,
    outputTokens: d.outputTokens ?? 0,
    cacheReadTokens: d.cacheReadTokens ?? 0,
    cacheWriteTokens: d.cacheWriteTokens ?? 0,
    editTurns: d.editTurns ?? 0,
    oneShotTurns: d.oneShotTurns ?? 0,
    models: d.models ?? {},
    categories: d.categories ?? {},
    providers: d.providers ?? {}
  }));
}
async function backupOldCache(path, version2) {
  const backupPath = `${path}.v${version2}.bak`;
  try {
    await rename7(path, backupPath);
  } catch {
  }
}
async function loadDailyCache() {
  const path = getCachePath6();
  if (!existsSync7(path)) return emptyCache2();
  try {
    const raw = await readFile21(path, "utf-8");
    const parsed = JSON.parse(raw);
    if (isMigratableCache(parsed)) {
      const migrated = {
        version: DAILY_CACHE_VERSION,
        lastComputedDate: parsed.lastComputedDate,
        days: migrateDays(parsed.days)
      };
      if (parsed.version < DAILY_CACHE_VERSION) {
        await saveDailyCache(migrated).catch(() => {
        });
      }
      return migrated;
    }
    const oldVersion = parsed?.version;
    if (typeof oldVersion === "number") await backupOldCache(path, oldVersion);
    return emptyCache2();
  } catch {
    return emptyCache2();
  }
}
async function saveDailyCache(cache) {
  const dir = getCacheDir7();
  if (!existsSync7(dir)) await mkdir10(dir, { recursive: true });
  const finalPath = getCachePath6();
  const tempPath = `${finalPath}.${randomBytes6(8).toString("hex")}.tmp`;
  const payload = JSON.stringify(cache);
  const handle = await open6(tempPath, "w", 384);
  try {
    await handle.writeFile(payload, { encoding: "utf-8" });
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename7(tempPath, finalPath);
  } catch (err) {
    try {
      await unlink5(tempPath);
    } catch {
    }
    throw err;
  }
}
function addNewDays(cache, incoming, newestDate) {
  const byDate = new Map(cache.days.map((d) => [d.date, d]));
  for (const day of incoming) {
    byDate.set(day.date, day);
  }
  const merged = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  const cutoffDate = /* @__PURE__ */ new Date(`${newestDate}T00:00:00Z`);
  let pruned = merged;
  if (!isNaN(cutoffDate.getTime())) {
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - DAILY_CACHE_RETENTION_DAYS);
    const cutoff = toDateString(cutoffDate);
    pruned = merged.filter((d) => d.date >= cutoff);
  }
  const nextLast = cache.lastComputedDate && cache.lastComputedDate > newestDate ? cache.lastComputedDate : newestDate;
  return { version: DAILY_CACHE_VERSION, lastComputedDate: nextLast, days: pruned };
}
function getDaysInRange(cache, start, end) {
  return cache.days.filter((d) => d.date >= start && d.date <= end);
}
var lockChain = Promise.resolve();
function withDailyCacheLock(fn) {
  const next = lockChain.then(() => fn());
  lockChain = next.catch(() => void 0);
  return next;
}
var MS_PER_DAY = 24 * 60 * 60 * 1e3;
var BACKFILL_DAYS = 365;
var DAILY_CACHE_RETENTION_DAYS = 730;
function toDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
async function ensureCacheHydrated(parseSessions, aggregateDays) {
  const now = /* @__PURE__ */ new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayEnd = new Date(todayStart.getTime() - 1);
  const yesterdayStr = toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  return withDailyCacheLock(async () => {
    let c = await loadDailyCache();
    const hadYesterday = c.days.some((d) => d.date >= yesterdayStr);
    if (hadYesterday) {
      const freshDays = c.days.filter((d) => d.date < yesterdayStr);
      const latestFresh = freshDays.length > 0 ? freshDays[freshDays.length - 1].date : null;
      c = { ...c, days: freshDays, lastComputedDate: latestFresh };
    }
    const gapStart = c.lastComputedDate ? new Date(
      parseInt(c.lastComputedDate.slice(0, 4)),
      parseInt(c.lastComputedDate.slice(5, 7)) - 1,
      parseInt(c.lastComputedDate.slice(8, 10)) + 1
    ) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - BACKFILL_DAYS);
    if (gapStart.getTime() <= yesterdayEnd.getTime()) {
      const gapRange = { start: gapStart, end: yesterdayEnd };
      const gapProjects = await parseSessions(gapRange);
      const gapDays = aggregateDays(gapProjects);
      c = addNewDays(c, gapDays, yesterdayStr);
      await saveDailyCache(c);
    }
    return c;
  });
}

// src/main.ts
init_types();

// src/dashboard.tsx
init_types();
init_format();
import { homedir as homedir35 } from "os";
import React2, { useState as useState2, useCallback, useEffect as useEffect2, useRef as useRef2 } from "react";
import { render as render2, Box as Box2, Text as Text2, useInput as useInput2, useApp as useApp2, useWindowSize } from "ink";
init_parser();
init_models();
init_providers();

// src/optimize.ts
init_fs_utils();
init_providers();
init_parser();
init_currency();
init_format();
import chalk2 from "chalk";
import { readdir as readdir20, stat as stat22 } from "fs/promises";
import { existsSync as existsSync8, statSync as statSync3 } from "fs";
import { basename as basename17, join as join37 } from "path";
import { homedir as homedir33 } from "os";
var ORANGE = "#FF8C42";
var DIM = "#666666";
var GOLD = "#FFD700";
var CYAN = "#5BF5E0";
var GREEN = "#5BF5A0";
var RED = "#F55B5B";
var AVG_TOKENS_PER_READ = 600;
var TOKENS_PER_MCP_TOOL = 400;
var TOOLS_PER_MCP_SERVER = 5;
var TOKENS_PER_AGENT_DEF = 80;
var TOKENS_PER_SKILL_DEF = 80;
var TOKENS_PER_COMMAND_DEF = 60;
var CLAUDEMD_TOKENS_PER_LINE = 13;
var BASH_TOKENS_PER_CHAR = 0.25;
var CLAUDEMD_HEALTHY_LINES = 200;
var CLAUDEMD_HIGH_THRESHOLD_LINES = 400;
var MIN_JUNK_READS_TO_FLAG = 3;
var JUNK_READS_HIGH_THRESHOLD = 20;
var JUNK_READS_MEDIUM_THRESHOLD = 5;
var MIN_DUPLICATE_READS_TO_FLAG = 5;
var DUPLICATE_READS_HIGH_THRESHOLD = 30;
var DUPLICATE_READS_MEDIUM_THRESHOLD = 10;
var MIN_EDITS_FOR_RATIO = 10;
var HEALTHY_READ_EDIT_RATIO = 4;
var LOW_RATIO_HIGH_THRESHOLD = 2;
var LOW_RATIO_MEDIUM_THRESHOLD = 3;
var MIN_API_CALLS_FOR_CACHE = 10;
var CACHE_EXCESS_HIGH_THRESHOLD = 15e3;
var UNUSED_MCP_HIGH_THRESHOLD = 3;
var MCP_COVERAGE_MIN_TOOLS = 10;
var MCP_COVERAGE_MIN_SESSIONS = 2;
var MCP_COVERAGE_LOW_THRESHOLD = 0.2;
var MCP_COVERAGE_HIGH_IMPACT_TOKENS = 2e5;
var MCP_PROFILE_MIN_PROJECTS = 3;
var MCP_PROFILE_MIN_HOT_INVOCATIONS = 2;
var MCP_PROFILE_HOT_INVOCATION_SHARE = 0.8;
var MCP_PROFILE_MIN_COLD_LOADED_SESSIONS = 2;
var MCP_PROFILE_HIGH_IMPACT_TOKENS = 2e5;
var MCP_PROFILE_PREVIEW = 3;
var CACHE_WRITE_MULTIPLIER = 1.25;
var CACHE_READ_DISCOUNT = 0.1;
var GHOST_AGENTS_HIGH_THRESHOLD = 5;
var GHOST_AGENTS_MEDIUM_THRESHOLD = 2;
var GHOST_SKILLS_HIGH_THRESHOLD = 10;
var GHOST_SKILLS_MEDIUM_THRESHOLD = 5;
var GHOST_COMMANDS_MEDIUM_THRESHOLD = 10;
var MCP_NEW_CONFIG_GRACE_MS = 24 * 60 * 60 * 1e3;
var BASH_DEFAULT_LIMIT = 3e4;
var BASH_RECOMMENDED_LIMIT = 15e3;
var MIN_SESSIONS_FOR_OUTLIER = 3;
var SESSION_OUTLIER_MULTIPLIER = 2;
var MIN_SESSION_OUTLIER_COST_USD = 1;
var SESSION_OUTLIER_PREVIEW = 5;
var CONTEXT_BLOAT_MIN_INPUT_TOKENS = 75e3;
var CONTEXT_BLOAT_MIN_RATIO = 25;
var CONTEXT_BLOAT_TARGET_RATIO = 15;
var CONTEXT_BLOAT_PREVIEW = 5;
var CONTEXT_BLOAT_LOW_INPUT_TOKENS = 2e5;
var CONTEXT_BLOAT_HIGH_INPUT_TOKENS = 5e5;
var CONTEXT_BLOAT_LOW_MAX_CANDIDATES = 2;
var CONTEXT_BLOAT_HIGH_MIN_CANDIDATES = 10;
var CONTEXT_BLOAT_GROWTH_RATIO = 2;
var CONTEXT_BLOAT_GROWTH_MAX_GAP_MS = 7 * 24 * 60 * 60 * 1e3;
var CONTEXT_BLOAT_RATIO_DISPLAY_CAP = 1e3;
var WORTH_IT_MIN_COST_USD = 2;
var WORTH_IT_NO_EDIT_MIN_COST_USD = 3;
var WORTH_IT_MIN_RETRIES = 3;
var WORTH_IT_RETRY_WITH_EDIT_MIN_RETRIES = 2;
var WORTH_IT_PREVIEW = 5;
var WORTH_IT_LOW_MAX_CANDIDATES = 2;
var WORTH_IT_LOW_MAX_TOTAL_COST_USD = 10;
var WORTH_IT_HIGH_MIN_CANDIDATES = 10;
var WORTH_IT_HIGH_TOTAL_COST_USD = 50;
var CAPABILITY_RELIABILITY_MIN_EDIT_TURNS = 5;
var CAPABILITY_RELIABILITY_MIN_RETRY_TURNS = 3;
var CAPABILITY_RELIABILITY_MIN_RETRY_RATE = 0.5;
var CAPABILITY_RELIABILITY_RECOVERY_FRACTION = 0.5;
var CAPABILITY_RELIABILITY_PREVIEW = 5;
var CAPABILITY_RELIABILITY_LOW_MAX_CANDIDATES = 1;
var CAPABILITY_RELIABILITY_LOW_MAX_TOKENS = 5e4;
var CAPABILITY_RELIABILITY_HIGH_MIN_CANDIDATES = 5;
var CAPABILITY_RELIABILITY_HIGH_IMPACT_TOKENS = 2e5;
var HEALTH_WEIGHT_HIGH = 15;
var HEALTH_WEIGHT_MEDIUM = 7;
var HEALTH_WEIGHT_LOW = 3;
var HEALTH_MAX_PENALTY = 80;
var GRADE_A_MIN = 90;
var GRADE_B_MIN = 75;
var GRADE_C_MIN = 55;
var GRADE_D_MIN = 30;
var URGENCY_IMPACT_WEIGHT = 0.5;
var URGENCY_TOKEN_WEIGHT = 0.5;
var URGENCY_TOKEN_NORMALIZE = 5e6;
var MAX_IMPORT_DEPTH = 5;
var IMPORT_PATTERN = /^@(\.\.?\/[^\s]+|\/[^\s]+)/gm;
var COMMAND_PATTERN = /<command-name>([^<]+)<\/command-name>|(?:^|\s)\/([a-zA-Z][\w-]*)/gm;
var JUNK_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  ".next",
  ".nuxt",
  ".output",
  "coverage",
  ".cache",
  ".tsbuildinfo",
  ".venv",
  "venv",
  ".svn",
  ".hg"
];
var JUNK_PATTERN = new RegExp(`/(?:${JUNK_DIRS.join("|")})/`);
var SHELL_PROFILES = [".zshrc", ".bashrc", ".bash_profile", ".profile"];
var TOP_ITEMS_PREVIEW = 3;
var GHOST_NAMES_PREVIEW = 5;
var GHOST_CLEANUP_COMMANDS_LIMIT = 10;
var OPTIMIZE_TEXT_CAP = 2e3;
var OPTIMIZE_FIELD_CAP = 500;
function cappedString(value, cap = OPTIMIZE_FIELD_CAP) {
  return typeof value === "string" ? value.slice(0, cap) : void 0;
}
function compactOptimizeInput(name, input) {
  if (!input || typeof input !== "object") return {};
  const raw = input;
  if (isReadTool(name)) {
    const filePath = cappedString(raw["file_path"], OPTIMIZE_TEXT_CAP);
    return filePath ? { file_path: filePath } : {};
  }
  if (name === "Agent" || name === "Task") {
    const subagentType = cappedString(raw["subagent_type"]);
    return subagentType ? { subagent_type: subagentType } : {};
  }
  if (name === "Skill") {
    const skill = cappedString(raw["skill"]);
    const skillName = cappedString(raw["name"]);
    return {
      ...skill ? { skill } : {},
      ...skillName ? { name: skillName } : {}
    };
  }
  return {};
}
var FILE_READ_CONCURRENCY = 4;
var RESULT_CACHE_TTL_MS = 6e4;
var RECENT_WINDOW_HOURS = 48;
var RECENT_WINDOW_MS = RECENT_WINDOW_HOURS * 60 * 60 * 1e3;
var DEFAULT_TREND_PERIOD_DAYS = 30;
var DEFAULT_TREND_PERIOD_MS = DEFAULT_TREND_PERIOD_DAYS * 24 * 60 * 60 * 1e3;
var IMPROVING_THRESHOLD = 0.5;
async function collectJsonlFiles2(dirPath) {
  const files = await readdir20(dirPath).catch(() => []);
  const result = files.filter((f) => f.endsWith(".jsonl")).map((f) => join37(dirPath, f));
  for (const entry of files) {
    if (entry.endsWith(".jsonl")) continue;
    const subPath = join37(dirPath, entry, "subagents");
    const subFiles = await readdir20(subPath).catch(() => []);
    for (const sf of subFiles) {
      if (sf.endsWith(".jsonl")) result.push(join37(subPath, sf));
    }
  }
  return result;
}
async function isFileStaleForRange(filePath, range) {
  if (!range) return false;
  try {
    const s = await stat22(filePath);
    return s.mtimeMs < range.start.getTime();
  } catch {
    return false;
  }
}
async function runWithConcurrency(items, limit, worker) {
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const current = idx++;
      await worker(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()));
}
function inRange(timestamp, range) {
  if (!range) return true;
  if (!timestamp) return false;
  const ts = new Date(timestamp);
  return ts >= range.start && ts <= range.end;
}
function isRecent(timestamp, cutoff) {
  if (!timestamp) return false;
  return new Date(timestamp).getTime() >= cutoff;
}
async function scanJsonlFile(filePath, project, dateRange, recentCutoffMs = Date.now() - RECENT_WINDOW_MS) {
  const calls = [];
  const cwds = [];
  const apiCalls = [];
  const userMessages = [];
  const sessionId = basename17(filePath, ".jsonl");
  let lastVersion = "";
  const skipThreshold = dateRange ? new Date(dateRange.start.getTime() - 864e5).toISOString() : null;
  const skipFn = dateRange ? (head) => shouldSkipLine(head, skipThreshold) : void 0;
  const lines = readSessionLines(filePath, skipFn, { largeLineAsBuffer: true });
  for await (const line of lines) {
    if (typeof line === "string" && !line.trim()) continue;
    if (Buffer.isBuffer(line) && line.length === 0) continue;
    const parsed = parseJsonlLine(line);
    if (!parsed) continue;
    const entry = parsed;
    if (entry.version && typeof entry.version === "string") lastVersion = entry.version;
    const ts = typeof entry.timestamp === "string" ? entry.timestamp : void 0;
    const withinRange = inRange(ts, dateRange);
    const recent = isRecent(ts, recentCutoffMs);
    if (entry.cwd && typeof entry.cwd === "string" && withinRange) cwds.push(entry.cwd);
    if (entry.type === "user") {
      if (!withinRange) continue;
      const msg2 = entry.message;
      const msgContent = msg2?.content;
      if (typeof msgContent === "string") {
        userMessages.push(msgContent.slice(0, OPTIMIZE_TEXT_CAP));
      } else if (Array.isArray(msgContent)) {
        let remaining = OPTIMIZE_TEXT_CAP;
        for (const block of msgContent) {
          if (remaining <= 0) break;
          if (block && typeof block === "object" && block.type === "text" && typeof block.text === "string") {
            const text = block.text.slice(0, remaining);
            userMessages.push(text);
            remaining -= text.length;
          }
        }
      }
      continue;
    }
    if (entry.type !== "assistant") continue;
    if (!withinRange) continue;
    const msg = entry.message;
    const usage = msg?.usage;
    if (usage) {
      const cacheCreate = usage.cache_creation_input_tokens ?? 0;
      if (cacheCreate > 0) apiCalls.push({ cacheCreationTokens: cacheCreate, version: lastVersion, recent });
    }
    const blocks = msg?.content;
    if (!Array.isArray(blocks)) continue;
    for (const block of blocks) {
      if (block.type !== "tool_use") continue;
      const name = typeof block.name === "string" ? block.name : "";
      calls.push({
        name,
        input: compactOptimizeInput(name, block.input),
        sessionId,
        project,
        recent
      });
    }
  }
  return { calls, cwds, apiCalls, userMessages };
}
async function scanSessions(dateRange) {
  const sources = await discoverAllSessions("claude");
  const allCalls = [];
  const allCwds = /* @__PURE__ */ new Set();
  const allApiCalls = [];
  const allUserMessages = [];
  const tasks = [];
  for (const source of sources) {
    const files = await collectJsonlFiles2(source.path);
    for (const file of files) {
      if (await isFileStaleForRange(file, dateRange)) continue;
      tasks.push({ file, project: source.project });
    }
  }
  await runWithConcurrency(tasks, FILE_READ_CONCURRENCY, async ({ file, project }) => {
    const { calls, cwds, apiCalls, userMessages } = await scanJsonlFile(file, project, dateRange);
    allCalls.push(...calls);
    for (const cwd of cwds) allCwds.add(cwd);
    allApiCalls.push(...apiCalls);
    allUserMessages.push(...userMessages);
  });
  return { toolCalls: allCalls, projectCwds: allCwds, apiCalls: allApiCalls, userMessages: allUserMessages };
}
function readJsonFile2(path) {
  const raw = readSessionFileSync(path);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function shortHomePath(absPath) {
  const home = homedir33();
  return absPath.startsWith(home) ? "~" + absPath.slice(home.length) : absPath;
}
function isReadTool(name) {
  return name === "Read" || name === "FileReadTool";
}
function loadMcpConfigs(projectCwds) {
  const servers = /* @__PURE__ */ new Map();
  const configPaths = [
    join37(homedir33(), ".claude", "settings.json"),
    join37(homedir33(), ".claude", "settings.local.json")
  ];
  for (const cwd of projectCwds) {
    configPaths.push(join37(cwd, ".mcp.json"));
    configPaths.push(join37(cwd, ".claude", "settings.json"));
    configPaths.push(join37(cwd, ".claude", "settings.local.json"));
  }
  for (const p of configPaths) {
    if (!existsSync8(p)) continue;
    const config = readJsonFile2(p);
    if (!config) continue;
    let mtime = 0;
    try {
      mtime = statSync3(p).mtimeMs;
    } catch {
    }
    const serversObj = config.mcpServers ?? {};
    for (const name of Object.keys(serversObj)) {
      const normalized = name.replace(/:/g, "_");
      const existing = servers.get(normalized);
      if (!existing || existing.mtime < mtime) {
        servers.set(normalized, { normalized, original: name, mtime });
      }
    }
  }
  return servers;
}
function detectJunkReads(calls, dateRange) {
  const dirCounts = /* @__PURE__ */ new Map();
  let totalJunkReads = 0;
  let recentJunkReads = 0;
  for (const call of calls) {
    if (!isReadTool(call.name)) continue;
    const filePath = call.input.file_path;
    if (!filePath || !JUNK_PATTERN.test(filePath)) continue;
    totalJunkReads++;
    if (call.recent) recentJunkReads++;
    for (const dir of JUNK_DIRS) {
      if (filePath.includes(`/${dir}/`)) {
        dirCounts.set(dir, (dirCounts.get(dir) ?? 0) + 1);
        break;
      }
    }
  }
  if (totalJunkReads < MIN_JUNK_READS_TO_FLAG) return null;
  const hasRecentActivity = calls.some((c) => c.recent);
  const trend = sessionTrend(recentJunkReads, totalJunkReads, dateRange, hasRecentActivity);
  if (trend === "resolved") return null;
  const sorted = [...dirCounts.entries()].sort((a, b) => b[1] - a[1]);
  const dirList = sorted.slice(0, TOP_ITEMS_PREVIEW).map(([d, n]) => `${d}/ (${n}x)`).join(", ");
  const tokensSaved = totalJunkReads * AVG_TOKENS_PER_READ;
  const detected = sorted.map(([d]) => d);
  const commonDefaults = ["node_modules", ".git", "dist", "__pycache__"];
  const extras = commonDefaults.filter((d) => !dirCounts.has(d)).slice(0, Math.max(0, 6 - detected.length));
  const dirsToAvoid = [...detected, ...extras].join(", ");
  return {
    title: "Claude is reading build/dependency folders",
    explanation: `Claude read into ${dirList} (${totalJunkReads} reads). These are generated or dependency directories, not your code. Tell Claude in CLAUDE.md to avoid them.`,
    impact: totalJunkReads > JUNK_READS_HIGH_THRESHOLD ? "high" : totalJunkReads > JUNK_READS_MEDIUM_THRESHOLD ? "medium" : "low",
    tokensSaved,
    fix: {
      type: "paste",
      destination: "claude-md",
      label: "Append to your project CLAUDE.md:",
      text: `Do not read or search files under these directories unless I explicitly ask: ${dirsToAvoid}.`
    },
    trend
  };
}
function detectDuplicateReads(calls, dateRange) {
  const sessionFiles = /* @__PURE__ */ new Map();
  for (const call of calls) {
    if (!isReadTool(call.name)) continue;
    const filePath = call.input.file_path;
    if (!filePath || JUNK_PATTERN.test(filePath)) continue;
    const key = `${call.project}:${call.sessionId}`;
    if (!sessionFiles.has(key)) sessionFiles.set(key, /* @__PURE__ */ new Map());
    const fm = sessionFiles.get(key);
    const entry = fm.get(filePath) ?? { count: 0, recent: 0 };
    entry.count++;
    if (call.recent) entry.recent++;
    fm.set(filePath, entry);
  }
  let totalDuplicates = 0;
  let recentDuplicates = 0;
  const fileDupes = /* @__PURE__ */ new Map();
  for (const fm of sessionFiles.values()) {
    for (const [file, entry] of fm) {
      if (entry.count <= 1) continue;
      const extra = entry.count - 1;
      totalDuplicates += extra;
      if (entry.recent > 1) recentDuplicates += entry.recent - 1;
      const name = basename17(file);
      fileDupes.set(name, (fileDupes.get(name) ?? 0) + extra);
    }
  }
  if (totalDuplicates < MIN_DUPLICATE_READS_TO_FLAG) return null;
  const hasRecentActivity = calls.some((c) => c.recent);
  const trend = sessionTrend(recentDuplicates, totalDuplicates, dateRange, hasRecentActivity);
  if (trend === "resolved") return null;
  const worst = [...fileDupes.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_ITEMS_PREVIEW).map(([name, n]) => `${name} (${n + 1}x)`).join(", ");
  const tokensSaved = totalDuplicates * AVG_TOKENS_PER_READ;
  return {
    title: "Claude is re-reading the same files",
    explanation: `${totalDuplicates} redundant re-reads across sessions. Top repeats: ${worst}. Each re-read loads the same content into context again.`,
    impact: totalDuplicates > DUPLICATE_READS_HIGH_THRESHOLD ? "high" : totalDuplicates > DUPLICATE_READS_MEDIUM_THRESHOLD ? "medium" : "low",
    tokensSaved,
    fix: {
      type: "paste",
      destination: "prompt",
      label: "Point Claude at exact locations in your prompt, for example:",
      text: "In <file> lines <start>-<end>, look at the <function> function."
    },
    trend
  };
}
function aggregateMcpCoverage(projects) {
  const servers = /* @__PURE__ */ new Map();
  function getOrInit(server) {
    let acc = servers.get(server);
    if (!acc) {
      acc = { inventory: /* @__PURE__ */ new Set(), invokedTools: /* @__PURE__ */ new Set(), invocations: 0, loadedSessions: 0 };
      servers.set(server, acc);
    }
    return acc;
  }
  for (const project of projects) {
    for (const session of project.sessions) {
      const inventoriedServers = /* @__PURE__ */ new Set();
      const sessionInvoked = /* @__PURE__ */ new Map();
      for (const fqn of session.mcpInventory ?? []) {
        const parts = fqn.split("__");
        if (parts.length < 3 || parts[0] !== "mcp") continue;
        const server = parts[1];
        if (!server) continue;
        const tool = parts.slice(2).join("__");
        if (!tool) continue;
        const acc = getOrInit(server);
        acc.inventory.add(fqn);
        inventoriedServers.add(server);
      }
      for (const turn of session.turns) {
        for (const call of turn.assistantCalls) {
          for (const fqn of call.mcpTools) {
            const parts = fqn.split("__");
            if (parts.length < 3 || parts[0] !== "mcp") continue;
            const server = parts[1];
            if (!server) continue;
            let invoked = sessionInvoked.get(server);
            if (!invoked) {
              invoked = /* @__PURE__ */ new Set();
              sessionInvoked.set(server, invoked);
            }
            invoked.add(fqn);
          }
        }
      }
      for (const [server, data] of Object.entries(session.mcpBreakdown)) {
        const acc = getOrInit(server);
        acc.invocations += data.calls;
      }
      for (const [server, invoked] of sessionInvoked) {
        const acc = getOrInit(server);
        for (const fqn of invoked) acc.invokedTools.add(fqn);
      }
      for (const server of inventoriedServers) {
        getOrInit(server).loadedSessions += 1;
      }
    }
  }
  const result = [];
  for (const [server, acc] of servers) {
    if (acc.inventory.size === 0) continue;
    const invokedInInventory = /* @__PURE__ */ new Set();
    for (const fqn of acc.invokedTools) {
      if (acc.inventory.has(fqn)) invokedInInventory.add(fqn);
    }
    const unusedTools = Array.from(acc.inventory).filter((t) => !invokedInInventory.has(t)).sort();
    const toolsInvoked = acc.inventory.size - unusedTools.length;
    result.push({
      server,
      toolsAvailable: acc.inventory.size,
      toolsInvoked,
      unusedTools,
      invocations: acc.invocations,
      loadedSessions: acc.loadedSessions,
      coverageRatio: acc.inventory.size === 0 ? 0 : toolsInvoked / acc.inventory.size
    });
  }
  result.sort((a, b) => b.toolsAvailable - a.toolsAvailable);
  return result;
}
function estimateMcpSchemaCost(unusedToolCounts, projects, serverOrServers) {
  let servers;
  let counts;
  if (typeof unusedToolCounts === "number") {
    if (typeof serverOrServers !== "string") {
      throw new TypeError("single-server MCP cost estimates require a string server name");
    }
    servers = [serverOrServers];
    counts = { [serverOrServers]: unusedToolCounts };
  } else {
    if (!Array.isArray(serverOrServers)) {
      throw new TypeError("multi-server MCP cost estimates require a string[] server list");
    }
    servers = serverOrServers;
    counts = unusedToolCounts;
  }
  const totalUnusedSchemaTokens = servers.reduce(
    (s, srv) => s + (counts[srv] ?? 0) * TOKENS_PER_MCP_TOOL,
    0
  );
  if (totalUnusedSchemaTokens === 0) {
    return { cacheWriteTokens: 0, cacheReadTokens: 0, effectiveInputTokens: 0 };
  }
  const serverSet = new Set(servers);
  let cacheWriteTokens = 0;
  let cacheReadTokens = 0;
  for (const project of projects) {
    for (const session of project.sessions) {
      let loaded = false;
      for (const fqn of session.mcpInventory ?? []) {
        const seg = fqn.split("__")[1];
        if (seg && serverSet.has(seg)) {
          loaded = true;
          break;
        }
      }
      if (!loaded) continue;
      for (const turn of session.turns) {
        for (const call of turn.assistantCalls) {
          if (call.usage.cacheCreationInputTokens > 0) {
            cacheWriteTokens += Math.min(totalUnusedSchemaTokens, call.usage.cacheCreationInputTokens);
          }
          if (call.usage.cacheReadInputTokens > 0) {
            cacheReadTokens += Math.min(totalUnusedSchemaTokens, call.usage.cacheReadInputTokens);
          }
        }
      }
    }
  }
  const effectiveInputTokens = cacheWriteTokens * CACHE_WRITE_MULTIPLIER + cacheReadTokens * CACHE_READ_DISCOUNT;
  return { cacheWriteTokens, cacheReadTokens, effectiveInputTokens };
}
function detectMcpToolCoverage(projects, coverage = aggregateMcpCoverage(projects)) {
  if (coverage.length === 0) return null;
  const flagged = coverage.filter(
    (c) => c.toolsAvailable > MCP_COVERAGE_MIN_TOOLS && c.loadedSessions >= MCP_COVERAGE_MIN_SESSIONS && c.coverageRatio < MCP_COVERAGE_LOW_THRESHOLD
  );
  if (flagged.length === 0) return null;
  flagged.sort((a, b) => b.toolsAvailable - b.toolsInvoked - (a.toolsAvailable - a.toolsInvoked));
  const lines = [];
  const removeCommands = [];
  const unusedCountsByServer = {};
  const flaggedServers = [];
  for (const c of flagged) {
    unusedCountsByServer[c.server] = c.toolsAvailable - c.toolsInvoked;
    flaggedServers.push(c.server);
    const pct2 = Math.round(c.coverageRatio * 100);
    lines.push(
      `${c.server}: ${c.toolsInvoked}/${c.toolsAvailable} tools used (${pct2}% coverage) across ${c.loadedSessions} session${c.loadedSessions === 1 ? "" : "s"}`
    );
    removeCommands.push(`claude mcp remove '${c.server}'`);
  }
  const cost = estimateMcpSchemaCost(unusedCountsByServer, projects, flaggedServers);
  const tokensSaved = Math.round(cost.effectiveInputTokens);
  const impact = tokensSaved >= MCP_COVERAGE_HIGH_IMPACT_TOKENS ? "high" : flagged.length >= UNUSED_MCP_HIGH_THRESHOLD ? "high" : "medium";
  return {
    title: `${flagged.length} MCP server${flagged.length === 1 ? "" : "s"} with low tool coverage`,
    explanation: `Schema for unused tools is loaded into the system prompt every session and carried in the cached prefix on every turn. ${lines.join("; ")}.`,
    impact,
    tokensSaved,
    fix: {
      type: "command",
      label: flagged.length === 1 ? "Remove the underused server, or trim its tools in your MCP config:" : "Remove underused servers, or trim their tools in your MCP config:",
      text: removeCommands.join("\n")
    }
  };
}
function projectProfileLabel(project) {
  return project.projectPath || project.project;
}
function projectProfileKey(project) {
  return projectProfileLabel(project);
}
function sessionLoadedMcpServer(session, server) {
  for (const fqn of session.mcpInventory ?? []) {
    const parts = fqn.split("__");
    if (parts.length >= 3 && parts[0] === "mcp" && parts[1] === server) return true;
  }
  return false;
}
function lowCoverageMcpServers(coverage) {
  return new Set(
    coverage.filter(
      (c) => c.toolsAvailable > MCP_COVERAGE_MIN_TOOLS && c.loadedSessions >= MCP_COVERAGE_MIN_SESSIONS && c.coverageRatio < MCP_COVERAGE_LOW_THRESHOLD
    ).map((c) => c.server)
  );
}
function estimateMcpProfileColdSchemaCost(projects, serverToolCounts, coldProjectKeysByServer) {
  if (serverToolCounts.size === 0 || coldProjectKeysByServer.size === 0) {
    return { cacheWriteTokens: 0, cacheReadTokens: 0, effectiveInputTokens: 0 };
  }
  let cacheWriteTokens = 0;
  let cacheReadTokens = 0;
  for (const project of projects) {
    const projectKey = projectProfileKey(project);
    for (const session of project.sessions) {
      let schemaTokens = 0;
      for (const [server, toolsAvailable] of serverToolCounts) {
        if (!coldProjectKeysByServer.get(server)?.has(projectKey)) continue;
        if (!sessionLoadedMcpServer(session, server)) continue;
        schemaTokens += toolsAvailable * TOKENS_PER_MCP_TOOL;
      }
      if (schemaTokens === 0) continue;
      for (const turn of session.turns) {
        for (const call of turn.assistantCalls) {
          if (call.usage.cacheCreationInputTokens > 0) {
            cacheWriteTokens += Math.min(schemaTokens, call.usage.cacheCreationInputTokens);
          }
          if (call.usage.cacheReadInputTokens > 0) {
            cacheReadTokens += Math.min(schemaTokens, call.usage.cacheReadInputTokens);
          }
        }
      }
    }
  }
  const effectiveInputTokens = cacheWriteTokens * CACHE_WRITE_MULTIPLIER + cacheReadTokens * CACHE_READ_DISCOUNT;
  return { cacheWriteTokens, cacheReadTokens, effectiveInputTokens };
}
function collectMcpProjectProfiles(projects, coverage) {
  const suppressedServers = lowCoverageMcpServers(coverage);
  const coverageByServer = new Map(coverage.map((c) => [c.server, c]));
  const byServer = /* @__PURE__ */ new Map();
  function getProjectStats(server, project) {
    let serverProjects = byServer.get(server);
    if (!serverProjects) {
      serverProjects = /* @__PURE__ */ new Map();
      byServer.set(server, serverProjects);
    }
    const key = projectProfileKey(project);
    let stats = serverProjects.get(key);
    if (!stats) {
      stats = {
        project: project.project,
        projectKey: key,
        projectPath: projectProfileLabel(project),
        loadedSessions: 0,
        invocations: 0
      };
      serverProjects.set(key, stats);
    }
    return stats;
  }
  for (const project of projects) {
    for (const session of project.sessions) {
      const loadedServers = /* @__PURE__ */ new Set();
      for (const fqn of session.mcpInventory ?? []) {
        const parts = fqn.split("__");
        if (parts.length >= 3 && parts[0] === "mcp" && parts[1]) loadedServers.add(parts[1]);
      }
      for (const server of loadedServers) {
        getProjectStats(server, project).loadedSessions++;
      }
      for (const [server, data] of Object.entries(session.mcpBreakdown)) {
        getProjectStats(server, project).invocations += data.calls;
      }
    }
  }
  const candidates = [];
  for (const [server, projectStats] of byServer) {
    if (suppressedServers.has(server)) continue;
    const coverageStats = coverageByServer.get(server);
    if (!coverageStats) continue;
    if (coverageStats.toolsAvailable === 0) continue;
    const loaded = Array.from(projectStats.values()).filter((p) => p.loadedSessions > 0);
    if (loaded.length < MCP_PROFILE_MIN_PROJECTS) continue;
    const invocations = loaded.reduce((sum, p) => sum + p.invocations, 0);
    if (invocations < MCP_PROFILE_MIN_HOT_INVOCATIONS) continue;
    loaded.sort(
      (a, b) => b.invocations - a.invocations || b.loadedSessions - a.loadedSessions || a.projectPath.localeCompare(b.projectPath)
    );
    const invokedProjects = loaded.filter((p) => p.invocations > 0);
    if (invokedProjects.length === 0) continue;
    const hotProjects = invokedProjects.slice(0, 2);
    const hotInvocations = hotProjects.reduce((sum, p) => sum + p.invocations, 0);
    const hotShare = hotInvocations / invocations;
    if (hotShare < MCP_PROFILE_HOT_INVOCATION_SHARE) continue;
    const coldProjects = loaded.filter((p) => p.invocations === 0);
    const coldLoadedSessions = coldProjects.reduce((sum, p) => sum + p.loadedSessions, 0);
    if (coldLoadedSessions < MCP_PROFILE_MIN_COLD_LOADED_SESSIONS) continue;
    const coldProjectKeys = new Set(coldProjects.map((project) => project.projectKey));
    const cost = estimateMcpProfileColdSchemaCost(
      projects,
      /* @__PURE__ */ new Map([[server, coverageStats.toolsAvailable]]),
      /* @__PURE__ */ new Map([[server, coldProjectKeys]])
    );
    candidates.push({
      server,
      toolsAvailable: coverageStats.toolsAvailable,
      hotProjects,
      coldProjects,
      coldProjectKeys,
      loadedProjects: loaded.length,
      loadedSessions: loaded.reduce((sum, p) => sum + p.loadedSessions, 0),
      invocations,
      hotShare,
      estimatedTokensSaved: Math.round(cost.effectiveInputTokens)
    });
  }
  candidates.sort(
    (a, b) => b.estimatedTokensSaved - a.estimatedTokensSaved || b.coldProjects.length - a.coldProjects.length || b.loadedSessions - a.loadedSessions || a.server.localeCompare(b.server)
  );
  return candidates;
}
function detectMcpProfileAdvisor(projects, coverage = aggregateMcpCoverage(projects)) {
  const candidates = collectMcpProjectProfiles(projects, coverage);
  if (candidates.length === 0) return null;
  const preview = candidates.slice(0, MCP_PROFILE_PREVIEW);
  const lines = preview.map((candidate) => {
    const hot = candidate.hotProjects.slice(0, 2).map((p) => `${p.projectPath} (${p.invocations} call${p.invocations === 1 ? "" : "s"})`).join(", ");
    const cold = candidate.coldProjects.slice(0, 3).map((p) => `${p.projectPath} (${p.loadedSessions} loaded session${p.loadedSessions === 1 ? "" : "s"})`).join(", ");
    const coldExtra = candidate.coldProjects.length > 3 ? `, +${candidate.coldProjects.length - 3} more` : "";
    return `${candidate.server}: ${Math.round(candidate.hotShare * 100)}% of ${candidate.invocations} calls in ${hot}; loaded but unused in ${cold}${coldExtra}`;
  });
  const extra = candidates.length > preview.length ? `; +${candidates.length - preview.length} more` : "";
  const serverToolCounts = new Map(candidates.map((c) => [c.server, c.toolsAvailable]));
  const coldProjectKeysByServer = new Map(candidates.map((c) => [c.server, c.coldProjectKeys]));
  const combinedCost = estimateMcpProfileColdSchemaCost(projects, serverToolCounts, coldProjectKeysByServer);
  const tokensSaved = Math.round(combinedCost.effectiveInputTokens);
  const impact = tokensSaved >= MCP_PROFILE_HIGH_IMPACT_TOKENS || candidates.length >= UNUSED_MCP_HIGH_THRESHOLD ? "high" : "medium";
  return {
    title: `${candidates.length} MCP server${candidates.length === 1 ? "" : "s"} should be project-scoped`,
    explanation: `These MCP servers look useful in a small set of projects but are loaded into other projects where they are not invoked. Project-scoping them keeps the hot-project workflow while avoiding schema overhead elsewhere. ${lines.join("; ")}${extra}.`,
    impact,
    tokensSaved,
    fix: {
      type: "paste",
      destination: "prompt",
      label: "Ask Claude to turn this into a project-scoped MCP profile:",
      text: [
        `Review these MCP profile recommendations before changing config (${preview.length} of ${candidates.length} shown):`,
        ...preview.map((candidate) => {
          const hot = candidate.hotProjects.map((p) => p.projectPath).join(", ");
          const cold = candidate.coldProjects.slice(0, 3).map((p) => p.projectPath).join(", ");
          return `- Keep ${candidate.server} available for ${hot}; remove or project-scope it away from ${cold}. Re-add it only in projects that actually need it.`;
        })
      ].join("\n")
    }
  };
}
function capabilityKey(ref) {
  return `${ref.kind}:${ref.name}`;
}
function formatCapabilityKind(kind) {
  return kind === "mcp" ? "MCP server" : "skill";
}
function mcpServerFromToolName(fqn) {
  const parts = fqn.split("__");
  if (parts.length < 3 || parts[0] !== "mcp") return null;
  return parts[1] || null;
}
function collectReliabilityCapabilities(turn) {
  const capabilities = /* @__PURE__ */ new Map();
  for (const call of turn.assistantCalls) {
    for (const fqn of call.mcpTools) {
      const server = mcpServerFromToolName(fqn);
      if (!server) continue;
      const ref = { kind: "mcp", name: server };
      capabilities.set(capabilityKey(ref), ref);
    }
    for (const rawSkill of call.skills ?? []) {
      const skill = rawSkill.trim();
      if (!skill) continue;
      const ref = { kind: "skill", name: skill };
      capabilities.set(capabilityKey(ref), ref);
    }
  }
  return capabilities;
}
function turnEffectiveTokenTotal(turn) {
  return Math.round(turn.assistantCalls.reduce(
    (sum, call) => sum + call.usage.inputTokens + call.usage.outputTokens + call.usage.cacheCreationInputTokens * CACHE_WRITE_MULTIPLIER + call.usage.cacheReadInputTokens * CACHE_READ_DISCOUNT,
    0
  ));
}
function reliabilityTurnKey(project, session, turn, turnIndex) {
  return `${project.projectPath || project.project}:${session.sessionId}:${turn.timestamp}:${turnIndex}`;
}
function getReliabilityAccumulator(stats, ref) {
  const key = capabilityKey(ref);
  let acc = stats.get(key);
  if (!acc) {
    acc = {
      ...ref,
      editTurns: 0,
      retryTurns: 0,
      oneShotTurns: 0,
      retries: 0,
      tokensTouched: 0,
      projects: /* @__PURE__ */ new Set(),
      retryTurnSavings: /* @__PURE__ */ new Map()
    };
    stats.set(key, acc);
  }
  return acc;
}
function findCapabilityReliabilityCandidates(projects) {
  const stats = /* @__PURE__ */ new Map();
  for (const project of projects) {
    for (const session of project.sessions) {
      for (let turnIndex = 0; turnIndex < session.turns.length; turnIndex++) {
        const turn = session.turns[turnIndex];
        if (!turn.hasEdits) continue;
        const capabilities = collectReliabilityCapabilities(turn);
        if (capabilities.size === 0) continue;
        const turnTokens = turnEffectiveTokenTotal(turn);
        const turnKey = reliabilityTurnKey(project, session, turn, turnIndex);
        const recoverableTokens = turn.retries > 0 ? Math.round(turnTokens * CAPABILITY_RELIABILITY_RECOVERY_FRACTION) : 0;
        for (const ref of capabilities.values()) {
          const acc = getReliabilityAccumulator(stats, ref);
          acc.editTurns++;
          acc.tokensTouched += turnTokens;
          acc.projects.add(project.project);
          if (turn.retries > 0) {
            acc.retryTurns++;
            acc.retries += turn.retries;
            acc.retryTurnSavings.set(turnKey, recoverableTokens);
          } else {
            acc.oneShotTurns++;
          }
        }
      }
    }
  }
  const candidates = [];
  for (const acc of stats.values()) {
    if (acc.editTurns < CAPABILITY_RELIABILITY_MIN_EDIT_TURNS) continue;
    if (acc.retryTurns < CAPABILITY_RELIABILITY_MIN_RETRY_TURNS) continue;
    const retryRate = acc.retryTurns / acc.editTurns;
    if (retryRate < CAPABILITY_RELIABILITY_MIN_RETRY_RATE) continue;
    candidates.push({
      kind: acc.kind,
      name: acc.name,
      editTurns: acc.editTurns,
      retryTurns: acc.retryTurns,
      oneShotTurns: acc.oneShotTurns,
      retries: acc.retries,
      retryRate,
      tokensTouched: acc.tokensTouched,
      tokensSaved: Array.from(acc.retryTurnSavings.values()).reduce((sum, tokens) => sum + tokens, 0),
      projects: Array.from(acc.projects).sort()
    });
  }
  candidates.sort(
    (a, b) => b.retryRate - a.retryRate || b.retries - a.retries || b.tokensSaved - a.tokensSaved || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)
  );
  return candidates;
}
function detectCapabilityReliability(projects) {
  const candidates = findCapabilityReliabilityCandidates(projects);
  if (candidates.length === 0) return null;
  const candidateKeys = new Set(candidates.map((c) => capabilityKey(c)));
  const uniqueRetryTurnSavings = /* @__PURE__ */ new Map();
  for (const project of projects) {
    for (const session of project.sessions) {
      for (let turnIndex = 0; turnIndex < session.turns.length; turnIndex++) {
        const turn = session.turns[turnIndex];
        if (!turn.hasEdits || turn.retries <= 0) continue;
        const capabilities = collectReliabilityCapabilities(turn);
        if (capabilities.size === 0) continue;
        const hasFlaggedCapability = Array.from(capabilities.keys()).some((key2) => candidateKeys.has(key2));
        if (!hasFlaggedCapability) continue;
        const key = reliabilityTurnKey(project, session, turn, turnIndex);
        const tokens = Math.round(turnEffectiveTokenTotal(turn) * CAPABILITY_RELIABILITY_RECOVERY_FRACTION);
        uniqueRetryTurnSavings.set(key, Math.max(uniqueRetryTurnSavings.get(key) ?? 0, tokens));
      }
    }
  }
  const tokensSaved = Array.from(uniqueRetryTurnSavings.values()).reduce((sum, tokens) => sum + tokens, 0);
  const preview = candidates.slice(0, CAPABILITY_RELIABILITY_PREVIEW);
  const list = preview.map((c) => {
    const percent = Math.round(c.retryRate * 100);
    const projects2 = c.projects.length > 1 ? ` across ${c.projects.length} projects` : ` in ${c.projects[0] ?? "one project"}`;
    return `${formatCapabilityKind(c.kind)} ${c.name}: ${c.retryTurns}/${c.editTurns} edit turns retried (${percent}%), ${c.retries} retries${projects2}`;
  }).join("; ");
  const extra = candidates.length > preview.length ? `; +${candidates.length - preview.length} more` : "";
  const names = preview.map((c) => `${formatCapabilityKind(c.kind)} ${c.name}`).join(", ");
  let impact;
  if (candidates.length >= CAPABILITY_RELIABILITY_HIGH_MIN_CANDIDATES || tokensSaved >= CAPABILITY_RELIABILITY_HIGH_IMPACT_TOKENS) {
    impact = "high";
  } else if (candidates.length <= CAPABILITY_RELIABILITY_LOW_MAX_CANDIDATES && tokensSaved < CAPABILITY_RELIABILITY_LOW_MAX_TOKENS) {
    impact = "low";
  } else {
    impact = "medium";
  }
  const kindSet = new Set(candidates.map((c) => c.kind));
  const noun = kindSet.size === 1 ? kindSet.has("mcp") ? "MCP server" : "skill" : "MCP/skill capability";
  const pluralNoun = noun === "MCP/skill capability" ? "MCP/skill capabilities" : `${noun}s`;
  const verb = candidates.length === 1 ? "correlates" : "correlate";
  return {
    title: `${candidates.length} ${candidates.length === 1 ? noun : pluralNoun} ${verb} with retry-heavy edits`,
    explanation: `Edit turns using these capabilities are retry-heavy: ${list}${extra}. This is a correlation report, not proof of causation; compare the retry-heavy turns with one-shot turns before changing MCP scope or skill instructions.`,
    impact,
    tokensSaved,
    fix: {
      type: "paste",
      destination: "prompt",
      label: "Ask Claude to audit the retry-heavy capability before changing config:",
      text: `Investigate these retry-correlated capabilities: ${names}. Compare edit turns with retries against one-shot edit turns, identify whether the MCP server or skill actually caused rework, then propose a scoped MCP config or skill-instruction change with session evidence. Do not remove a capability solely because it appears in this report.`
    }
  };
}
function detectUnusedMcp(calls, projects, projectCwds, mcpCoverage = aggregateMcpCoverage(projects)) {
  const configured = loadMcpConfigs(projectCwds);
  if (configured.size === 0) return null;
  const calledServers = /* @__PURE__ */ new Set();
  for (const call of calls) {
    if (!call.name.startsWith("mcp__")) continue;
    const seg = call.name.split("__")[1];
    if (seg) calledServers.add(seg);
  }
  for (const p of projects) {
    for (const s of p.sessions) {
      for (const server of Object.keys(s.mcpBreakdown)) calledServers.add(server);
    }
  }
  const coverageReportedServers = new Set(
    mcpCoverage.filter(
      (c) => c.toolsAvailable > MCP_COVERAGE_MIN_TOOLS && c.loadedSessions >= MCP_COVERAGE_MIN_SESSIONS && c.coverageRatio < MCP_COVERAGE_LOW_THRESHOLD
    ).map((c) => c.server)
  );
  const now = Date.now();
  const unused = [];
  for (const entry of configured.values()) {
    if (calledServers.has(entry.normalized)) continue;
    if (coverageReportedServers.has(entry.normalized)) continue;
    if (entry.mtime > 0 && now - entry.mtime < MCP_NEW_CONFIG_GRACE_MS) continue;
    unused.push(entry.original);
  }
  if (unused.length === 0) return null;
  const totalSessions = projects.reduce((s, p) => s + p.sessions.length, 0);
  const schemaTokensPerSession = unused.length * TOOLS_PER_MCP_SERVER * TOKENS_PER_MCP_TOOL;
  const tokensSaved = schemaTokensPerSession * Math.max(totalSessions, 1);
  return {
    title: `${unused.length} MCP server${unused.length > 1 ? "s" : ""} configured but never used`,
    explanation: `Never called in this period: ${unused.join(", ")}. Each server loads ~${TOOLS_PER_MCP_SERVER * TOKENS_PER_MCP_TOOL} tokens of tool schema into every session.`,
    impact: unused.length >= UNUSED_MCP_HIGH_THRESHOLD ? "high" : "medium",
    tokensSaved,
    fix: {
      type: "command",
      label: `Remove unused server${unused.length > 1 ? "s" : ""}:`,
      text: unused.map((s) => `claude mcp remove ${s}`).join("\n")
    }
  };
}
function expandImports(filePath, seen, depth) {
  if (depth > MAX_IMPORT_DEPTH || seen.has(filePath)) return { totalLines: 0, importedFiles: 0 };
  seen.add(filePath);
  const content = readSessionFileSync(filePath);
  if (content === null) return { totalLines: 0, importedFiles: 0 };
  let totalLines = content.split("\n").length;
  let importedFiles = 0;
  const dir = join37(filePath, "..");
  IMPORT_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(IMPORT_PATTERN)) {
    const rawPath = match[1];
    if (!rawPath) continue;
    const resolved = rawPath.startsWith("/") ? rawPath : join37(dir, rawPath);
    if (!existsSync8(resolved)) continue;
    const nested = expandImports(resolved, seen, depth + 1);
    totalLines += nested.totalLines;
    importedFiles += 1 + nested.importedFiles;
  }
  return { totalLines, importedFiles };
}
function detectBloatedClaudeMd(projectCwds) {
  const bloated = [];
  for (const cwd of projectCwds) {
    for (const name of ["CLAUDE.md", ".claude/CLAUDE.md"]) {
      const fullPath = join37(cwd, name);
      if (!existsSync8(fullPath)) continue;
      const { totalLines, importedFiles } = expandImports(fullPath, /* @__PURE__ */ new Set(), 0);
      if (totalLines > CLAUDEMD_HEALTHY_LINES) {
        bloated.push({ path: `${shortHomePath(cwd)}/${name}`, expandedLines: totalLines, imports: importedFiles });
      }
    }
  }
  if (bloated.length === 0) return null;
  const sorted = bloated.sort((a, b) => b.expandedLines - a.expandedLines);
  const worst = sorted[0];
  const totalExtraLines = sorted.reduce((s, b) => s + (b.expandedLines - CLAUDEMD_HEALTHY_LINES), 0);
  const tokensSaved = totalExtraLines * CLAUDEMD_TOKENS_PER_LINE;
  const list = sorted.slice(0, TOP_ITEMS_PREVIEW).map((b) => {
    const importNote = b.imports > 0 ? ` with ${b.imports} @-import${b.imports > 1 ? "s" : ""}` : "";
    return `${b.path} (${b.expandedLines} lines${importNote})`;
  }).join(", ");
  return {
    title: `Your CLAUDE.md is too long`,
    explanation: `${list}. CLAUDE.md plus all @-imported files load into every API call. Trimming below ${CLAUDEMD_HEALTHY_LINES} lines saves ~${formatTokens(tokensSaved)} tokens per call.`,
    impact: worst.expandedLines > CLAUDEMD_HIGH_THRESHOLD_LINES ? "high" : "medium",
    tokensSaved,
    fix: {
      type: "paste",
      destination: "prompt",
      label: "Ask Claude in the current session to trim it:",
      text: `Review CLAUDE.md and all @-imported files. Cut total expanded content to under ${CLAUDEMD_HEALTHY_LINES} lines. Remove anything Claude can figure out from the code itself. Keep only rules, gotchas, and non-obvious conventions.`
    }
  };
}
var READ_TOOL_NAMES = /* @__PURE__ */ new Set(["Read", "Grep", "Glob", "FileReadTool", "GrepTool", "GlobTool"]);
var EDIT_TOOL_NAMES = /* @__PURE__ */ new Set(["Edit", "Write", "FileEditTool", "FileWriteTool", "NotebookEdit"]);
function detectLowReadEditRatio(calls) {
  let reads = 0;
  let edits = 0;
  let recentEdits = 0;
  let recentReads = 0;
  for (const call of calls) {
    if (READ_TOOL_NAMES.has(call.name)) {
      reads++;
      if (call.recent) recentReads++;
    } else if (EDIT_TOOL_NAMES.has(call.name)) {
      edits++;
      if (call.recent) recentEdits++;
    }
  }
  if (edits < MIN_EDITS_FOR_RATIO) return null;
  const ratio = reads / edits;
  if (ratio >= HEALTHY_READ_EDIT_RATIO) return null;
  const impact = ratio < LOW_RATIO_HIGH_THRESHOLD ? "high" : ratio < LOW_RATIO_MEDIUM_THRESHOLD ? "medium" : "low";
  const extraReadsNeeded = Math.max(Math.round(edits * HEALTHY_READ_EDIT_RATIO) - reads, 0);
  const tokensSaved = extraReadsNeeded * AVG_TOKENS_PER_READ;
  let trend = "active";
  if (recentEdits >= MIN_EDITS_FOR_RATIO) {
    const recentRatio = recentReads / recentEdits;
    if (recentRatio >= HEALTHY_READ_EDIT_RATIO) trend = "resolved";
    else if (recentRatio > ratio * (1 / IMPROVING_THRESHOLD)) trend = "improving";
  }
  if (trend === "resolved") return null;
  return {
    title: "Claude edits more than it reads",
    explanation: `Claude made ${reads} reads and ${edits} edits (ratio ${ratio.toFixed(1)}:1). A healthy ratio is ${HEALTHY_READ_EDIT_RATIO}+ reads per edit. Editing without reading leads to retries and wasted tokens.`,
    impact,
    tokensSaved,
    fix: {
      type: "paste",
      destination: "claude-md",
      label: "Add to your CLAUDE.md:",
      text: "Before editing any file, read it first. Before modifying a function, grep for all callers. Research before you edit."
    },
    trend
  };
}
var DEFAULT_CACHE_BASELINE_TOKENS = 5e4;
var CACHE_BASELINE_QUANTILE = 0.25;
var CACHE_BLOAT_MULTIPLIER = 1.4;
var CACHE_VERSION_MIN_SAMPLES = 5;
var CACHE_VERSION_DIFF_THRESHOLD = 1e4;
function computeBudgetAwareCacheBaseline(projects) {
  const sessions = projects.flatMap((p) => p.sessions);
  if (sessions.length === 0) return DEFAULT_CACHE_BASELINE_TOKENS;
  const cacheWrites = sessions.map((s) => s.totalCacheWriteTokens).filter((n) => n > 0);
  if (cacheWrites.length < MIN_API_CALLS_FOR_CACHE) return DEFAULT_CACHE_BASELINE_TOKENS;
  const sorted = cacheWrites.sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * CACHE_BASELINE_QUANTILE)] || DEFAULT_CACHE_BASELINE_TOKENS;
}
function detectCacheBloat(apiCalls, projects, dateRange) {
  if (apiCalls.length < MIN_API_CALLS_FOR_CACHE) return null;
  const sorted = apiCalls.map((c) => c.cacheCreationTokens).sort((a, b) => a - b);
  const median2 = sorted[Math.floor(sorted.length / 2)];
  const baseline = computeBudgetAwareCacheBaseline(projects);
  const bloatThreshold = baseline * CACHE_BLOAT_MULTIPLIER;
  if (median2 < bloatThreshold) return null;
  const recentCalls = apiCalls.filter((c) => c.recent);
  const totalBloated = apiCalls.filter((c) => c.cacheCreationTokens > bloatThreshold).length;
  const recentBloated = recentCalls.filter((c) => c.cacheCreationTokens > bloatThreshold).length;
  const trend = sessionTrend(recentBloated, totalBloated, dateRange, recentCalls.length > 0);
  if (trend === "resolved") return null;
  const versionCounts = /* @__PURE__ */ new Map();
  for (const call of apiCalls) {
    if (!call.version) continue;
    const entry = versionCounts.get(call.version) ?? { total: 0, count: 0 };
    entry.total += call.cacheCreationTokens;
    entry.count++;
    versionCounts.set(call.version, entry);
  }
  const versionAvgs = [...versionCounts.entries()].filter(([, d]) => d.count >= CACHE_VERSION_MIN_SAMPLES).map(([v, d]) => ({ version: v, avg: Math.round(d.total / d.count) })).sort((a, b) => b.avg - a.avg);
  const excess = median2 - baseline;
  const tokensSaved = excess * apiCalls.length;
  let versionNote = "";
  if (versionAvgs.length >= 2) {
    const [high, ...rest] = versionAvgs;
    const low = rest[rest.length - 1];
    if (high.avg - low.avg > CACHE_VERSION_DIFF_THRESHOLD) {
      versionNote = ` Version ${high.version} averages ${formatTokens(high.avg)} vs ${low.version} at ${formatTokens(low.avg)}.`;
    }
  }
  return {
    title: "Session warmup is unusually large",
    explanation: `Median cache_creation per call is ${formatTokens(median2)} tokens, about ${formatTokens(excess)} above your baseline of ${formatTokens(baseline)}.${versionNote}`,
    impact: excess > CACHE_EXCESS_HIGH_THRESHOLD ? "high" : "medium",
    tokensSaved,
    fix: {
      type: "paste",
      destination: "shell-config",
      label: "Check for recent Claude Code updates or heavy MCP/skill additions. As a workaround (not officially supported), add to ~/.zshrc or ~/.bashrc:",
      text: "export ANTHROPIC_CUSTOM_HEADERS='User-Agent: claude-cli/2.1.98 (external, sdk-cli)'"
    },
    trend
  };
}
async function listMarkdownFiles(dir) {
  if (!existsSync8(dir)) return [];
  try {
    const entries = await readdir20(dir);
    return entries.filter((e) => e.endsWith(".md")).map((e) => e.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}
async function listSkillDirs(dir) {
  if (!existsSync8(dir)) return [];
  try {
    const entries = await readdir20(dir);
    const names = [];
    for (const entry of entries) {
      if (existsSync8(join37(dir, entry, "SKILL.md"))) names.push(entry);
    }
    return names;
  } catch {
    return [];
  }
}
async function detectGhostAgents(calls) {
  const defined = await listMarkdownFiles(join37(homedir33(), ".claude", "agents"));
  if (defined.length === 0) return null;
  const invoked = /* @__PURE__ */ new Set();
  for (const call of calls) {
    if (call.name !== "Agent" && call.name !== "Task") continue;
    const subType = call.input.subagent_type;
    if (subType) invoked.add(subType);
  }
  const ghosts = defined.filter((name) => !invoked.has(name));
  if (ghosts.length === 0) return null;
  const tokensSaved = ghosts.length * TOKENS_PER_AGENT_DEF;
  const list = ghosts.slice(0, GHOST_NAMES_PREVIEW).join(", ") + (ghosts.length > GHOST_NAMES_PREVIEW ? `, +${ghosts.length - GHOST_NAMES_PREVIEW} more` : "");
  return {
    title: `${ghosts.length} custom agent${ghosts.length > 1 ? "s" : ""} you never use`,
    explanation: `Defined in ~/.claude/agents/ but never invoked in this period: ${list}. Each adds ~${TOKENS_PER_AGENT_DEF} tokens to the Task tool schema on every session.`,
    impact: ghosts.length >= GHOST_AGENTS_HIGH_THRESHOLD ? "high" : ghosts.length >= GHOST_AGENTS_MEDIUM_THRESHOLD ? "medium" : "low",
    tokensSaved,
    fix: {
      type: "command",
      label: `Archive unused agent${ghosts.length > 1 ? "s" : ""}:`,
      text: ghosts.slice(0, GHOST_CLEANUP_COMMANDS_LIMIT).map((name) => `mv ~/.claude/agents/${name}.md ~/.claude/agents/.archived/`).join("\n")
    }
  };
}
async function detectGhostSkills(calls) {
  const defined = await listSkillDirs(join37(homedir33(), ".claude", "skills"));
  if (defined.length === 0) return null;
  const invoked = /* @__PURE__ */ new Set();
  for (const call of calls) {
    if (call.name !== "Skill") continue;
    const skillName = call.input.skill || call.input.name;
    if (skillName) invoked.add(skillName);
  }
  const ghosts = defined.filter((name) => !invoked.has(name));
  if (ghosts.length === 0) return null;
  const tokensSaved = ghosts.length * TOKENS_PER_SKILL_DEF;
  const list = ghosts.slice(0, GHOST_NAMES_PREVIEW).join(", ") + (ghosts.length > GHOST_NAMES_PREVIEW ? `, +${ghosts.length - GHOST_NAMES_PREVIEW} more` : "");
  return {
    title: `${ghosts.length} skill${ghosts.length > 1 ? "s" : ""} you never use`,
    explanation: `In ~/.claude/skills/ but not invoked this period: ${list}. Each adds ~${TOKENS_PER_SKILL_DEF} tokens of metadata to every session.`,
    impact: ghosts.length >= GHOST_SKILLS_HIGH_THRESHOLD ? "high" : ghosts.length >= GHOST_SKILLS_MEDIUM_THRESHOLD ? "medium" : "low",
    tokensSaved,
    fix: {
      type: "command",
      label: `Archive unused skill${ghosts.length > 1 ? "s" : ""}:`,
      text: ghosts.slice(0, GHOST_CLEANUP_COMMANDS_LIMIT).map((name) => `mv ~/.claude/skills/${name} ~/.claude/skills/.archived/`).join("\n")
    }
  };
}
async function detectGhostCommands(userMessages) {
  const defined = await listMarkdownFiles(join37(homedir33(), ".claude", "commands"));
  if (defined.length === 0) return null;
  const invoked = /* @__PURE__ */ new Set();
  for (const msg of userMessages) {
    COMMAND_PATTERN.lastIndex = 0;
    for (const m of msg.matchAll(COMMAND_PATTERN)) {
      const name = (m[1] || m[2] || "").trim();
      if (name) invoked.add(name);
    }
  }
  const ghosts = defined.filter((name) => !invoked.has(name));
  if (ghosts.length === 0) return null;
  const tokensSaved = ghosts.length * TOKENS_PER_COMMAND_DEF;
  const list = ghosts.slice(0, GHOST_NAMES_PREVIEW).join(", ") + (ghosts.length > GHOST_NAMES_PREVIEW ? `, +${ghosts.length - GHOST_NAMES_PREVIEW} more` : "");
  return {
    title: `${ghosts.length} slash command${ghosts.length > 1 ? "s" : ""} you never use`,
    explanation: `In ~/.claude/commands/ but not referenced this period: ${list}. Each adds ~${TOKENS_PER_COMMAND_DEF} tokens of definition per session.`,
    impact: ghosts.length >= GHOST_COMMANDS_MEDIUM_THRESHOLD ? "medium" : "low",
    tokensSaved,
    fix: {
      type: "command",
      label: `Archive unused command${ghosts.length > 1 ? "s" : ""}:`,
      text: ghosts.slice(0, GHOST_CLEANUP_COMMANDS_LIMIT).map((name) => `mv ~/.claude/commands/${name}.md ~/.claude/commands/.archived/`).join("\n")
    }
  };
}
function readShellProfileLimit() {
  for (const profile of SHELL_PROFILES) {
    const path = join37(homedir33(), profile);
    if (!existsSync8(path)) continue;
    const content = readSessionFileSync(path);
    if (content === null) continue;
    const match = content.match(/^\s*export\s+BASH_MAX_OUTPUT_LENGTH\s*=\s*['"]?(\d+)['"]?/m);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}
function detectBashBloat() {
  const profileLimit = readShellProfileLimit();
  const envLimit = process.env["BASH_MAX_OUTPUT_LENGTH"];
  const configured = profileLimit ?? (envLimit ? parseInt(envLimit, 10) : null);
  if (configured !== null && configured <= BASH_RECOMMENDED_LIMIT) return null;
  const limit = configured ?? BASH_DEFAULT_LIMIT;
  const extraChars = limit - BASH_RECOMMENDED_LIMIT;
  const tokensSaved = Math.round(extraChars * BASH_TOKENS_PER_CHAR);
  return {
    title: "Shrink bash output limit",
    explanation: `Your bash output cap is ${(limit / 1e3).toFixed(0)}K chars (${configured ? "configured" : "default"}). Most output fits in ${(BASH_RECOMMENDED_LIMIT / 1e3).toFixed(0)}K. The extra ~${formatTokens(tokensSaved)} tokens per bash call is trailing noise.`,
    impact: "medium",
    tokensSaved,
    fix: {
      type: "paste",
      destination: "shell-config",
      label: "Add to ~/.zshrc or ~/.bashrc:",
      text: `export BASH_MAX_OUTPUT_LENGTH=${BASH_RECOMMENDED_LIMIT}`
    }
  };
}
function sessionTokenTotal(session) {
  return session.totalInputTokens + session.totalOutputTokens + session.totalCacheReadTokens + session.totalCacheWriteTokens;
}
function sessionEffectiveContextTokens(session) {
  return session.totalInputTokens + session.totalCacheReadTokens * CACHE_READ_DISCOUNT + session.totalCacheWriteTokens * CACHE_WRITE_MULTIPLIER;
}
function formatContextRatio(ratio) {
  if (ratio >= CONTEXT_BLOAT_RATIO_DISPLAY_CAP) return `${CONTEXT_BLOAT_RATIO_DISPLAY_CAP}+`;
  return ratio.toFixed(1);
}
var DELIVERY_COMMAND_PATTERNS = [
  /(?:^|[;&|]\s*)git\s+(?:commit|push)(?=\s|$|--)(?![^;&|]*--dry-run)/,
  /(?:^|[;&|]\s*)gh\s+pr\s+(?:create|merge)(?=\s|$|--)(?![^;&|]*--dry-run)/
];
function sessionDeliveryCommand(session) {
  const commands = Object.keys(session.bashBreakdown);
  return commands.find((command) => DELIVERY_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) ?? null;
}
function hasCategoryBreakdownData(session) {
  return Object.values(session.categoryBreakdown).some(
    (category) => category.turns > 0 || category.costUSD > 0 || category.retries > 0 || category.editTurns > 0 || category.oneShotTurns > 0
  );
}
function sessionEditTurns(session) {
  if (hasCategoryBreakdownData(session)) {
    return Object.values(session.categoryBreakdown).reduce((sum, c) => sum + c.editTurns, 0);
  }
  return session.turns.filter((turn) => turn.hasEdits).length;
}
function sessionOneShotTurns(session) {
  if (hasCategoryBreakdownData(session)) {
    return Object.values(session.categoryBreakdown).reduce((sum, c) => sum + c.oneShotTurns, 0);
  }
  return session.turns.filter((turn) => turn.hasEdits && turn.retries === 0).length;
}
function sessionRetryCount(session) {
  if (hasCategoryBreakdownData(session)) {
    return Object.values(session.categoryBreakdown).reduce((sum, c) => sum + c.retries, 0);
  }
  return session.turns.reduce((sum, turn) => sum + turn.retries, 0);
}
function sessionTotalTurns(session) {
  if (hasCategoryBreakdownData(session)) {
    return Object.values(session.categoryBreakdown).reduce((sum, c) => sum + c.turns, 0);
  }
  return session.turns.length;
}
function estimateLowWorthRecoverableTokens(session, editTurns, retries) {
  const tokens = sessionTokenTotal(session);
  if (editTurns === 0) return tokens;
  const totalTurns = sessionTotalTurns(session);
  if (totalTurns === 0) return 0;
  const fraction = Math.min(1, Math.max(0, retries / totalTurns));
  return Math.round(tokens * fraction);
}
function findLowWorthCandidates(projects) {
  const candidates = [];
  for (const project of projects) {
    for (const session of project.sessions) {
      if (session.totalCostUSD < WORTH_IT_MIN_COST_USD) continue;
      if (sessionDeliveryCommand(session)) continue;
      const editTurns = sessionEditTurns(session);
      const oneShotTurns = sessionOneShotTurns(session);
      const retries = sessionRetryCount(session);
      const reasons = [];
      if (editTurns === 0 && session.totalCostUSD >= WORTH_IT_NO_EDIT_MIN_COST_USD) {
        reasons.push("no edit turns");
      }
      if (retries >= WORTH_IT_MIN_RETRIES) {
        reasons.push(`${retries} retries`);
      }
      if (editTurns > 0 && oneShotTurns === 0 && retries >= WORTH_IT_RETRY_WITH_EDIT_MIN_RETRIES) {
        reasons.push("no one-shot edit turns");
      }
      if (reasons.length === 0) continue;
      candidates.push({
        project: project.project,
        sessionId: session.sessionId,
        date: session.firstTimestamp.slice(0, 10),
        cost: session.totalCostUSD,
        tokens: estimateLowWorthRecoverableTokens(session, editTurns, retries),
        reasons
      });
    }
  }
  candidates.sort(
    (a, b) => b.cost - a.cost || a.date.localeCompare(b.date) || a.project.localeCompare(b.project) || a.sessionId.localeCompare(b.sessionId)
  );
  return candidates;
}
function detectLowWorthSessions(projects) {
  const candidates = findLowWorthCandidates(projects);
  if (candidates.length === 0) return null;
  const preview = candidates.slice(0, WORTH_IT_PREVIEW);
  const list = preview.map((s) => `${s.project}/${s.sessionId} on ${s.date}: ${formatCost(s.cost)} (${s.reasons.join(", ")})`).join("; ");
  const extra = candidates.length > preview.length ? `; +${candidates.length - preview.length} more` : "";
  const tokensSaved = Math.round(candidates.reduce((sum, s) => sum + s.tokens, 0));
  const totalCost = candidates.reduce((sum, s) => sum + s.cost, 0);
  let impact;
  if (candidates.length >= WORTH_IT_HIGH_MIN_CANDIDATES || totalCost >= WORTH_IT_HIGH_TOTAL_COST_USD) {
    impact = "high";
  } else if (candidates.length <= WORTH_IT_LOW_MAX_CANDIDATES && totalCost < WORTH_IT_LOW_MAX_TOTAL_COST_USD) {
    impact = "low";
  } else {
    impact = "medium";
  }
  return {
    title: `${candidates.length} possibly low-worth expensive session${candidates.length === 1 ? "" : "s"}`,
    explanation: `Sessions with meaningful spend but weak delivery signals: ${list}${extra}. This is a review candidate, not proof of waste: CodeBurn flags missing edit turns, repeated retries, and sessions without git delivery commands so you can decide whether the work was worth its cost before it becomes a habit.`,
    impact,
    tokensSaved,
    fix: {
      type: "paste",
      destination: "session-opener",
      label: "Paste at the start of your NEXT expensive thread (one-time, do not add to CLAUDE.md):",
      text: "Before continuing, name the deliverable in one sentence (PR title, file changed, command output you expect). Stop and check with me if (a) you spend more than 10 minutes without an edit, or (b) the same approach fails twice. Do not retry past two attempts on any single fix."
    }
  };
}
function findContextBloatCandidates(projects) {
  const candidates = [];
  for (const project of projects) {
    const sessions = [...project.sessions].sort(
      (a, b) => new Date(a.firstTimestamp).getTime() - new Date(b.firstTimestamp).getTime()
    );
    let previousInputTokens = null;
    let previousTimestampMs = null;
    for (const session of sessions) {
      const inputTokens = sessionEffectiveContextTokens(session);
      const outputTokens = session.totalOutputTokens;
      const ratio = inputTokens / Math.max(outputTokens, 1);
      const currentMs = new Date(session.firstTimestamp).getTime();
      const gapMs = previousTimestampMs !== null ? currentMs - previousTimestampMs : null;
      const growthRatio = previousInputTokens !== null && previousInputTokens > 0 && gapMs !== null && gapMs <= CONTEXT_BLOAT_GROWTH_MAX_GAP_MS ? inputTokens / previousInputTokens : null;
      previousInputTokens = inputTokens;
      previousTimestampMs = currentMs;
      if (inputTokens < CONTEXT_BLOAT_MIN_INPUT_TOKENS) continue;
      if (ratio < CONTEXT_BLOAT_MIN_RATIO) continue;
      candidates.push({
        project: project.project,
        sessionId: session.sessionId,
        date: session.firstTimestamp.slice(0, 10),
        effectiveInputTokens: inputTokens,
        outputTokens,
        ratio,
        excessInputTokens: Math.max(0, inputTokens - outputTokens * CONTEXT_BLOAT_TARGET_RATIO),
        growthRatio
      });
    }
  }
  candidates.sort(
    (a, b) => b.excessInputTokens - a.excessInputTokens || a.date.localeCompare(b.date) || a.project.localeCompare(b.project) || a.sessionId.localeCompare(b.sessionId)
  );
  return candidates;
}
function detectContextBloat(projects, excludedSessionIds) {
  const candidates = findContextBloatCandidates(projects).filter((c) => !excludedSessionIds?.has(c.sessionId));
  if (candidates.length === 0) return null;
  const preview = candidates.slice(0, CONTEXT_BLOAT_PREVIEW);
  const list = preview.map((c) => {
    const growth = c.growthRatio !== null && c.growthRatio >= CONTEXT_BLOAT_GROWTH_RATIO ? `, ${c.growthRatio.toFixed(1)}x previous session input` : "";
    return `${c.project}/${c.sessionId} on ${c.date}: ${formatTokens(c.effectiveInputTokens)} effective input/cache vs ${formatTokens(c.outputTokens)} output (${formatContextRatio(c.ratio)}:1${growth})`;
  }).join("; ");
  const extra = candidates.length > preview.length ? `; +${candidates.length - preview.length} more` : "";
  const tokensSaved = Math.round(candidates.reduce((sum, c) => sum + c.excessInputTokens, 0));
  const totalInputTokens = candidates.reduce((sum, c) => sum + c.effectiveInputTokens, 0);
  let impact;
  if (candidates.length >= CONTEXT_BLOAT_HIGH_MIN_CANDIDATES || totalInputTokens >= CONTEXT_BLOAT_HIGH_INPUT_TOKENS) {
    impact = "high";
  } else if (candidates.length <= CONTEXT_BLOAT_LOW_MAX_CANDIDATES && totalInputTokens < CONTEXT_BLOAT_LOW_INPUT_TOKENS) {
    impact = "low";
  } else {
    impact = "medium";
  }
  return {
    title: `${candidates.length} context-heavy session${candidates.length === 1 ? "" : "s"}`,
    explanation: `Effective input/cache tokens swamp output in these sessions: ${list}${extra}. This can come from stale context carryover, inherently context-heavy work, or abandoned runs that loaded too much context; starting fresh with only the current goal and relevant files can cut repeated prompt overhead.`,
    impact,
    tokensSaved,
    fix: {
      type: "paste",
      destination: "session-opener",
      label: "Paste at the start of your NEXT expensive thread (one-time, do not add to CLAUDE.md):",
      text: "Start fresh before continuing. Use only the current goal, the relevant files, the failing command/output, and the constraints below. Restate the working context in under 10 bullets before editing."
    }
  };
}
function detectSessionOutliers(projects, excludedSessionIds) {
  const outliers = [];
  for (const project of projects) {
    const sessions = project.sessions.filter((s) => s.totalCostUSD > 0);
    if (sessions.length < MIN_SESSIONS_FOR_OUTLIER) continue;
    const totalCost = sessions.reduce((sum, s) => sum + s.totalCostUSD, 0);
    const totalTokens = sessions.reduce((sum, s) => sum + sessionTokenTotal(s), 0);
    for (const session of sessions) {
      const avgCost = (totalCost - session.totalCostUSD) / (sessions.length - 1);
      const avgTokens = (totalTokens - sessionTokenTotal(session)) / (sessions.length - 1);
      if (avgCost <= 0) continue;
      const ratio = session.totalCostUSD / avgCost;
      if (ratio <= SESSION_OUTLIER_MULTIPLIER) continue;
      if (session.totalCostUSD < MIN_SESSION_OUTLIER_COST_USD) continue;
      if (excludedSessionIds?.has(session.sessionId)) continue;
      outliers.push({
        project: project.project,
        sessionId: session.sessionId,
        date: session.firstTimestamp.slice(0, 10),
        cost: session.totalCostUSD,
        avgCost,
        ratio,
        tokenExcess: Math.max(0, sessionTokenTotal(session) - avgTokens)
      });
    }
  }
  if (outliers.length === 0) return null;
  outliers.sort((a, b) => b.cost - a.cost);
  const preview = outliers.slice(0, SESSION_OUTLIER_PREVIEW);
  const list = preview.map((o) => `${o.project}/${o.sessionId} on ${o.date}: ${formatCost(o.cost)} (${o.ratio.toFixed(1)}x avg)`).join("; ");
  const extra = outliers.length > preview.length ? `; +${outliers.length - preview.length} more` : "";
  const tokensSaved = Math.round(outliers.reduce((sum, o) => sum + o.tokenExcess, 0));
  const totalExcessCost = outliers.reduce((sum, o) => sum + Math.max(0, o.cost - o.avgCost), 0);
  return {
    title: `${outliers.length} high-cost session outlier${outliers.length === 1 ? "" : "s"}`,
    explanation: `Sessions costing more than ${SESSION_OUTLIER_MULTIPLIER}x their peer-session average in the same project: ${list}${extra}. These usually come from broad prompts, runaway loops, or context-heavy work that should be split into smaller sessions.`,
    impact: outliers.length >= 3 || totalExcessCost >= 10 ? "high" : "medium",
    tokensSaved,
    fix: {
      type: "paste",
      destination: "session-opener",
      label: "Paste at the start of your NEXT expensive thread (one-time, do not add to CLAUDE.md):",
      text: "Before making changes, summarize the smallest viable plan. Keep context narrow, avoid broad searches, and stop after the first working patch so I can review before continuing."
    }
  };
}
var HEALTH_WEIGHTS = {
  high: HEALTH_WEIGHT_HIGH,
  medium: HEALTH_WEIGHT_MEDIUM,
  low: HEALTH_WEIGHT_LOW
};
function computeHealth(findings) {
  if (findings.length === 0) return { score: 100, grade: "A" };
  let penalty = 0;
  for (const f of findings) penalty += HEALTH_WEIGHTS[f.impact] ?? 0;
  const score = Math.max(0, 100 - Math.min(HEALTH_MAX_PENALTY, penalty));
  const grade = score >= GRADE_A_MIN ? "A" : score >= GRADE_B_MIN ? "B" : score >= GRADE_C_MIN ? "C" : score >= GRADE_D_MIN ? "D" : "F";
  return { score, grade };
}
var URGENCY_WEIGHTS = { high: 1, medium: 0.5, low: 0.2 };
function urgencyScore(f) {
  const normalizedTokens = Math.min(1, f.tokensSaved / URGENCY_TOKEN_NORMALIZE);
  return URGENCY_WEIGHTS[f.impact] * URGENCY_IMPACT_WEIGHT + normalizedTokens * URGENCY_TOKEN_WEIGHT;
}
function computeTrend(inputs) {
  const { recentCount, recentWindowMs, baselineCount, baselineWindowMs, hasRecentActivity } = inputs;
  if (baselineCount === 0) return "active";
  if (recentCount === 0 && hasRecentActivity) return "resolved";
  if (!hasRecentActivity) return "active";
  const baselineRate = baselineCount / baselineWindowMs;
  const recentRate = recentCount / Math.max(recentWindowMs, 1);
  if (recentRate < baselineRate * IMPROVING_THRESHOLD) return "improving";
  return "active";
}
function sessionTrend(recentItemCount, totalItemCount, dateRange, hasRecentActivity) {
  const now = Date.now();
  const baselineCount = totalItemCount - recentItemCount;
  const periodStart = dateRange ? dateRange.start.getTime() : now - DEFAULT_TREND_PERIOD_MS;
  const recentStart = now - RECENT_WINDOW_MS;
  const baselineWindowMs = Math.max(recentStart - periodStart, 1);
  return computeTrend({
    recentCount: recentItemCount,
    recentWindowMs: RECENT_WINDOW_MS,
    baselineCount,
    baselineWindowMs,
    hasRecentActivity
  });
}
var INPUT_COST_RATIO = 0.7;
var DEFAULT_COST_PER_TOKEN = 0;
function computeInputCostRate(projects) {
  const sessions = projects.flatMap((p) => p.sessions);
  const totalCost = sessions.reduce((s, sess) => s + sess.totalCostUSD, 0);
  const totalTokens = sessions.reduce((s, sess) => s + sess.totalInputTokens + sess.totalCacheReadTokens + sess.totalCacheWriteTokens, 0);
  if (totalTokens === 0 || totalCost === 0) return DEFAULT_COST_PER_TOKEN;
  return totalCost * INPUT_COST_RATIO / totalTokens;
}
var resultCache = /* @__PURE__ */ new Map();
function cacheKey2(projects, dateRange) {
  const dr = dateRange ? `${dateRange.start.getTime()}-${dateRange.end.getTime()}` : "all";
  const fingerprint = projects.length + ":" + projects.reduce((s, p) => s + p.totalApiCalls, 0);
  return `${dr}:${fingerprint}`;
}
async function scanAndDetect(projects, dateRange) {
  if (projects.length === 0) {
    return { findings: [], costRate: 0, healthScore: 100, healthGrade: "A" };
  }
  const key = cacheKey2(projects, dateRange);
  const cached = resultCache.get(key);
  if (cached && Date.now() - cached.ts < RESULT_CACHE_TTL_MS) return cached.data;
  const costRate = computeInputCostRate(projects);
  const { toolCalls: toolCalls2, projectCwds, apiCalls, userMessages } = await scanSessions(dateRange);
  const mcpCoverage = aggregateMcpCoverage(projects);
  const findings = [];
  const lowWorthSessionIds = new Set(findLowWorthCandidates(projects).map((c) => c.sessionId));
  const contextBloatVisibleIds = new Set(
    findContextBloatCandidates(projects).filter((c) => !lowWorthSessionIds.has(c.sessionId)).map((c) => c.sessionId)
  );
  const outlierExclusions = /* @__PURE__ */ new Set([...lowWorthSessionIds, ...contextBloatVisibleIds]);
  const syncDetectors = [
    () => detectCacheBloat(apiCalls, projects, dateRange),
    () => detectLowReadEditRatio(toolCalls2),
    () => detectJunkReads(toolCalls2, dateRange),
    () => detectDuplicateReads(toolCalls2, dateRange),
    () => detectUnusedMcp(toolCalls2, projects, projectCwds, mcpCoverage),
    () => detectMcpToolCoverage(projects, mcpCoverage),
    () => detectMcpProfileAdvisor(projects, mcpCoverage),
    () => detectCapabilityReliability(projects),
    () => detectLowWorthSessions(projects),
    () => detectContextBloat(projects, lowWorthSessionIds),
    () => detectSessionOutliers(projects, outlierExclusions),
    () => detectBloatedClaudeMd(projectCwds),
    () => detectBashBloat()
  ];
  for (const detect of syncDetectors) {
    const finding = detect();
    if (finding) findings.push(finding);
  }
  const ghostResults = await Promise.all([
    detectGhostAgents(toolCalls2),
    detectGhostSkills(toolCalls2),
    detectGhostCommands(userMessages)
  ]);
  for (const f of ghostResults) if (f) findings.push(f);
  findings.sort((a, b) => urgencyScore(b) - urgencyScore(a));
  const { score, grade } = computeHealth(findings);
  const result = { findings, costRate, healthScore: score, healthGrade: grade };
  resultCache.set(key, { data: result, ts: Date.now() });
  return result;
}
var PANEL_WIDTH = 62;
var SEP = "\u2500";
var IMPACT_COLORS = { high: RED, medium: ORANGE, low: DIM };
var GRADE_COLORS = { A: GREEN, B: GREEN, C: GOLD, D: ORANGE, F: RED };
function wrap(text, width, indent) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + word.length + 1 > width) {
      lines.push(indent + current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(indent + current);
  return lines.join("\n");
}
function renderActionHeader(action) {
  const headerWidth = PANEL_WIDTH - 4;
  const fillTo = (label) => {
    const inner = ` ${label} `;
    const trailing = Math.max(2, headerWidth - inner.length - 4);
    return `--${inner}${SEP.repeat(trailing)}`.padEnd(headerWidth);
  };
  switch (action.type) {
    case "file-content":
      return fillTo(`Suggested ${action.path} addition`);
    case "command":
      return fillTo("Run this command");
    case "paste":
      switch (action.destination) {
        case "claude-md":
          return fillTo("Suggested CLAUDE.md addition (permanent rule)");
        case "session-opener":
          return fillTo("One-time session opener (do NOT add to CLAUDE.md)");
        case "prompt":
          return fillTo("Ask Claude in the current session");
        case "shell-config":
          return fillTo("Add to your shell config");
        default:
          return fillTo("Suggested action");
      }
  }
}
function renderFinding(n, f, costRate) {
  const lines = [];
  const costSaved = f.tokensSaved * costRate;
  const impactLabel = f.impact.charAt(0).toUpperCase() + f.impact.slice(1);
  const trendBadge = f.trend === "improving" ? " improving \u2193 " : "";
  const savings = `~${formatTokens(f.tokensSaved)} tokens (~${formatCost(costSaved)})`;
  const titlePad = PANEL_WIDTH - f.title.length - impactLabel.length - trendBadge.length - 8;
  const pad2 = titlePad > 0 ? " " + SEP.repeat(titlePad) + " " : "  ";
  lines.push(chalk2.hex(DIM)(`  ${SEP}${SEP}${SEP} `) + chalk2.bold(`${n}. ${f.title}`) + chalk2.hex(DIM)(pad2) + chalk2.hex(IMPACT_COLORS[f.impact])(impactLabel) + (trendBadge ? chalk2.hex(GREEN)(trendBadge) : "") + chalk2.hex(DIM)(` ${SEP}${SEP}${SEP}`));
  lines.push("");
  lines.push(wrap(f.explanation, PANEL_WIDTH - 4, "  "));
  lines.push("");
  lines.push(chalk2.hex(GOLD)(`  Potential savings: ${savings}`));
  lines.push("");
  const a = f.fix;
  lines.push(chalk2.hex(ORANGE)(`  ${renderActionHeader(a)}`));
  lines.push(chalk2.hex(DIM)(`  ${a.label}`));
  if (a.type === "file-content") {
    for (const line of a.content.split("\n")) lines.push(chalk2.hex(CYAN)(`    ${line}`));
  } else if (a.type === "command") {
    for (const line of a.text.split("\n")) lines.push(chalk2.hex(CYAN)(`    ${line}`));
  } else {
    for (const line of a.text.split("\n")) lines.push(chalk2.hex(CYAN)(`    ${line}`));
  }
  lines.push("");
  return lines;
}
function renderOptimize(findings, costRate, periodLabel, periodCost, sessionCount, callCount, healthScore, healthGrade) {
  const lines = [];
  lines.push("");
  lines.push(`  ${chalk2.bold.hex(ORANGE)("CodeBurn config health")}${chalk2.dim("  " + periodLabel)}`);
  lines.push(chalk2.hex(DIM)("  " + SEP.repeat(PANEL_WIDTH)));
  const issueSuffix = findings.length > 0 ? `, ${findings.length} issue${findings.length > 1 ? "s" : ""}` : "";
  lines.push("  " + [
    `${sessionCount} sessions`,
    `${callCount.toLocaleString()} calls`,
    chalk2.hex(GOLD)(formatCost(periodCost)),
    `Health: ${chalk2.bold.hex(GRADE_COLORS[healthGrade])(healthGrade)}${chalk2.dim(` (${healthScore}/100${issueSuffix})`)}`
  ].join(chalk2.hex(DIM)("   ")));
  lines.push("");
  if (findings.length === 0) {
    lines.push(chalk2.hex(GREEN)("  Nothing to fix. Your setup is lean."));
    lines.push("");
    lines.push(chalk2.dim("  CodeBurn optimize scans your Claude Code sessions and config for"));
    lines.push(chalk2.dim("  token waste: junk directory reads, duplicate file reads, unused"));
    lines.push(chalk2.dim("  agents/skills/MCP servers, bloated CLAUDE.md, and more."));
    lines.push("");
    return lines.join("\n");
  }
  const totalTokens = findings.reduce((s, f) => s + f.tokensSaved, 0);
  const totalCost = totalTokens * costRate;
  const pctRaw = periodCost > 0 ? totalCost / periodCost * 100 : 0;
  const pct2 = pctRaw >= 1 ? pctRaw.toFixed(0) : pctRaw.toFixed(1);
  const costText = costRate > 0 ? ` (~${formatCost(totalCost)}, ~${pct2}% of spend)` : "";
  lines.push(chalk2.hex(GREEN)(`  Potential savings: ~${formatTokens(totalTokens)} tokens${costText}`));
  lines.push("");
  for (let i = 0; i < findings.length; i++) {
    lines.push(...renderFinding(i + 1, findings[i], costRate));
  }
  lines.push(chalk2.hex(DIM)("  " + SEP.repeat(PANEL_WIDTH)));
  lines.push(chalk2.dim("  Estimates only."));
  lines.push("");
  return lines.join("\n");
}
async function runOptimize(projects, periodLabel, dateRange) {
  if (projects.length === 0) {
    console.log(chalk2.dim("\n  No usage data found for this period.\n"));
    return;
  }
  process.stderr.write(chalk2.dim("  Analyzing your sessions...\n"));
  const { findings, costRate, healthScore, healthGrade } = await scanAndDetect(projects, dateRange);
  const sessions = projects.flatMap((p) => p.sessions);
  const periodCost = projects.reduce((s, p) => s + p.totalCostUSD, 0);
  const callCount = projects.reduce((s, p) => s + p.totalApiCalls, 0);
  const output = renderOptimize(findings, costRate, periodLabel, periodCost, sessions.length, callCount, healthScore, healthGrade);
  console.log(output);
}

// src/context-budget.ts
init_fs_utils();
import { readdir as readdir21 } from "fs/promises";
import { existsSync as existsSync9 } from "fs";
import { join as join38 } from "path";
import { homedir as homedir34 } from "os";
var CHARS_PER_TOKEN7 = 4;
var SYSTEM_BASE_TOKENS = 10400;
var TOOL_TOKENS_OVERHEAD = 400;
var SKILL_FRONTMATTER_TOKENS = 80;
function estimateTokens2(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN7);
}
async function readConfigFile(path) {
  if (!existsSync9(path)) return null;
  const raw = await readSessionFile(path);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function countMcpTools(projectPath) {
  const home = homedir34();
  const configPaths = [
    join38(home, ".claude", "settings.json"),
    join38(home, ".claude", "settings.local.json")
  ];
  if (projectPath) {
    configPaths.push(join38(projectPath, ".mcp.json"));
    configPaths.push(join38(projectPath, ".claude", "settings.json"));
    configPaths.push(join38(projectPath, ".claude", "settings.local.json"));
  }
  const servers = /* @__PURE__ */ new Set();
  let toolCount = 0;
  for (const p of configPaths) {
    const config = await readConfigFile(p);
    if (!config) continue;
    const mcpServers = config.mcpServers ?? {};
    for (const name of Object.keys(mcpServers)) {
      if (servers.has(name)) continue;
      servers.add(name);
      toolCount += 5;
    }
  }
  return toolCount;
}
async function countSkills(projectPath) {
  const dirs = [join38(homedir34(), ".claude", "skills")];
  if (projectPath) dirs.push(join38(projectPath, ".claude", "skills"));
  let count = 0;
  for (const dir of dirs) {
    if (!existsSync9(dir)) continue;
    try {
      const entries = await readdir21(dir);
      for (const entry of entries) {
        const skillFile = join38(dir, entry, "SKILL.md");
        if (existsSync9(skillFile)) count++;
      }
    } catch {
      continue;
    }
  }
  return count;
}
async function scanMemoryFiles(projectPath) {
  const home = homedir34();
  const files = [];
  const paths = [
    { path: join38(home, ".claude", "CLAUDE.md"), name: "~/.claude/CLAUDE.md" }
  ];
  if (projectPath) {
    paths.push({ path: join38(projectPath, "CLAUDE.md"), name: "CLAUDE.md" });
    paths.push({ path: join38(projectPath, ".claude", "CLAUDE.md"), name: ".claude/CLAUDE.md" });
    paths.push({ path: join38(projectPath, "CLAUDE.local.md"), name: "CLAUDE.local.md" });
  }
  for (const { path, name } of paths) {
    if (!existsSync9(path)) continue;
    const content = await readSessionFile(path);
    if (content === null) continue;
    files.push({ name, tokens: estimateTokens2(content) });
  }
  return files;
}
async function estimateContextBudget(projectPath, modelContext = 1e6) {
  const mcpToolCount = await countMcpTools(projectPath);
  const skillCount = await countSkills(projectPath);
  const memoryFiles = await scanMemoryFiles(projectPath);
  const mcpTokens = mcpToolCount * TOOL_TOKENS_OVERHEAD;
  const skillTokens = skillCount * SKILL_FRONTMATTER_TOKENS;
  const memoryTokens = memoryFiles.reduce((s, f) => s + f.tokens, 0);
  const total = SYSTEM_BASE_TOKENS + mcpTokens + skillTokens + memoryTokens;
  return {
    systemBase: SYSTEM_BASE_TOKENS,
    mcpTools: { count: mcpToolCount, tokens: mcpTokens },
    skills: { count: skillCount, tokens: skillTokens },
    memory: { count: memoryFiles.length, tokens: memoryTokens, files: memoryFiles },
    total,
    modelContext
  };
}

// src/compare.tsx
import React, { useState, useEffect, useRef } from "react";
import { render, Box, Text, useInput, useApp, useStdout } from "ink";

// src/compare-stats.ts
import { readdir as readdir22, readFile as readFile22 } from "fs/promises";
import { join as join39 } from "path";
var PLANNING_TOOLS = /* @__PURE__ */ new Set(["TaskCreate", "TaskUpdate", "TodoWrite", "EnterPlanMode", "ExitPlanMode"]);
function aggregateModelStats(projects) {
  const byModel = /* @__PURE__ */ new Map();
  const ensure = (model) => {
    let s = byModel.get(model);
    if (!s) {
      s = { model, calls: 0, cost: 0, outputTokens: 0, inputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, totalTurns: 0, editTurns: 0, oneShotTurns: 0, retries: 0, selfCorrections: 0, editCost: 0, firstSeen: "", lastSeen: "" };
      byModel.set(model, s);
    }
    return s;
  };
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (turn.assistantCalls.length === 0) continue;
        const primaryModel = turn.assistantCalls[0].model;
        if (primaryModel === "<synthetic>") continue;
        const ms = ensure(primaryModel);
        ms.totalTurns++;
        if (turn.hasEdits) {
          ms.editTurns++;
          if (turn.retries === 0) ms.oneShotTurns++;
          for (const c of turn.assistantCalls) {
            if (c.model !== "<synthetic>") ms.editCost += c.costUSD;
          }
        }
        ms.retries += turn.retries;
        for (const call of turn.assistantCalls) {
          if (call.model === "<synthetic>") continue;
          const cs = call.model === primaryModel ? ms : ensure(call.model);
          cs.calls++;
          cs.cost += call.costUSD;
          cs.outputTokens += call.usage.outputTokens;
          cs.inputTokens += call.usage.inputTokens;
          cs.cacheReadTokens += call.usage.cacheReadInputTokens;
          cs.cacheWriteTokens += call.usage.cacheCreationInputTokens;
          if (!cs.firstSeen || call.timestamp < cs.firstSeen) cs.firstSeen = call.timestamp;
          if (!cs.lastSeen || call.timestamp > cs.lastSeen) cs.lastSeen = call.timestamp;
        }
      }
    }
  }
  return [...byModel.values()].sort((a, b) => b.cost - a.cost);
}
var METRICS = [
  {
    section: "Performance",
    label: "One-shot rate",
    formatFn: "percent",
    higherIsBetter: true,
    compute: (s) => s.editTurns > 0 ? s.oneShotTurns / s.editTurns * 100 : null
  },
  {
    section: "Performance",
    label: "Retry rate",
    formatFn: "decimal",
    higherIsBetter: false,
    compute: (s) => s.editTurns > 0 ? s.retries / s.editTurns : null
  },
  {
    section: "Performance",
    label: "Self-correction",
    formatFn: "percent",
    higherIsBetter: false,
    compute: (s) => s.totalTurns > 0 ? s.selfCorrections / s.totalTurns * 100 : null
  },
  {
    section: "Efficiency",
    label: "Cost / call",
    formatFn: "cost",
    higherIsBetter: false,
    compute: (s) => s.calls > 0 ? s.cost / s.calls : null
  },
  {
    section: "Efficiency",
    label: "Cost / edit",
    formatFn: "cost",
    higherIsBetter: false,
    compute: (s) => s.editTurns > 0 ? s.editCost / s.editTurns : null
  },
  {
    section: "Efficiency",
    label: "Output tok / call",
    formatFn: "number",
    higherIsBetter: false,
    compute: (s) => s.calls > 0 ? Math.round(s.outputTokens / s.calls) : null
  },
  {
    section: "Efficiency",
    label: "Cache hit rate",
    formatFn: "percent",
    higherIsBetter: true,
    compute: (s) => {
      const total = s.inputTokens + s.cacheReadTokens + s.cacheWriteTokens;
      return total > 0 ? s.cacheReadTokens / total * 100 : null;
    }
  }
];
function pickWinner(valueA, valueB, higherIsBetter) {
  if (valueA === null || valueB === null) return "none";
  if (valueA === valueB) return "tie";
  if (higherIsBetter) return valueA > valueB ? "a" : "b";
  return valueA < valueB ? "a" : "b";
}
function computeComparison(a, b) {
  return METRICS.map((m) => {
    const valueA = m.compute(a);
    const valueB = m.compute(b);
    return {
      section: m.section,
      label: m.label,
      valueA,
      valueB,
      formatFn: m.formatFn,
      winner: pickWinner(valueA, valueB, m.higherIsBetter)
    };
  });
}
function computeCategoryComparison(projects, modelA, modelB) {
  const mapA = /* @__PURE__ */ new Map();
  const mapB = /* @__PURE__ */ new Map();
  const ensure = (map, cat) => {
    let a = map.get(cat);
    if (!a) {
      a = { turns: 0, editTurns: 0, oneShotTurns: 0 };
      map.set(cat, a);
    }
    return a;
  };
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (turn.assistantCalls.length === 0) continue;
        const primary = turn.assistantCalls[0].model;
        if (primary !== modelA && primary !== modelB) continue;
        const acc = ensure(primary === modelA ? mapA : mapB, turn.category);
        acc.turns++;
        if (turn.hasEdits) {
          acc.editTurns++;
          if (turn.retries === 0) acc.oneShotTurns++;
        }
      }
    }
  }
  const allCats = /* @__PURE__ */ new Set([...mapA.keys(), ...mapB.keys()]);
  const result = [];
  for (const category of allCats) {
    const a = mapA.get(category);
    const b = mapB.get(category);
    if ((!a || a.editTurns === 0) && (!b || b.editTurns === 0)) continue;
    const rateA = a && a.editTurns > 0 ? a.oneShotTurns / a.editTurns * 100 : null;
    const rateB = b && b.editTurns > 0 ? b.oneShotTurns / b.editTurns * 100 : null;
    result.push({
      category,
      turnsA: a?.turns ?? 0,
      editTurnsA: a?.editTurns ?? 0,
      oneShotRateA: rateA,
      turnsB: b?.turns ?? 0,
      editTurnsB: b?.editTurns ?? 0,
      oneShotRateB: rateB,
      winner: pickWinner(rateA, rateB, true)
    });
  }
  return result.sort((a, b) => b.turnsA + b.turnsB - (a.turnsA + a.turnsB));
}
function computeWorkingStyle(projects, modelA, modelB) {
  const sA = { totalTurns: 0, agentSpawns: 0, planModeUses: 0, totalToolCalls: 0, fastModeCalls: 0 };
  const sB = { totalTurns: 0, agentSpawns: 0, planModeUses: 0, totalToolCalls: 0, fastModeCalls: 0 };
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (turn.assistantCalls.length === 0) continue;
        const primary = turn.assistantCalls[0].model;
        if (primary !== modelA && primary !== modelB) continue;
        const s = primary === modelA ? sA : sB;
        s.totalTurns++;
        const turnTools = turn.assistantCalls.flatMap((c) => c.tools);
        if (turnTools.some((t) => PLANNING_TOOLS.has(t)) || turn.assistantCalls.some((c) => c.hasPlanMode)) {
          s.planModeUses++;
        }
        for (const call of turn.assistantCalls) {
          s.totalToolCalls += call.tools.length;
          if (call.hasAgentSpawn) s.agentSpawns++;
          if (call.speed === "fast") s.fastModeCalls++;
        }
      }
    }
  }
  const pct2 = (num, den) => den > 0 ? num / den * 100 : null;
  const avg = (num, den) => den > 0 ? num / den : null;
  return [
    { label: "Delegation rate", valueA: pct2(sA.agentSpawns, sA.totalTurns), valueB: pct2(sB.agentSpawns, sB.totalTurns), formatFn: "percent" },
    { label: "Planning rate", valueA: pct2(sA.planModeUses, sA.totalTurns), valueB: pct2(sB.planModeUses, sB.totalTurns), formatFn: "percent" },
    { label: "Avg tools / turn", valueA: avg(sA.totalToolCalls, sA.totalTurns), valueB: avg(sB.totalToolCalls, sB.totalTurns), formatFn: "decimal" },
    { label: "Fast mode usage", valueA: pct2(sA.fastModeCalls, sA.totalTurns), valueB: pct2(sB.fastModeCalls, sB.totalTurns), formatFn: "percent" }
  ];
}
var SELF_CORRECTION_PATTERNS = [
  /\bmy mistake\b/i,
  /\bmy bad\b/i,
  /\bmy apolog/i,
  /\bI apologize\b/i,
  /\bI was wrong\b/i,
  /\bI was incorrect\b/i,
  /\bI made (a |an )?(error|mistake)\b/i,
  /\bI incorrectly\b/i,
  /\bI mistakenly\b/i,
  /\bthat was (incorrect|wrong|an error)\b/i,
  /\blet me correct that\b/i,
  /\bI need to correct\b/i,
  /\byou're right[.,]? I/i,
  /\bsorry about that\b/i
];
function extractText2(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((b) => b !== null && typeof b === "object" && b.type === "text" && typeof b.text === "string").map((b) => b.text).join(" ");
}
function isCompactFile(name) {
  return name.includes("compact");
}
async function collectJsonlFiles3(sessionDir) {
  const entries = await readdir22(sessionDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".jsonl") && !isCompactFile(entry.name)) {
      files.push(join39(sessionDir, entry.name));
    } else if (entry.isDirectory() && entry.name === "subagents") {
      const subEntries = await readdir22(join39(sessionDir, entry.name), { withFileTypes: true });
      for (const sub of subEntries) {
        if (sub.isFile() && sub.name.endsWith(".jsonl") && !isCompactFile(sub.name)) {
          files.push(join39(sessionDir, entry.name, sub.name));
        }
      }
    }
  }
  return files;
}
async function scanSelfCorrections(projectDirs) {
  const counts = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const dir of projectDirs) {
    let entries;
    try {
      entries = await readdir22(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const allFiles = [];
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".jsonl") && !isCompactFile(entry.name)) {
        allFiles.push(join39(dir, entry.name));
      } else if (entry.isDirectory()) {
        try {
          const sessionFiles = await collectJsonlFiles3(join39(dir, entry.name));
          allFiles.push(...sessionFiles);
        } catch {
          continue;
        }
      }
    }
    for (const file of allFiles) {
      let raw;
      try {
        raw = await readFile22(file, "utf8");
      } catch {
        continue;
      }
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let parsed;
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          continue;
        }
        const rec = parsed;
        if (!rec || typeof rec !== "object" || rec["type"] !== "assistant") continue;
        const ts = rec["timestamp"];
        const msg = rec["message"];
        if (msg === null || typeof msg !== "object") continue;
        const msgRec = msg;
        const model = msgRec["model"];
        if (typeof model !== "string" || model === "<synthetic>") continue;
        const dedupeKey = `${model}:${ts}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        const text = extractText2(msgRec["content"]);
        if (SELF_CORRECTION_PATTERNS.some((p) => p.test(text))) {
          counts.set(model, (counts.get(model) ?? 0) + 1);
        }
      }
    }
  }
  return counts;
}

// src/compare.tsx
init_format();
init_parser();
init_providers();

// src/ink-win.ts
var BSU = "\x1B[?2026h";
var ESU = "\x1B[?2026l";
var patched = false;
function patchStdoutForWindows() {
  if (process.platform !== "win32" || patched) return;
  patched = true;
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function(chunk, ...args) {
    if (chunk === BSU || chunk === ESU) return true;
    return origWrite(chunk, ...args);
  };
}

// src/compare.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var ORANGE2 = "#FF8C42";
var GREEN2 = "#5BF5A0";
var DIM2 = "#888888";
var GOLD2 = "#FFD700";
var BAR_A = "#6495ED";
var BAR_B = "#5BF5A0";
var LOW_DATA_THRESHOLD = 20;
var LABEL_WIDTH = 20;
var VALUE_WIDTH = 14;
var MODEL_NAME_COL = 24;
var BAR_MAX_WIDTH = 30;
var MIN_WIDE = 90;
var MS_PER_DAY2 = 24 * 60 * 60 * 1e3;
var FULL_BLOCK = "\u2588";
function formatValue(value, fmt) {
  if (value === null) return "-";
  switch (fmt) {
    case "cost":
      return formatCost(value);
    case "number":
      return Math.round(value).toLocaleString();
    case "percent":
      return `${value.toFixed(1)}%`;
    case "decimal":
      return value.toFixed(2);
  }
}
function shortName(model) {
  return model.replace(/^claude-/, "").replace(/-\d{8}$/, "");
}
function daysOfData(first, last) {
  if (!first || !last) return 0;
  const ms = new Date(last).getTime() - new Date(first).getTime();
  return Math.max(1, Math.ceil(ms / MS_PER_DAY2));
}
function barWidth(rate2) {
  return Math.round(rate2 / 100 * BAR_MAX_WIDTH);
}
function ModelSelector({ models, onSelect, onBack }) {
  const { exit } = useApp();
  const [cursor2, setCursor] = useState(0);
  const [selected, setSelected] = useState(/* @__PURE__ */ new Set());
  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
    if (key.upArrow) {
      setCursor((c) => (c - 1 + models.length) % models.length);
      return;
    }
    if (key.downArrow) {
      setCursor((c) => (c + 1) % models.length);
      return;
    }
    if (input === " ") {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(cursor2)) {
          next.delete(cursor2);
        } else if (next.size < 2) {
          next.add(cursor2);
        }
        return next;
      });
      return;
    }
    if (key.return && selected.size === 2) {
      const indices = [...selected].sort((a, b) => a - b);
      onSelect(models[indices[0]], models[indices[1]]);
    }
  });
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE2, paddingX: 1, children: [
      /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: "Model Comparison" }),
      /* @__PURE__ */ jsx(Text, { children: " " }),
      /* @__PURE__ */ jsx(Text, { color: DIM2, children: "Select two models to compare:" }),
      /* @__PURE__ */ jsx(Text, { children: " " }),
      models.map((m, i) => {
        const isCursor = i === cursor2;
        const isSelected = selected.has(i);
        const lowData = m.calls < LOW_DATA_THRESHOLD;
        const prefix = isCursor ? "> " : "  ";
        return /* @__PURE__ */ jsxs(Text, { children: [
          /* @__PURE__ */ jsx(Text, { color: isCursor ? ORANGE2 : void 0, children: prefix }),
          /* @__PURE__ */ jsx(Text, { bold: isSelected, color: isSelected ? GREEN2 : void 0, children: shortName(m.model).padEnd(MODEL_NAME_COL) }),
          /* @__PURE__ */ jsxs(Text, { children: [
            m.calls.toLocaleString().padStart(8),
            " calls"
          ] }),
          /* @__PURE__ */ jsx(Text, { color: GOLD2, children: formatCost(m.cost).padStart(10) }),
          isSelected && /* @__PURE__ */ jsx(Text, { color: GREEN2, children: "   [selected]" }),
          lowData && /* @__PURE__ */ jsx(Text, { color: DIM2, children: "   low data" })
        ] }, m.model);
      })
    ] }),
    /* @__PURE__ */ jsx(Text, { children: " " }),
    /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[space]" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " select  " }),
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[enter]" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " compare  " }),
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "<>" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " switch period  " }),
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[esc]" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " back  " }),
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[q]" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " quit" })
    ] })
  ] });
}
function MetricPanel({ title, rows, nameA, nameB, pw }) {
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE2, paddingX: 1, width: pw, children: [
    /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: title }),
    /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { children: "".padEnd(LABEL_WIDTH) }),
      /* @__PURE__ */ jsx(Text, { bold: true, children: nameA.padStart(VALUE_WIDTH) }),
      /* @__PURE__ */ jsx(Text, { bold: true, children: nameB.padStart(VALUE_WIDTH) })
    ] }),
    rows.map((row) => {
      const fmtA = formatValue(row.valueA, row.formatFn);
      const fmtB = formatValue(row.valueB, row.formatFn);
      return /* @__PURE__ */ jsxs(Text, { children: [
        /* @__PURE__ */ jsx(Text, { color: DIM2, children: row.label.padEnd(LABEL_WIDTH) }),
        /* @__PURE__ */ jsx(Text, { color: row.winner === "a" ? GREEN2 : void 0, children: fmtA.padStart(VALUE_WIDTH) }),
        /* @__PURE__ */ jsx(Text, { color: row.winner === "b" ? GREEN2 : void 0, children: fmtB.padStart(VALUE_WIDTH) })
      ] }, row.label);
    })
  ] });
}
function ContextPanel({ title, rows, nameA, nameB, pw, lowDataWarning }) {
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE2, paddingX: 1, width: pw, children: [
    /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: title }),
    /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { children: "".padEnd(LABEL_WIDTH) }),
      /* @__PURE__ */ jsx(Text, { bold: true, children: nameA.padStart(VALUE_WIDTH) }),
      /* @__PURE__ */ jsx(Text, { bold: true, children: nameB.padStart(VALUE_WIDTH) })
    ] }),
    rows.map((row) => /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { color: DIM2, children: row.label.padEnd(LABEL_WIDTH) }),
      /* @__PURE__ */ jsx(Text, { color: DIM2, children: row.valueA.padStart(VALUE_WIDTH) }),
      /* @__PURE__ */ jsx(Text, { color: DIM2, children: row.valueB.padStart(VALUE_WIDTH) })
    ] }, row.label)),
    lowDataWarning && /* @__PURE__ */ jsx(Text, { color: GOLD2, children: lowDataWarning })
  ] });
}
function ComparisonResults({ modelA, modelB, rows, categories, workingStyle, onBack }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termWidth = stdout?.columns || 80;
  const dashWidth = Math.min(160, termWidth);
  const wide = dashWidth >= MIN_WIDE;
  const halfWidth = wide ? Math.floor(dashWidth / 2) : dashWidth;
  const nameA = shortName(modelA.model);
  const nameB = shortName(modelB.model);
  const lowDataA = modelA.calls < LOW_DATA_THRESHOLD;
  const lowDataB = modelB.calls < LOW_DATA_THRESHOLD;
  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }
    if (key.escape) {
      onBack();
      return;
    }
  });
  const sectionOrder = [];
  const sectionRows = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!sectionRows.has(row.section)) {
      sectionOrder.push(row.section);
      sectionRows.set(row.section, []);
    }
    sectionRows.get(row.section).push(row);
  }
  const fmtTokens = (n) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  };
  const contextRows = [
    { label: "Calls", valueA: modelA.calls.toLocaleString(), valueB: modelB.calls.toLocaleString() },
    { label: "Total cost", valueA: formatCost(modelA.cost), valueB: formatCost(modelB.cost) },
    { label: "Input tokens", valueA: fmtTokens(modelA.inputTokens), valueB: fmtTokens(modelB.inputTokens) },
    { label: "Output tokens", valueA: fmtTokens(modelA.outputTokens), valueB: fmtTokens(modelB.outputTokens) },
    { label: "Days of data", valueA: String(daysOfData(modelA.firstSeen, modelA.lastSeen)), valueB: String(daysOfData(modelB.firstSeen, modelB.lastSeen)) },
    { label: "Edit turns", valueA: modelA.editTurns.toLocaleString(), valueB: modelB.editTurns.toLocaleString() },
    { label: "Self-corrections", valueA: modelA.selfCorrections.toLocaleString(), valueB: modelB.selfCorrections.toLocaleString() }
  ];
  const lowDataWarning = lowDataA || lowDataB ? `Note: ${[lowDataA && shortName(modelA.model), lowDataB && shortName(modelB.model)].filter(Boolean).join(" and ")} ha${lowDataA && lowDataB ? "ve" : "s"} fewer than ${LOW_DATA_THRESHOLD} calls` : void 0;
  const pw = wide ? halfWidth : dashWidth;
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
    /* @__PURE__ */ jsx(Box, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE2, paddingX: 1, width: dashWidth, children: /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: nameA }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: "  vs  " }),
      /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: nameB })
    ] }) }),
    /* @__PURE__ */ jsxs(Box, { width: dashWidth, children: [
      /* @__PURE__ */ jsx(MetricPanel, { title: sectionOrder[0] ?? "Performance", rows: sectionRows.get(sectionOrder[0] ?? "") ?? [], nameA, nameB, pw }),
      /* @__PURE__ */ jsx(MetricPanel, { title: sectionOrder[1] ?? "Efficiency", rows: sectionRows.get(sectionOrder[1] ?? "") ?? [], nameA, nameB, pw })
    ] }),
    categories.length > 0 && /* @__PURE__ */ jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE2, paddingX: 1, width: dashWidth, children: [
      /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: "Category Head-to-Head" }),
      /* @__PURE__ */ jsx(Text, { color: DIM2, children: "one-shot rate per category" }),
      /* @__PURE__ */ jsxs(Text, { children: [
        /* @__PURE__ */ jsx(Text, { children: "  " }),
        /* @__PURE__ */ jsx(Text, { color: BAR_A, children: FULL_BLOCK + FULL_BLOCK }),
        /* @__PURE__ */ jsxs(Text, { children: [
          " ",
          nameA,
          "    "
        ] }),
        /* @__PURE__ */ jsx(Text, { color: BAR_B, children: FULL_BLOCK + FULL_BLOCK }),
        /* @__PURE__ */ jsxs(Text, { children: [
          " ",
          nameB
        ] })
      ] }),
      categories.map((cat) => {
        const bwA = cat.oneShotRateA !== null ? barWidth(cat.oneShotRateA) : 0;
        const bwB = cat.oneShotRateB !== null ? barWidth(cat.oneShotRateB) : 0;
        const rateA = cat.oneShotRateA !== null ? `${cat.oneShotRateA.toFixed(1)}%` : "-";
        const rateB = cat.oneShotRateB !== null ? `${cat.oneShotRateB.toFixed(1)}%` : "-";
        const turnsA = cat.editTurnsA > 0 ? `(${cat.editTurnsA})` : "";
        const turnsB = cat.editTurnsB > 0 ? `(${cat.editTurnsB})` : "";
        return /* @__PURE__ */ jsxs(React.Fragment, { children: [
          /* @__PURE__ */ jsx(Text, { children: " " }),
          /* @__PURE__ */ jsxs(Text, { color: DIM2, children: [
            "  ",
            cat.category
          ] }),
          /* @__PURE__ */ jsxs(Text, { children: [
            /* @__PURE__ */ jsx(Text, { children: "  " }),
            /* @__PURE__ */ jsx(Text, { color: BAR_A, children: FULL_BLOCK.repeat(Math.max(bwA, 1)) }),
            /* @__PURE__ */ jsxs(Text, { children: [
              " ".repeat(Math.max(0, BAR_MAX_WIDTH - bwA)),
              " "
            ] }),
            /* @__PURE__ */ jsx(Text, { color: cat.winner === "a" ? GREEN2 : void 0, children: rateA.padStart(6) }),
            /* @__PURE__ */ jsxs(Text, { color: DIM2, children: [
              " ",
              turnsA
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Text, { children: [
            /* @__PURE__ */ jsx(Text, { children: "  " }),
            /* @__PURE__ */ jsx(Text, { color: BAR_B, children: FULL_BLOCK.repeat(Math.max(bwB, 1)) }),
            /* @__PURE__ */ jsxs(Text, { children: [
              " ".repeat(Math.max(0, BAR_MAX_WIDTH - bwB)),
              " "
            ] }),
            /* @__PURE__ */ jsx(Text, { color: cat.winner === "b" ? GREEN2 : void 0, children: rateB.padStart(6) }),
            /* @__PURE__ */ jsxs(Text, { color: DIM2, children: [
              " ",
              turnsB
            ] })
          ] })
        ] }, cat.category);
      })
    ] }),
    /* @__PURE__ */ jsxs(Box, { width: dashWidth, children: [
      workingStyle.length > 0 && /* @__PURE__ */ jsx(ContextPanel, { title: "Working Style", rows: workingStyle.map((r) => ({ label: r.label, valueA: formatValue(r.valueA, r.formatFn), valueB: formatValue(r.valueB, r.formatFn) })), nameA, nameB, pw }),
      /* @__PURE__ */ jsx(ContextPanel, { title: "Context", rows: contextRows, nameA, nameB, pw, lowDataWarning })
    ] }),
    /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "<>" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " switch period  " }),
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[esc]" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " back  " }),
      /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[q]" }),
      /* @__PURE__ */ jsx(Text, { dimColor: true, children: " quit" })
    ] })
  ] });
}
function CompareView({ projects, onBack }) {
  const { exit } = useApp();
  const [phase, setPhase] = useState("select");
  const [models, setModels] = useState(() => aggregateModelStats(projects));
  const [pickedNames, setPickedNames] = useState(null);
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [style, setStyle] = useState([]);
  const [loadTrigger, setLoadTrigger] = useState(0);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  useEffect(() => {
    const newModels = aggregateModelStats(projects);
    setModels(newModels);
    if (!pickedNames) return;
    const hasA = newModels.some((m) => m.model === pickedNames[0]);
    const hasB = newModels.some((m) => m.model === pickedNames[1]);
    if (!hasA || !hasB) {
      setPickedNames(null);
      setPhase("select");
      return;
    }
    if (phase === "results") {
      const a = newModels.find((m) => m.model === pickedNames[0]);
      const b = newModels.find((m) => m.model === pickedNames[1]);
      if (!a || !b) return;
      const aCopy = { ...a, selfCorrections: selectedA?.selfCorrections ?? 0 };
      const bCopy = { ...b, selfCorrections: selectedB?.selfCorrections ?? 0 };
      setSelectedA(aCopy);
      setSelectedB(bCopy);
      setRows(computeComparison(aCopy, bCopy));
      setCategories(computeCategoryComparison(projects, a.model, b.model));
      setStyle(computeWorkingStyle(projects, a.model, b.model));
      return;
    }
    setLoadTrigger((t) => t + 1);
  }, [projects]);
  useEffect(() => {
    if (loadTrigger === 0 || !pickedNames) return;
    let cancelled = false;
    setPhase("loading");
    const currentModels = aggregateModelStats(projectsRef.current);
    const a = currentModels.find((m) => m.model === pickedNames[0]);
    const b = currentModels.find((m) => m.model === pickedNames[1]);
    if (!a || !b) {
      setPhase("select");
      return;
    }
    async function run() {
      const providers = await getAllProviders();
      const dirs = [];
      for (const p of providers) {
        const sessions = await p.discoverSessions();
        for (const s of sessions) dirs.push(s.path);
      }
      const corrections = await scanSelfCorrections(dirs);
      if (cancelled) return;
      const currentProjects = projectsRef.current;
      const aCopy = { ...a, selfCorrections: corrections.get(a.model) ?? 0 };
      const bCopy = { ...b, selfCorrections: corrections.get(b.model) ?? 0 };
      setSelectedA(aCopy);
      setSelectedB(bCopy);
      setRows(computeComparison(aCopy, bCopy));
      setCategories(computeCategoryComparison(currentProjects, a.model, b.model));
      setStyle(computeWorkingStyle(currentProjects, a.model, b.model));
      setPhase("results");
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [loadTrigger]);
  useInput((input, key) => {
    if (phase !== "select") return;
    if (models.length < 2) {
      if (input === "q") {
        exit();
        return;
      }
      if (key.escape) {
        onBack();
        return;
      }
    }
  });
  if (models.length < 2) {
    return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [
      /* @__PURE__ */ jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE2, paddingX: 1, children: [
        /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: "Model Comparison" }),
        /* @__PURE__ */ jsx(Text, { children: " " }),
        /* @__PURE__ */ jsxs(Text, { color: DIM2, children: [
          "Need at least 2 models to compare. Found ",
          models.length,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Text, { children: " " }),
      /* @__PURE__ */ jsxs(Text, { children: [
        /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[esc]" }),
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: " back  " }),
        /* @__PURE__ */ jsx(Text, { color: ORANGE2, bold: true, children: "[q]" }),
        /* @__PURE__ */ jsx(Text, { dimColor: true, children: " quit" })
      ] })
    ] });
  }
  const handleSelect = (a, b) => {
    setPickedNames([a.model, b.model]);
    setLoadTrigger((t) => t + 1);
  };
  if (phase === "loading") {
    return /* @__PURE__ */ jsx(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: /* @__PURE__ */ jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE2, paddingX: 1, children: [
      /* @__PURE__ */ jsx(Text, { bold: true, color: ORANGE2, children: "Model Comparison" }),
      /* @__PURE__ */ jsx(Text, { children: " " }),
      /* @__PURE__ */ jsx(Text, { color: DIM2, children: "Scanning self-corrections..." })
    ] }) });
  }
  if (phase === "results" && selectedA && selectedB) {
    return /* @__PURE__ */ jsx(
      ComparisonResults,
      {
        modelA: selectedA,
        modelB: selectedB,
        rows,
        categories,
        workingStyle: style,
        onBack: () => setPhase("select")
      }
    );
  }
  return /* @__PURE__ */ jsx(
    ModelSelector,
    {
      models,
      onSelect: handleSelect,
      onBack
    }
  );
}
async function renderCompare(range, provider) {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  if (!isTTY) {
    process.stdout.write("Model comparison requires an interactive terminal.\n");
    return;
  }
  patchStdoutForWindows();
  const projects = await parseAllSessions(range, provider);
  const { waitUntilExit } = render(
    /* @__PURE__ */ jsx(CompareView, { projects, onBack: () => process.exit(0) })
  );
  await waitUntilExit();
}

// src/plan-usage.ts
init_config();
init_parser();
init_plans();
var MS_PER_DAY3 = 24 * 60 * 60 * 1e3;
var PLAN_NEAR_THRESHOLD_PCT = 80;
function clampResetDay(resetDay) {
  if (!Number.isInteger(resetDay)) return 1;
  return Math.min(28, Math.max(1, resetDay ?? 1));
}
function computePeriodFromResetDay(resetDay, today) {
  const day = clampResetDay(resetDay);
  const year = today.getFullYear();
  const month = today.getMonth();
  if (today.getDate() >= day) {
    return {
      periodStart: new Date(year, month, day, 0, 0, 0, 0),
      periodEnd: new Date(year, month + 1, day, 0, 0, 0, 0)
    };
  }
  return {
    periodStart: new Date(year, month - 1, day, 0, 0, 0, 0),
    periodEnd: new Date(year, month, day, 0, 0, 0, 0)
  };
}
function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}
function toLocalDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function toDayIndex(d) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY3);
}
function diffCalendarDays(from, to) {
  return toDayIndex(to) - toDayIndex(from);
}
function projectMonthEnd(projects, periodStart, periodEnd, today, spent) {
  const dayCosts = /* @__PURE__ */ new Map();
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        for (const call of turn.assistantCalls) {
          const timestamp = call.timestamp || turn.timestamp;
          if (!timestamp) continue;
          const ts = new Date(timestamp);
          if (Number.isNaN(ts.getTime())) continue;
          if (ts < periodStart || ts > today) continue;
          const dayKey = toLocalDateKey(ts);
          dayCosts.set(dayKey, (dayCosts.get(dayKey) ?? 0) + call.costUSD);
        }
      }
    }
  }
  const elapsedDays = Math.max(1, diffCalendarDays(periodStart, today) + 1);
  const elapsedDailyCosts = [];
  for (let i = 0; i < elapsedDays; i++) {
    const date = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + i);
    elapsedDailyCosts.push(dayCosts.get(toLocalDateKey(date)) ?? 0);
  }
  const trailingWindow = elapsedDailyCosts.slice(-7);
  const medianDailyCost = median(trailingWindow);
  const daysRemaining = Math.max(0, diffCalendarDays(today, periodEnd) - 1);
  return spent + medianDailyCost * daysRemaining;
}
function getPlanUsageFromProjects(plan, projects, today = /* @__PURE__ */ new Date()) {
  const { periodStart, periodEnd } = computePeriodFromResetDay(plan.resetDay, today);
  const spent = projects.reduce((sum, p) => sum + p.totalCostUSD, 0);
  const budgetUsd = plan.monthlyUsd;
  const percentUsed = budgetUsd > 0 ? spent / budgetUsd * 100 : 0;
  const status = percentUsed > 100 ? "over" : percentUsed >= PLAN_NEAR_THRESHOLD_PCT ? "near" : "under";
  const projectedMonthUsd = projectMonthEnd(projects, periodStart, periodEnd, today, spent);
  const daysUntilReset = Math.max(0, diffCalendarDays(today, periodEnd));
  return {
    plan,
    periodStart,
    periodEnd,
    spentApiEquivalentUsd: spent,
    budgetUsd,
    percentUsed,
    status,
    projectedMonthUsd,
    daysUntilReset
  };
}
function getPlanScopedProjects(plan, projects, today) {
  const { periodStart } = computePeriodFromResetDay(plan.resetDay, today);
  const provider = plan.provider;
  return projects.map((project) => {
    const sessions = project.sessions.map((session) => {
      const turns = session.turns.map((turn) => {
        const assistantCalls = turn.assistantCalls.filter((call) => {
          if (provider !== "all" && call.provider !== provider) return false;
          const timestamp = call.timestamp || turn.timestamp;
          if (!timestamp) return false;
          const ts = new Date(timestamp);
          return !Number.isNaN(ts.getTime()) && ts >= periodStart && ts <= today;
        });
        return assistantCalls.length > 0 ? { ...turn, assistantCalls } : null;
      }).filter((turn) => turn !== null);
      const totalCostUSD2 = turns.reduce(
        (sum, turn) => sum + turn.assistantCalls.reduce((turnSum, call) => turnSum + call.costUSD, 0),
        0
      );
      const apiCalls = turns.reduce((sum, turn) => sum + turn.assistantCalls.length, 0);
      return apiCalls > 0 ? { ...session, turns, totalCostUSD: totalCostUSD2, apiCalls } : null;
    }).filter((session) => session !== null);
    const totalCostUSD = sessions.reduce((sum, session) => sum + session.totalCostUSD, 0);
    const totalApiCalls = sessions.reduce((sum, session) => sum + session.apiCalls, 0);
    return totalApiCalls > 0 ? { ...project, sessions, totalCostUSD, totalApiCalls } : null;
  }).filter((project) => project !== null);
}
function activePlansFromMap(plans) {
  return PLAN_PROVIDERS.map((provider) => plans[provider]).filter(isActivePlan);
}
async function getPlanUsages(today = /* @__PURE__ */ new Date()) {
  const plans = activePlansFromMap(await readPlans());
  if (plans.length === 0) return [];
  const starts = plans.map((plan) => computePeriodFromResetDay(plan.resetDay, today).periodStart.getTime());
  const range = {
    start: new Date(Math.min(...starts)),
    end: today
  };
  if (plans.length === 1) {
    const plan = plans[0];
    const projects2 = await parseAllSessions(range, plan.provider);
    return [getPlanUsageFromProjects(plan, projects2, today)];
  }
  const projects = await parseAllSessions(range, "all");
  return plans.map((plan) => getPlanUsageFromProjects(plan, getPlanScopedProjects(plan, projects, today), today));
}
function isActivePlan(plan) {
  return plan !== void 0 && plan.id !== "none" && Number.isFinite(plan.monthlyUsd) && plan.monthlyUsd > 0;
}

// src/dashboard.tsx
init_plans();

// src/cli-date.ts
var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var END_OF_DAY_HOURS = 23;
var END_OF_DAY_MINUTES = 59;
var END_OF_DAY_SECONDS = 59;
var END_OF_DAY_MS = 999;
var ALL_TIME_MONTHS = 6;
var PERIODS = ["today", "week", "30days", "month", "all"];
var PERIOD_LABELS = {
  today: "Today",
  week: "7 Days",
  "30days": "30 Days",
  month: "This Month",
  all: "6 Months"
};
var VALID_PERIODS = ["today", "week", "30days", "month", "all"];
function toPeriod(s) {
  if (VALID_PERIODS.includes(s)) return s;
  process.stderr.write(
    `codeburn: unknown period "${s}". Valid values: ${VALID_PERIODS.join(", ")}.
`
  );
  process.exit(1);
}
function parseLocalDate(s) {
  if (!ISO_DATE_RE.test(s)) {
    throw new Error(`Invalid date format "${s}": expected YYYY-MM-DD`);
  }
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    throw new Error(`Invalid date "${s}": ${m}/${d}/${y} is not a real calendar date`);
  }
  return date;
}
function endOfLocalDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    END_OF_DAY_HOURS,
    END_OF_DAY_MINUTES,
    END_OF_DAY_SECONDS,
    END_OF_DAY_MS
  );
}
function dayRangeForDate(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { start, end: endOfLocalDay(start) };
}
function formatDayRangeLabel(day) {
  return `Day (${day})`;
}
function shiftDay(day, delta) {
  const date = parseLocalDate(day);
  return toDateString(new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta));
}
function parseDayFlag(day) {
  if (day === void 0) return null;
  const now = /* @__PURE__ */ new Date();
  let date;
  if (day === "today") {
    date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (day === "yesterday") {
    date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  } else {
    date = parseLocalDate(day);
  }
  const resolvedDay = toDateString(date);
  return { day: resolvedDay, range: dayRangeForDate(date), label: formatDayRangeLabel(resolvedDay) };
}
function parseDateRangeFlags(from, to) {
  if (from === void 0 && to === void 0) return null;
  const now = /* @__PURE__ */ new Date();
  const ALL_TIME_FALLBACK_MS = 6 * 31 * 24 * 60 * 60 * 1e3;
  const start = from !== void 0 ? parseLocalDate(from) : new Date(now.getTime() - ALL_TIME_FALLBACK_MS);
  const endDate = to !== void 0 ? parseLocalDate(to) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = endOfLocalDay(endDate);
  if (start > end) {
    throw new Error(`--from must not be after --to (got ${from} > ${to})`);
  }
  return { start, end };
}
function getDateRange(period) {
  const now = /* @__PURE__ */ new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    END_OF_DAY_HOURS,
    END_OF_DAY_MINUTES,
    END_OF_DAY_SECONDS,
    END_OF_DAY_MS
  );
  switch (period) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { range: dayRangeForDate(start), label: `Today (${toDateString(start)})` };
    }
    case "yesterday": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { range: dayRangeForDate(start), label: `Yesterday (${toDateString(start)})` };
    }
    case "week": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      return { range: { start, end }, label: "Last 7 Days" };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { range: { start, end }, label: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}` };
    }
    case "30days": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      return { range: { start, end }, label: "Last 30 Days" };
    }
    case "all": {
      const start = new Date(now.getFullYear(), now.getMonth() - ALL_TIME_MONTHS, 1);
      return { range: { start, end }, label: "Last 6 months" };
    }
    default: {
      process.stderr.write(
        `codeburn: unknown period "${period}". Valid values: today, week, 30days, month, all.
`
      );
      process.exit(1);
    }
  }
}
function parseDaysFlag(days) {
  if (days === void 0) return null;
  const list = days.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return null;
  const dates = list.map(parseLocalDate);
  const strings = dates.map(toDateString);
  const sorted = [...strings].sort();
  const startDate = parseLocalDate(sorted[0]);
  const endDate = parseLocalDate(sorted[sorted.length - 1]);
  return {
    days: new Set(sorted),
    range: { start: startDate, end: endOfLocalDay(endDate) },
    label: sorted.length === 1 ? sorted[0] : `${sorted.length} days (${sorted[0]} .. ${sorted[sorted.length - 1]})`
  };
}
function formatDateRangeLabel(from, to) {
  return `${from ?? "all"} to ${to ?? "today"}`;
}

// src/dashboard.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var MIN_WIDE2 = 90;
var ORANGE3 = "#FF8C42";
var DIM3 = "#555555";
var GOLD3 = "#FFD700";
var PLAN_BAR_WIDTH = 10;
var HEAVY_PERIODS = /* @__PURE__ */ new Set(["30days", "month", "all"]);
var LANG_DISPLAY_NAMES = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  rust: "Rust",
  go: "Go",
  java: "Java",
  cpp: "C++",
  c: "C",
  csharp: "C#",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  sql: "SQL",
  shell: "Shell",
  shellscript: "Shell Script",
  bash: "Bash",
  typescriptreact: "TSX",
  javascriptreact: "JSX",
  markdown: "Markdown",
  dockerfile: "Dockerfile",
  toml: "TOML"
};
var PANEL_COLORS = {
  overview: "#FF8C42",
  daily: "#5B9EF5",
  project: "#5BF5A0",
  model: "#E05BF5",
  activity: "#F5C85B",
  tools: "#5BF5E0",
  mcp: "#F55BE0",
  bash: "#F5A05B",
  skills: "#7B68EE"
};
var PROVIDER_COLORS = {
  claude: "#FF8C42",
  codex: "#5BF5A0",
  cursor: "#00B4D8",
  "ibm-bob": "#0F62FE",
  opencode: "#A78BFA",
  pi: "#F472B6",
  kimi: "#B6E34A",
  all: "#FF8C42"
};
var CATEGORY_COLORS = {
  coding: "#5B9EF5",
  debugging: "#F55B5B",
  feature: "#5BF58C",
  refactoring: "#F5E05B",
  testing: "#E05BF5",
  exploration: "#5BF5E0",
  planning: "#7B9EF5",
  delegation: "#F5C85B",
  git: "#CCCCCC",
  "build/deploy": "#5BF5A0",
  conversation: "#888888",
  brainstorming: "#F55BE0",
  general: "#666666"
};
var IMPACT_PANEL_COLORS = { high: "#F55B5B", medium: ORANGE3, low: DIM3 };
function toHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}
function lerp(a, b, t) {
  return a + t * (b - a);
}
function gradientColor(pct2) {
  if (pct2 <= 0.33) {
    const t2 = pct2 / 0.33;
    return toHex(lerp(91, 245, t2), lerp(158, 200, t2), lerp(245, 91, t2));
  }
  if (pct2 <= 0.66) {
    const t2 = (pct2 - 0.33) / 0.33;
    return toHex(lerp(245, 255, t2), lerp(200, 140, t2), lerp(91, 66, t2));
  }
  const t = (pct2 - 0.66) / 0.34;
  return toHex(lerp(255, 245, t), lerp(140, 91, t), lerp(66, 91, t));
}
function getPeriodRange(period) {
  return getDateRange(period).range;
}
function getDayRange(day) {
  return parseDayFlag(day).range;
}
function isHeavyPeriod(period) {
  return HEAVY_PERIODS.has(period);
}
function nextTick() {
  return new Promise((resolve5) => setImmediate(resolve5));
}
function getLayout(columns) {
  const termWidth = columns || parseInt(process.env["COLUMNS"] ?? "") || 80;
  const dashWidth = Math.min(160, termWidth);
  const wide = dashWidth >= MIN_WIDE2;
  const halfWidth = wide ? Math.floor(dashWidth / 2) : dashWidth;
  const inner = halfWidth - 4;
  const barWidth2 = Math.max(6, Math.min(10, inner - 30));
  return { dashWidth, wide, halfWidth, barWidth: barWidth2 };
}
function HBar({ value, max, width }) {
  if (max === 0) return /* @__PURE__ */ jsx2(Text2, { color: DIM3, children: "\u2591".repeat(width) });
  const filled = Math.round(value / max * width);
  const fillChars = [];
  for (let i = 0; i < Math.min(filled, width); i++) {
    fillChars.push(/* @__PURE__ */ jsx2(Text2, { color: gradientColor(i / width), children: "\u2588" }, i));
  }
  return /* @__PURE__ */ jsxs2(Text2, { children: [
    fillChars,
    /* @__PURE__ */ jsx2(Text2, { color: "#333333", children: "\u2591".repeat(Math.max(width - filled, 0)) })
  ] });
}
function Panel({ title, color, children, width }) {
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", borderStyle: "round", borderColor: color, paddingX: 1, width, overflowX: "hidden", children: [
    /* @__PURE__ */ jsx2(Text2, { bold: true, color, children: title }),
    children
  ] });
}
function fit(s, n) {
  return s.length > n ? s.slice(0, n) : s.padEnd(n);
}
function renderPlanBar(percentUsed, width) {
  if (percentUsed <= 100) {
    const capped = Math.max(0, percentUsed);
    const filled = Math.round(capped / 100 * width);
    return `${"\u2593".repeat(filled)}${"\u2591".repeat(Math.max(0, width - filled))}`;
  }
  const factor = percentUsed / 100;
  const chevrons = Math.min(4, Math.max(1, Math.floor(Math.log10(factor)) + 1));
  return `${"\u2593".repeat(width)}${"\u25B6".repeat(chevrons)}`;
}
function planLabel(planUsage) {
  const name = planDisplayName(planUsage.plan.id);
  return planUsage.plan.id === "custom" ? `${name} (${planUsage.plan.provider})` : name;
}
function planColor(planUsage) {
  return planUsage.status === "over" ? "#F55B5B" : planUsage.status === "near" ? ORANGE3 : "#5BF58C";
}
function planStatusText(planUsage) {
  if (planUsage.status === "under") {
    return `Well within plan. Projected month: ${formatCost(planUsage.projectedMonthUsd)} (reset in ${planUsage.daysUntilReset} days).`;
  }
  if (planUsage.status === "near") {
    return `Approaching plan limit. Projected month: ${formatCost(planUsage.projectedMonthUsd)} (reset in ${planUsage.daysUntilReset} days).`;
  }
  return `${(planUsage.spentApiEquivalentUsd / Math.max(planUsage.budgetUsd, 1)).toFixed(1)}x your subscription value. Projected month: ${formatCost(planUsage.projectedMonthUsd)} (reset in ${planUsage.daysUntilReset} days).`;
}
function Overview({ projects, label, width, planUsages }) {
  const totalCost = projects.reduce((s, p) => s + p.totalCostUSD, 0);
  const totalCalls = projects.reduce((s, p) => s + p.totalApiCalls, 0);
  const totalSessions = projects.reduce((s, p) => s + p.sessions.length, 0);
  const allSessions = projects.flatMap((p) => p.sessions);
  const totalInput = allSessions.reduce((s, sess) => s + sess.totalInputTokens, 0);
  const totalOutput = allSessions.reduce((s, sess) => s + sess.totalOutputTokens, 0);
  const totalCacheRead = allSessions.reduce((s, sess) => s + sess.totalCacheReadTokens, 0);
  const totalCacheWrite = allSessions.reduce((s, sess) => s + sess.totalCacheWriteTokens, 0);
  const allInputTokens = totalInput + totalCacheRead + totalCacheWrite;
  const cacheHit = allInputTokens > 0 ? totalCacheRead / allInputTokens * 100 : 0;
  const activePlanUsages = planUsages ?? [];
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", borderStyle: "round", borderColor: PANEL_COLORS.overview, paddingX: 1, width, children: [
    /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
      /* @__PURE__ */ jsx2(Text2, { bold: true, color: ORANGE3, children: "CodeBurn" }),
      /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
        "  ",
        label
      ] })
    ] }),
    /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
      /* @__PURE__ */ jsx2(Text2, { bold: true, color: GOLD3, children: formatCost(totalCost) }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " cost   " }),
      /* @__PURE__ */ jsx2(Text2, { bold: true, children: totalCalls.toLocaleString() }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " calls   " }),
      /* @__PURE__ */ jsx2(Text2, { bold: true, children: String(totalSessions) }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " sessions   " }),
      /* @__PURE__ */ jsxs2(Text2, { bold: true, children: [
        cacheHit.toFixed(1),
        "%"
      ] }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " cache hit" })
    ] }),
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      formatTokens(totalInput),
      " in   ",
      formatTokens(totalOutput),
      " out   ",
      formatTokens(totalCacheRead),
      " cached   ",
      formatTokens(totalCacheWrite),
      " written"
    ] }),
    activePlanUsages.length > 0 && /* @__PURE__ */ jsx2(Fragment, { children: activePlanUsages.map((planUsage) => {
      const color = planColor(planUsage);
      return /* @__PURE__ */ jsxs2(React2.Fragment, { children: [
        /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
          /* @__PURE__ */ jsxs2(Text2, { color, children: [
            planLabel(planUsage),
            ": ",
            formatCost(planUsage.spentApiEquivalentUsd),
            " API-equivalent vs ",
            formatCost(planUsage.budgetUsd),
            " plan"
          ] }),
          /* @__PURE__ */ jsx2(Text2, { children: "  " }),
          /* @__PURE__ */ jsx2(Text2, { color, children: renderPlanBar(planUsage.percentUsed, PLAN_BAR_WIDTH) }),
          /* @__PURE__ */ jsx2(Text2, { children: " " }),
          /* @__PURE__ */ jsxs2(Text2, { bold: true, color, children: [
            planUsage.percentUsed.toFixed(1),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsx2(Text2, { dimColor: true, wrap: "truncate-end", children: planStatusText(planUsage) })
      ] }, planUsage.plan.provider);
    }) })
  ] });
}
function DailyActivity({ projects, days = 14, pw, bw }) {
  const dailyCosts = {};
  const dailyCalls = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const turn of session.turns) {
        if (!turn.timestamp) continue;
        const day = dateKey(turn.timestamp);
        dailyCosts[day] = (dailyCosts[day] ?? 0) + turn.assistantCalls.reduce((s, c) => s + c.costUSD, 0);
        dailyCalls[day] = (dailyCalls[day] ?? 0) + turn.assistantCalls.length;
      }
    }
  }
  const sortedDays = days !== void 0 ? Object.keys(dailyCosts).sort().slice(-days) : Object.keys(dailyCosts).sort();
  const maxCost = Math.max(...sortedDays.map((d) => dailyCosts[d] ?? 0));
  return /* @__PURE__ */ jsxs2(Panel, { title: "Daily Activity", color: PANEL_COLORS.daily, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(6 + bw),
      "cost".padStart(8),
      "calls".padStart(6)
    ] }),
    sortedDays.map((day) => /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
      /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
        day.slice(5),
        " "
      ] }),
      /* @__PURE__ */ jsx2(HBar, { value: dailyCosts[day] ?? 0, max: maxCost, width: bw }),
      /* @__PURE__ */ jsx2(Text2, { color: GOLD3, children: formatCost(dailyCosts[day] ?? 0).padStart(8) }),
      /* @__PURE__ */ jsx2(Text2, { children: String(dailyCalls[day] ?? 0).padStart(6) })
    ] }, day))
  ] });
}
var _home = homedir35();
var _homePrefix = _home.endsWith("/") ? _home : _home + "/";
function shortProject(absPath) {
  const normalized = absPath.replace(/\\/g, "/");
  let path;
  if (normalized === _home) path = "";
  else if (normalized.startsWith(_homePrefix)) path = normalized.slice(_homePrefix.length);
  else path = normalized;
  path = path.replace(/^\/+/, "");
  path = path.replace(/^private\/tmp\/[^/]+\/[^/]+\//, "").replace(/^private\/tmp\//, "").replace(/^tmp\//, "");
  if (!path) return "home";
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 3) return parts.join("/");
  return parts.slice(-3).join("/");
}
var PROJECT_COL_AVG = 7;
var PROJECT_COL_BASE_WIDTH = 30;
var PROJECT_COL_WITH_OVERHEAD_WIDTH = 40;
function ProjectBreakdown({ projects, pw, bw, budgets, rows = 14 }) {
  const maxCost = Math.max(...projects.map((p) => p.totalCostUSD));
  const hasBudgets = budgets && budgets.size > 0;
  const nw = Math.max(8, pw - bw - (hasBudgets ? PROJECT_COL_WITH_OVERHEAD_WIDTH : PROJECT_COL_BASE_WIDTH));
  return /* @__PURE__ */ jsxs2(Panel, { title: "By Project", color: PANEL_COLORS.project, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(bw + 1 + nw),
      "cost".padStart(8),
      "avg/s".padStart(PROJECT_COL_AVG),
      "sess".padStart(6),
      hasBudgets ? "overhead".padStart(10) : ""
    ] }),
    projects.slice(0, rows).map((project, i) => {
      const budget = budgets?.get(project.project);
      const avgCost = project.sessions.length > 0 ? formatCost(project.totalCostUSD / project.sessions.length) : "-";
      return /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
        /* @__PURE__ */ jsx2(HBar, { value: project.totalCostUSD, max: maxCost, width: bw }),
        /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
          " ",
          fit(shortProject(project.projectPath), nw)
        ] }),
        /* @__PURE__ */ jsx2(Text2, { color: GOLD3, children: formatCost(project.totalCostUSD).padStart(8) }),
        /* @__PURE__ */ jsx2(Text2, { color: GOLD3, children: avgCost.padStart(PROJECT_COL_AVG) }),
        /* @__PURE__ */ jsx2(Text2, { children: String(project.sessions.length).padStart(6) }),
        hasBudgets && /* @__PURE__ */ jsx2(Text2, { color: "#7B9EF5", children: (budget ? formatTokens(budget.total) : "-").padStart(10) })
      ] }, `${project.project}-${i}`);
    })
  ] });
}
var MODEL_COL_COST = 8;
var MODEL_COL_CACHE = 7;
var MODEL_COL_CALLS = 7;
var MODEL_COL_ONESHOT = 7;
var MODEL_NAME_WIDTH = 14;
var MIN_EDIT_TURNS_FOR_RATE = 5;
function ModelBreakdown({ projects, pw, bw }) {
  const modelTotals = {};
  const modelEfficiency = aggregateModelEfficiency(projects);
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [model, data] of Object.entries(session.modelBreakdown)) {
        if (!modelTotals[model]) modelTotals[model] = { calls: 0, costUSD: 0, freshInput: 0, cacheRead: 0, cacheWrite: 0 };
        modelTotals[model].calls += data.calls;
        modelTotals[model].costUSD += data.costUSD;
        modelTotals[model].freshInput += data.tokens.inputTokens;
        modelTotals[model].cacheRead += data.tokens.cacheReadInputTokens;
        modelTotals[model].cacheWrite += data.tokens.cacheCreationInputTokens;
      }
    }
  }
  const sorted = Object.entries(modelTotals).sort(([, a], [, b]) => b.costUSD - a.costUSD);
  const maxCost = sorted[0]?.[1]?.costUSD ?? 0;
  return /* @__PURE__ */ jsxs2(Panel, { title: "By Model", color: PANEL_COLORS.model, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(bw + 1 + MODEL_NAME_WIDTH),
      "cost".padStart(MODEL_COL_COST),
      "cache".padStart(MODEL_COL_CACHE),
      "calls".padStart(MODEL_COL_CALLS),
      "1-shot".padStart(MODEL_COL_ONESHOT)
    ] }),
    sorted.map(([model, data], i) => {
      const totalInput = data.freshInput + data.cacheRead + data.cacheWrite;
      const cacheHit = totalInput > 0 ? data.cacheRead / totalInput * 100 : 0;
      const cacheLabel = totalInput > 0 ? `${cacheHit.toFixed(1)}%` : "-";
      const efficiency = modelEfficiency.get(model);
      const oneShotLabel = efficiency && efficiency.editTurns >= MIN_EDIT_TURNS_FOR_RATE && efficiency.oneShotRate !== null ? `${efficiency.oneShotRate.toFixed(1)}%` : "-";
      return /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
        /* @__PURE__ */ jsx2(HBar, { value: data.costUSD, max: maxCost, width: bw }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          " ",
          fit(model, MODEL_NAME_WIDTH)
        ] }),
        /* @__PURE__ */ jsx2(Text2, { color: GOLD3, children: formatCost(data.costUSD).padStart(MODEL_COL_COST) }),
        /* @__PURE__ */ jsx2(Text2, { children: cacheLabel.padStart(MODEL_COL_CACHE) }),
        /* @__PURE__ */ jsx2(Text2, { children: String(data.calls).padStart(MODEL_COL_CALLS) }),
        /* @__PURE__ */ jsx2(Text2, { children: oneShotLabel.padStart(MODEL_COL_ONESHOT) })
      ] }, `${model}-${i}`);
    })
  ] });
}
var SKILL_SUB_ROWS_LIMIT = 5;
function ActivityBreakdown({ projects, pw, bw }) {
  const categoryTotals = {};
  const skillTotals = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [cat, data] of Object.entries(session.categoryBreakdown)) {
        if (!categoryTotals[cat]) categoryTotals[cat] = { turns: 0, costUSD: 0, editTurns: 0, oneShotTurns: 0 };
        categoryTotals[cat].turns += data.turns;
        categoryTotals[cat].costUSD += data.costUSD;
        categoryTotals[cat].editTurns += data.editTurns;
        categoryTotals[cat].oneShotTurns += data.oneShotTurns;
      }
      for (const [skill, data] of Object.entries(session.skillBreakdown ?? {})) {
        if (!skillTotals[skill]) skillTotals[skill] = { turns: 0, costUSD: 0, editTurns: 0, oneShotTurns: 0 };
        skillTotals[skill].turns += data.turns;
        skillTotals[skill].costUSD += data.costUSD;
        skillTotals[skill].editTurns += data.editTurns;
        skillTotals[skill].oneShotTurns += data.oneShotTurns;
      }
    }
  }
  const sorted = Object.entries(categoryTotals).sort(([, a], [, b]) => b.costUSD - a.costUSD);
  const sortedSkills = Object.entries(skillTotals).sort(([, a], [, b]) => b.costUSD - a.costUSD).slice(0, SKILL_SUB_ROWS_LIMIT);
  const maxCost = sorted[0]?.[1]?.costUSD ?? 0;
  return /* @__PURE__ */ jsxs2(Panel, { title: "By Activity", color: PANEL_COLORS.activity, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(bw + 14),
      "cost".padStart(8),
      "turns".padStart(6),
      "1-shot".padStart(7)
    ] }),
    sorted.flatMap(([cat, data]) => {
      const oneShotPct = data.editTurns > 0 ? Math.round(data.oneShotTurns / data.editTurns * 100) + "%" : "-";
      const rows = [
        /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
          /* @__PURE__ */ jsx2(HBar, { value: data.costUSD, max: maxCost, width: bw }),
          /* @__PURE__ */ jsxs2(Text2, { color: CATEGORY_COLORS[cat] ?? "#666666", children: [
            " ",
            fit(CATEGORY_LABELS[cat] ?? cat, 13)
          ] }),
          /* @__PURE__ */ jsx2(Text2, { color: GOLD3, children: formatCost(data.costUSD).padStart(8) }),
          /* @__PURE__ */ jsx2(Text2, { children: String(data.turns).padStart(6) }),
          /* @__PURE__ */ jsx2(Text2, { color: data.editTurns === 0 ? DIM3 : oneShotPct === "100%" ? "#5BF58C" : ORANGE3, children: String(oneShotPct).padStart(7) })
        ] }, cat)
      ];
      if (cat === "general" && sortedSkills.length > 0) {
        for (const [skill, sd] of sortedSkills) {
          const subPct = sd.editTurns > 0 ? Math.round(sd.oneShotTurns / sd.editTurns * 100) + "%" : "-";
          rows.push(
            /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", dimColor: true, children: [
              /* @__PURE__ */ jsx2(HBar, { value: sd.costUSD, max: maxCost, width: bw }),
              /* @__PURE__ */ jsxs2(Text2, { children: [
                " ",
                fit(`  /${skill}`, 13)
              ] }),
              /* @__PURE__ */ jsx2(Text2, { children: formatCost(sd.costUSD).padStart(8) }),
              /* @__PURE__ */ jsx2(Text2, { children: String(sd.turns).padStart(6) }),
              /* @__PURE__ */ jsx2(Text2, { children: String(subPct).padStart(7) })
            ] }, `${cat}:${skill}`)
          );
        }
      }
      return rows;
    })
  ] });
}
function ToolBreakdown({ projects, pw, bw, title, filterPrefix }) {
  const toolTotals = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [tool, data] of Object.entries(session.toolBreakdown)) {
        if (filterPrefix) {
          if (!tool.startsWith(filterPrefix)) continue;
        } else {
          if (tool.startsWith("lang:")) continue;
        }
        toolTotals[tool] = (toolTotals[tool] ?? 0) + data.calls;
      }
    }
  }
  const sorted = Object.entries(toolTotals).sort(([, a], [, b]) => b - a);
  const maxCalls = sorted[0]?.[1] ?? 0;
  const nw = Math.max(6, pw - bw - 15);
  return /* @__PURE__ */ jsxs2(Panel, { title: title ?? "Core Tools", color: PANEL_COLORS.tools, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(bw + 1 + nw),
      "calls".padStart(7)
    ] }),
    sorted.slice(0, 10).map(([tool, calls]) => {
      const raw = filterPrefix ? tool.slice(filterPrefix.length) : tool;
      const display = filterPrefix ? LANG_DISPLAY_NAMES[raw] ?? raw : raw;
      return /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
        /* @__PURE__ */ jsx2(HBar, { value: calls, max: maxCalls, width: bw }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          " ",
          fit(display, nw)
        ] }),
        /* @__PURE__ */ jsx2(Text2, { children: String(calls).padStart(7) })
      ] }, tool);
    })
  ] });
}
function McpBreakdown({ projects, pw, bw }) {
  const mcpTotals = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [server, data] of Object.entries(session.mcpBreakdown)) {
        mcpTotals[server] = (mcpTotals[server] ?? 0) + data.calls;
      }
    }
  }
  const sorted = Object.entries(mcpTotals).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return /* @__PURE__ */ jsx2(Panel, { title: "MCP Servers", color: PANEL_COLORS.mcp, width: pw, children: /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "No MCP usage" }) });
  const maxCalls = sorted[0]?.[1] ?? 0;
  const nw = Math.max(6, pw - bw - 15);
  return /* @__PURE__ */ jsxs2(Panel, { title: "MCP Servers", color: PANEL_COLORS.mcp, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(bw + 1 + nw),
      "calls".padStart(6)
    ] }),
    sorted.slice(0, 8).map(([server, calls]) => /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
      /* @__PURE__ */ jsx2(HBar, { value: calls, max: maxCalls, width: bw }),
      /* @__PURE__ */ jsxs2(Text2, { children: [
        " ",
        fit(server, nw)
      ] }),
      /* @__PURE__ */ jsx2(Text2, { children: String(calls).padStart(6) })
    ] }, server))
  ] });
}
function BashBreakdown({ projects, pw, bw }) {
  const bashTotals = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [cmd, data] of Object.entries(session.bashBreakdown)) {
        bashTotals[cmd] = (bashTotals[cmd] ?? 0) + data.calls;
      }
    }
  }
  const sorted = Object.entries(bashTotals).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return /* @__PURE__ */ jsx2(Panel, { title: "Shell Commands", color: PANEL_COLORS.bash, width: pw, children: /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "No shell commands" }) });
  const maxCalls = sorted[0]?.[1] ?? 0;
  const nw = Math.max(6, pw - bw - 15);
  return /* @__PURE__ */ jsxs2(Panel, { title: "Shell Commands", color: PANEL_COLORS.bash, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(bw + 1 + nw),
      "calls".padStart(7)
    ] }),
    sorted.slice(0, 10).map(([cmd, calls]) => /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
      /* @__PURE__ */ jsx2(HBar, { value: calls, max: maxCalls, width: bw }),
      /* @__PURE__ */ jsxs2(Text2, { children: [
        " ",
        fit(cmd, nw)
      ] }),
      /* @__PURE__ */ jsx2(Text2, { children: String(calls).padStart(7) })
    ] }, cmd))
  ] });
}
function SkillsAndAgents({ projects, pw, bw }) {
  const merged = {};
  for (const project of projects) {
    for (const session of project.sessions) {
      for (const [skill, d] of Object.entries(session.skillBreakdown)) {
        const e = merged[skill] ?? { uses: 0, cost: 0 };
        e.uses += d.turns;
        e.cost += d.costUSD;
        merged[skill] = e;
      }
      for (const [agent, d] of Object.entries(session.subagentBreakdown)) {
        const e = merged[agent] ?? { uses: 0, cost: 0 };
        e.uses += d.calls;
        e.cost += d.costUSD;
        merged[agent] = e;
      }
    }
  }
  const sorted = Object.entries(merged).sort(([, a], [, b]) => b.cost - a.cost);
  if (sorted.length === 0) return /* @__PURE__ */ jsx2(Panel, { title: "Skills & Agents", color: PANEL_COLORS.skills, width: pw, children: /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "No skill/agent usage" }) });
  const maxCost = sorted[0]?.[1]?.cost ?? 0;
  const nw = Math.max(6, pw - bw - 22);
  return /* @__PURE__ */ jsxs2(Panel, { title: "Skills & Agents", color: PANEL_COLORS.skills, width: pw, children: [
    /* @__PURE__ */ jsxs2(Text2, { dimColor: true, wrap: "truncate-end", children: [
      "".padEnd(bw + 1 + nw),
      "uses".padStart(6),
      "cost".padStart(8)
    ] }),
    sorted.slice(0, 10).map(([name, d]) => /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
      /* @__PURE__ */ jsx2(HBar, { value: d.cost, max: maxCost, width: bw }),
      /* @__PURE__ */ jsxs2(Text2, { children: [
        " ",
        fit(name, nw)
      ] }),
      /* @__PURE__ */ jsx2(Text2, { children: String(d.uses).padStart(6) }),
      /* @__PURE__ */ jsx2(Text2, { color: GOLD3, children: formatCost(d.cost).padStart(8) })
    ] }, name))
  ] });
}
var PROVIDER_DISPLAY_NAMES = {
  all: "All",
  claude: "Claude",
  codex: "Codex",
  cursor: "Cursor",
  "ibm-bob": "IBM Bob",
  opencode: "OpenCode",
  pi: "Pi",
  kimi: "Kimi"
};
function getProviderDisplayName(name) {
  return PROVIDER_DISPLAY_NAMES[name] ?? name;
}
function PeriodTabs({ active: active2, providerName, showProvider }) {
  return /* @__PURE__ */ jsxs2(Box2, { justifyContent: "space-between", paddingX: 1, children: [
    /* @__PURE__ */ jsx2(Box2, { gap: 1, children: PERIODS.map((p) => /* @__PURE__ */ jsx2(Text2, { bold: active2 === p, color: active2 === p ? ORANGE3 : DIM3, children: active2 === p ? `[ ${PERIOD_LABELS[p]} ]` : `  ${PERIOD_LABELS[p]}  ` }, p)) }),
    showProvider && providerName && /* @__PURE__ */ jsxs2(Box2, { children: [
      /* @__PURE__ */ jsx2(Text2, { color: DIM3, children: "|  " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "[p]" }),
      /* @__PURE__ */ jsxs2(Text2, { bold: true, color: PROVIDER_COLORS[providerName] ?? ORANGE3, children: [
        " ",
        getProviderDisplayName(providerName)
      ] })
    ] })
  ] });
}
function actionDestinationHeader(action) {
  switch (action.type) {
    case "file-content":
      return `\u2500\u2500 Suggested ${action.path} addition `.padEnd(64, "\u2500");
    case "command":
      return "\u2500\u2500 Run this command ".padEnd(64, "\u2500");
    case "paste": {
      switch (action.destination) {
        case "claude-md":
          return "\u2500\u2500 Suggested CLAUDE.md addition (permanent rule) ".padEnd(64, "\u2500");
        case "session-opener":
          return "\u2500\u2500 One-time session opener (do not add to CLAUDE.md) ".padEnd(64, "\u2500");
        case "prompt":
          return "\u2500\u2500 Ask Claude in the current session ".padEnd(64, "\u2500");
        case "shell-config":
          return "\u2500\u2500 Add to your shell config ".padEnd(64, "\u2500");
        default:
          return "\u2500\u2500 Suggested action ".padEnd(64, "\u2500");
      }
    }
  }
}
function FindingAction({ action }) {
  const lines = action.type === "file-content" ? action.content.split("\n") : action.type === "command" ? action.text.split("\n") : [action.text];
  const header = actionDestinationHeader(action);
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, children: header }),
    /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: action.label }),
    lines.map((line, i) => /* @__PURE__ */ jsxs2(Text2, { color: "#5BF5E0", children: [
      "  ",
      line
    ] }, i))
  ] });
}
function FindingPanel({ index, finding, costRate, width }) {
  const costSaved = finding.tokensSaved * costRate;
  const color = IMPACT_PANEL_COLORS[finding.impact] ?? DIM3;
  const label = finding.impact.charAt(0).toUpperCase() + finding.impact.slice(1);
  const trendBadge = finding.trend === "improving" ? " improving \u2193" : "";
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", borderStyle: "round", borderColor: color, paddingX: 1, width, children: [
    /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
      /* @__PURE__ */ jsxs2(Text2, { bold: true, children: [
        index,
        ". ",
        finding.title
      ] }),
      /* @__PURE__ */ jsx2(Text2, { children: "  " }),
      /* @__PURE__ */ jsx2(Text2, { color, children: label }),
      trendBadge && /* @__PURE__ */ jsx2(Text2, { color: "#5BF5A0", children: trendBadge })
    ] }),
    /* @__PURE__ */ jsx2(Text2, { dimColor: true, wrap: "wrap", children: finding.explanation }),
    /* @__PURE__ */ jsxs2(Text2, { color: GOLD3, children: [
      "Savings: ~",
      formatTokens(finding.tokensSaved),
      " tokens (~",
      formatCost(costSaved),
      ")"
    ] }),
    /* @__PURE__ */ jsx2(Text2, { children: " " }),
    /* @__PURE__ */ jsx2(FindingAction, { action: finding.fix })
  ] });
}
var GRADE_COLORS2 = { A: "#5BF5A0", B: "#5BF5A0", C: GOLD3, D: ORANGE3, F: "#F55B5B" };
var FINDINGS_WINDOW_SIZE = 3;
function OptimizeView({ findings, costRate, projects, label, width, healthScore, healthGrade, cursor: cursor2 }) {
  const periodCost = projects.reduce((s, p) => s + p.totalCostUSD, 0);
  const totalTokens = findings.reduce((s, f) => s + f.tokensSaved, 0);
  const totalCost = totalTokens * costRate;
  const pctRaw = periodCost > 0 ? totalCost / periodCost * 100 : 0;
  const pct2 = pctRaw >= 1 ? pctRaw.toFixed(0) : pctRaw.toFixed(1);
  const gradeColor = GRADE_COLORS2[healthGrade] ?? DIM3;
  const total = findings.length;
  const start = total === 0 ? 0 : Math.min(cursor2, Math.max(0, total - FINDINGS_WINDOW_SIZE));
  const end = Math.min(start + FINDINGS_WINDOW_SIZE, total);
  const visible = findings.slice(start, end);
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width, children: [
    /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE3, paddingX: 1, width, children: [
      /* @__PURE__ */ jsxs2(Text2, { wrap: "truncate-end", children: [
        /* @__PURE__ */ jsx2(Text2, { bold: true, color: ORANGE3, children: "CodeBurn Optimize" }),
        /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
          "  ",
          label,
          "   Setup: "
        ] }),
        /* @__PURE__ */ jsx2(Text2, { bold: true, color: gradeColor, children: healthGrade }),
        /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
          " (",
          healthScore,
          "/100)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs2(Text2, { color: "#5BF5A0", wrap: "truncate-end", children: [
        "Savings: ~",
        formatTokens(totalTokens),
        " tokens (~",
        formatCost(totalCost),
        ", ~",
        pct2,
        "% of spend)"
      ] }),
      total > FINDINGS_WINDOW_SIZE && /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
        "Showing ",
        start + 1,
        "\u2013",
        end,
        " of ",
        total,
        " \xB7 j/k to scroll"
      ] })
    ] }),
    visible.map((f, i) => /* @__PURE__ */ jsx2(FindingPanel, { index: start + i + 1, finding: f, costRate, width }, start + i)),
    /* @__PURE__ */ jsx2(Box2, { paddingX: 1, width, children: /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Token estimates are approximate." }) })
  ] });
}
function StatusBar({ width, showProvider, view, findingCount, optimizeAvailable, compareAvailable, customRange, dayMode }) {
  const isOptimize = view === "optimize";
  return /* @__PURE__ */ jsx2(Box2, { borderStyle: "round", borderColor: DIM3, width, justifyContent: "center", paddingX: 1, children: /* @__PURE__ */ jsxs2(Text2, { children: [
    isOptimize ? /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "b" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " back   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "j" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "/" }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "k" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " scroll   " })
    ] }) : dayMode ? /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "<" }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, children: ">" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " day   " })
    ] }) : !customRange ? /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "<" }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, children: ">" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " switch   " })
    ] }) : null,
    /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "q" }),
    /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " quit" }),
    !customRange && !isOptimize && /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "1" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " today   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "2" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " week   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "3" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " 30 days   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "4" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " month   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "5" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " 6 months" })
    ] }),
    !customRange && !isOptimize && /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "d" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: dayMode ? " exit day" : " yesterday" })
    ] }),
    !isOptimize && optimizeAvailable && /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "o" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " optimize" }),
      findingCount != null && findingCount > 0 ? /* @__PURE__ */ jsxs2(Text2, { color: "#F55B5B", children: [
        " (",
        findingCount,
        ")"
      ] }) : null
    ] }),
    !isOptimize && compareAvailable && /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "c" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " compare" })
    ] }),
    showProvider && /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "   " }),
      /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: "p" }),
      /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: " provider" })
    ] })
  ] }) });
}
function Row({ wide, width, children }) {
  if (wide) return /* @__PURE__ */ jsx2(Box2, { width, children });
  return /* @__PURE__ */ jsx2(Fragment, { children });
}
function DashboardContent({ projects, period, columns, activeProvider, budgets, planUsages, label, dayMode }) {
  const { dashWidth, wide, halfWidth, barWidth: barWidth2 } = getLayout(columns);
  const isCursor = activeProvider === "cursor";
  const activeLabel = label ?? PERIOD_LABELS[period];
  if (projects.length === 0) return /* @__PURE__ */ jsx2(Panel, { title: "CodeBurn", color: ORANGE3, width: dashWidth, children: /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
    "No usage data found for ",
    activeLabel,
    "."
  ] }) });
  const pw = wide ? halfWidth : dashWidth;
  const days = dayMode ? 1 : period === "all" ? void 0 : period === "month" || period === "30days" ? 31 : 14;
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width: dashWidth, children: [
    /* @__PURE__ */ jsx2(Overview, { projects, label: activeLabel, width: dashWidth, planUsages }),
    /* @__PURE__ */ jsxs2(Row, { wide, width: dashWidth, children: [
      /* @__PURE__ */ jsx2(DailyActivity, { projects, days, pw, bw: barWidth2 }),
      /* @__PURE__ */ jsx2(ProjectBreakdown, { projects, pw, bw: barWidth2, budgets, rows: dayMode ? 8 : period === "all" ? 14 : period === "month" || period === "30days" ? 14 : 8 })
    ] }),
    /* @__PURE__ */ jsxs2(Row, { wide, width: dashWidth, children: [
      /* @__PURE__ */ jsx2(ActivityBreakdown, { projects, pw, bw: barWidth2 }),
      /* @__PURE__ */ jsx2(ModelBreakdown, { projects, pw, bw: barWidth2 })
    ] }),
    isCursor ? /* @__PURE__ */ jsx2(ToolBreakdown, { projects, pw: dashWidth, bw: barWidth2, title: "Languages", filterPrefix: "lang:" }) : /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsxs2(Row, { wide, width: dashWidth, children: [
        /* @__PURE__ */ jsx2(ToolBreakdown, { projects, pw, bw: barWidth2 }),
        /* @__PURE__ */ jsx2(BashBreakdown, { projects, pw, bw: barWidth2 })
      ] }),
      /* @__PURE__ */ jsxs2(Row, { wide, width: dashWidth, children: [
        /* @__PURE__ */ jsx2(SkillsAndAgents, { projects, pw, bw: barWidth2 }),
        /* @__PURE__ */ jsx2(McpBreakdown, { projects, pw, bw: barWidth2 })
      ] })
    ] })
  ] });
}
function InteractiveDashboard({ initialProjects, initialPeriod, initialProvider, initialPlanUsages, refreshSeconds, projectFilter, excludeFilter, customRange, customRangeLabel, initialDay }) {
  const { exit } = useApp2();
  const [period, setPeriod] = useState2(initialPeriod);
  const [projects, setProjects] = useState2(initialProjects);
  const [loading, setLoading] = useState2(false);
  const [activeProvider, setActiveProvider] = useState2(initialProvider);
  const [detectedProviders, setDetectedProviders] = useState2([]);
  const [view, setView] = useState2("dashboard");
  const [optimizeResult, setOptimizeResult] = useState2(null);
  const [optimizeLoading, setOptimizeLoading] = useState2(false);
  const [projectBudgets, setProjectBudgets] = useState2(/* @__PURE__ */ new Map());
  const [planUsages, setPlanUsages] = useState2(initialPlanUsages ?? []);
  const [dayDate, setDayDate] = useState2(initialDay ?? null);
  const [findingsCursor, setFindingsCursor] = useState2(0);
  const isDayMode = dayDate != null;
  const isCustomRange = customRange != null && !isDayMode;
  const { columns } = useWindowSize();
  const { dashWidth } = getLayout(columns);
  const multipleProviders = detectedProviders.length > 1;
  const optimizeAvailable = !isCustomRange && (activeProvider === "all" || activeProvider === "claude");
  const modelCount = new Set(
    projects.flatMap((p) => p.sessions.flatMap((s) => Object.keys(s.modelBreakdown)))
  ).size;
  const compareAvailable = modelCount >= 2;
  const debounceRef = useRef2(null);
  const reloadGenerationRef = useRef2(0);
  const reloadInFlightRef = useRef2(false);
  const currentReloadRef = useRef2(null);
  const pendingReloadRef = useRef2(null);
  const findingCount = optimizeResult?.findings.length ?? 0;
  useEffect2(() => {
    let cancelled = false;
    async function detect() {
      const found = [];
      for (const p of await getAllProviders()) {
        const s = await p.discoverSessions();
        if (s.length > 0) found.push(p.name);
      }
      if (!cancelled) setDetectedProviders(found);
    }
    detect();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect2(() => {
    let cancelled = false;
    async function loadBudgets() {
      const budgets = /* @__PURE__ */ new Map();
      for (const project of projects.slice(0, 8)) {
        if (cancelled) return;
        if (!project.projectPath.startsWith("/")) continue;
        budgets.set(project.project, await estimateContextBudget(project.projectPath));
      }
      if (!cancelled) setProjectBudgets(budgets);
    }
    loadBudgets();
    return () => {
      cancelled = true;
    };
  }, [projects]);
  const reloadData = useCallback(async (p, prov, day = null) => {
    if (reloadInFlightRef.current) {
      const current = currentReloadRef.current;
      if (current?.period === p && current.provider === prov && current.day === day) {
        pendingReloadRef.current = null;
        return;
      }
      reloadGenerationRef.current++;
      pendingReloadRef.current = { period: p, provider: prov, day };
      return;
    }
    reloadInFlightRef.current = true;
    currentReloadRef.current = { period: p, provider: prov, day };
    const generation = ++reloadGenerationRef.current;
    setLoading(true);
    setOptimizeLoading(false);
    setOptimizeResult(null);
    try {
      if (!day && isHeavyPeriod(p)) {
        setProjects([]);
        setProjectBudgets(/* @__PURE__ */ new Map());
        await nextTick();
        if (reloadGenerationRef.current !== generation) return;
      }
      const range = day ? getDayRange(day) : getPeriodRange(p);
      const data = await parseAllSessions(range, prov);
      if (reloadGenerationRef.current !== generation) return;
      const filteredProjects = filterProjectsByName(data, projectFilter, excludeFilter);
      if (reloadGenerationRef.current !== generation) return;
      setProjects(filteredProjects);
      const usage = await getPlanUsages();
      if (reloadGenerationRef.current !== generation) return;
      setPlanUsages(usage);
    } catch (error) {
      console.error(error);
    } finally {
      if (reloadGenerationRef.current === generation) {
        setLoading(false);
      }
      reloadInFlightRef.current = false;
      currentReloadRef.current = null;
      const pending = pendingReloadRef.current;
      pendingReloadRef.current = null;
      if (pending) {
        void reloadData(pending.period, pending.provider, pending.day);
      }
    }
  }, [projectFilter, excludeFilter]);
  const currentRange = useCallback(() => {
    return dayDate ? getDayRange(dayDate) : getPeriodRange(period);
  }, [dayDate, period]);
  const loadOptimizeResult = useCallback(async () => {
    if (!optimizeAvailable || projects.length === 0 || optimizeLoading) return;
    setView("optimize");
    setFindingsCursor(0);
    if (optimizeResult) return;
    const generation = reloadGenerationRef.current;
    setOptimizeLoading(true);
    try {
      const result = await scanAndDetect(projects, currentRange());
      if (reloadGenerationRef.current === generation) setOptimizeResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      if (reloadGenerationRef.current === generation) setOptimizeLoading(false);
    }
  }, [optimizeAvailable, projects, currentRange, optimizeLoading, optimizeResult]);
  useEffect2(() => {
    if (!refreshSeconds || refreshSeconds <= 0) return;
    if (!dayDate && isHeavyPeriod(period)) return;
    const id = setInterval(() => {
      reloadData(period, activeProvider, dayDate);
    }, refreshSeconds * 1e3);
    return () => clearInterval(id);
  }, [refreshSeconds, period, activeProvider, dayDate, reloadData]);
  const switchPeriod = useCallback((np) => {
    if (np === period && !dayDate) return;
    setPeriod(np);
    setDayDate(null);
    setProjects([]);
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      reloadData(np, activeProvider, null);
    }, 600);
  }, [period, activeProvider, dayDate, reloadData]);
  const switchPeriodImmediate = useCallback(async (np) => {
    if (np === period && !dayDate) return;
    setPeriod(np);
    setDayDate(null);
    setProjects([]);
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await reloadData(np, activeProvider, null);
  }, [period, activeProvider, dayDate, reloadData]);
  const switchDay = useCallback(async (nextDay) => {
    const today = parseDayFlag("today").day;
    const clampedDay = nextDay > today ? today : nextDay;
    if (clampedDay === dayDate) return;
    setDayDate(clampedDay);
    setProjects([]);
    setLoading(true);
    setView("dashboard");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await reloadData(period, activeProvider, clampedDay);
  }, [period, activeProvider, dayDate, reloadData]);
  const enterYesterday = useCallback(async () => {
    const yesterday = parseDayFlag("yesterday").day;
    await switchDay(yesterday);
  }, [switchDay]);
  useInput2((input, key) => {
    if (input === "q") {
      exit();
      return;
    }
    if (input === "o" && view === "dashboard" && optimizeAvailable) {
      void loadOptimizeResult();
      return;
    }
    if ((input === "b" || key.escape) && view === "optimize") {
      setView("dashboard");
      setFindingsCursor(0);
      return;
    }
    if (view === "optimize") {
      const total = optimizeResult?.findings.length ?? 0;
      const maxStart = Math.max(0, total - FINDINGS_WINDOW_SIZE);
      if (input === "j" || key.downArrow) {
        setFindingsCursor((c) => Math.min(c + 1, maxStart));
        return;
      }
      if (input === "k" || key.upArrow) {
        setFindingsCursor((c) => Math.max(c - 1, 0));
        return;
      }
      return;
    }
    if (input === "c" && compareAvailable && view === "dashboard") {
      setView("compare");
      return;
    }
    if ((input === "b" || key.escape) && view === "compare") {
      setView("dashboard");
      return;
    }
    if (input === "p" && multipleProviders && view !== "compare") {
      const opts = ["all", ...detectedProviders];
      const next = opts[(opts.indexOf(activeProvider) + 1) % opts.length];
      setActiveProvider(next);
      setView("dashboard");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      reloadData(period, next, dayDate);
      return;
    }
    if (view === "compare") return;
    if (!customRange && input === "d") {
      if (dayDate) {
        setDayDate(null);
        setProjects([]);
        setLoading(true);
        void reloadData(period, activeProvider, null);
      } else {
        void enterYesterday();
      }
      return;
    }
    if (isCustomRange) return;
    if (dayDate) {
      if (key.leftArrow) {
        void switchDay(shiftDay(dayDate, -1));
        return;
      }
      if (key.rightArrow || key.tab) {
        void switchDay(shiftDay(dayDate, 1));
        return;
      }
      if (key.escape || input === "b") {
        setDayDate(null);
        setProjects([]);
        setLoading(true);
        void reloadData(period, activeProvider, null);
        return;
      }
    }
    const idx = PERIODS.indexOf(period);
    if (key.leftArrow) switchPeriod(PERIODS[(idx - 1 + PERIODS.length) % PERIODS.length]);
    else if (key.rightArrow || key.tab) switchPeriod(PERIODS[(idx + 1) % PERIODS.length]);
    else if (input === "1") switchPeriodImmediate("today");
    else if (input === "2") switchPeriodImmediate("week");
    else if (input === "3") switchPeriodImmediate("30days");
    else if (input === "4") switchPeriodImmediate("month");
    else if (input === "5") switchPeriodImmediate("all");
  });
  const headerLabel = dayDate ? formatDayRangeLabel(dayDate) : customRangeLabel ?? PERIOD_LABELS[period];
  if (loading || optimizeLoading) {
    return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width: dashWidth, children: [
      !isCustomRange && !isDayMode && /* @__PURE__ */ jsx2(PeriodTabs, { active: period, providerName: activeProvider, showProvider: view !== "compare" && multipleProviders }),
      isDayMode && /* @__PURE__ */ jsx2(DayBanner, { label: headerLabel, width: dashWidth }),
      isCustomRange && /* @__PURE__ */ jsx2(CustomRangeBanner, { label: headerLabel, width: dashWidth }),
      view === "compare" ? /* @__PURE__ */ jsx2(Box2, { flexDirection: "column", paddingX: 2, paddingY: 1, children: /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", borderStyle: "round", borderColor: ORANGE3, paddingX: 1, children: [
        /* @__PURE__ */ jsx2(Text2, { bold: true, color: ORANGE3, children: "Model Comparison" }),
        /* @__PURE__ */ jsx2(Text2, { children: " " }),
        /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
          "Loading ",
          headerLabel,
          " model data..."
        ] })
      ] }) }) : view === "optimize" ? /* @__PURE__ */ jsx2(Panel, { title: "CodeBurn Optimize", color: ORANGE3, width: dashWidth, children: /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
        "Scanning ",
        headerLabel,
        "..."
      ] }) }) : /* @__PURE__ */ jsx2(Panel, { title: "CodeBurn", color: ORANGE3, width: dashWidth, children: /* @__PURE__ */ jsxs2(Text2, { dimColor: true, children: [
        "Loading ",
        headerLabel,
        "..."
      ] }) }),
      view !== "compare" && /* @__PURE__ */ jsx2(StatusBar, { width: dashWidth, showProvider: multipleProviders, view, findingCount: 0, optimizeAvailable: false, compareAvailable: false, customRange: isCustomRange, dayMode: isDayMode })
    ] });
  }
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width: dashWidth, children: [
    !isCustomRange && !isDayMode && /* @__PURE__ */ jsx2(PeriodTabs, { active: period, providerName: activeProvider, showProvider: multipleProviders && view !== "compare" }),
    isDayMode && /* @__PURE__ */ jsx2(DayBanner, { label: headerLabel, width: dashWidth }),
    isCustomRange && /* @__PURE__ */ jsx2(CustomRangeBanner, { label: headerLabel, width: dashWidth }),
    view === "compare" ? /* @__PURE__ */ jsx2(CompareView, { projects, onBack: () => setView("dashboard") }) : view === "optimize" && optimizeResult ? /* @__PURE__ */ jsx2(OptimizeView, { findings: optimizeResult.findings, costRate: optimizeResult.costRate, projects, label: headerLabel, width: dashWidth, healthScore: optimizeResult.healthScore, healthGrade: optimizeResult.healthGrade, cursor: findingsCursor }) : /* @__PURE__ */ jsx2(DashboardContent, { projects, period, columns, activeProvider, budgets: projectBudgets, planUsages, label: headerLabel, dayMode: isDayMode }),
    view !== "compare" && /* @__PURE__ */ jsx2(StatusBar, { width: dashWidth, showProvider: multipleProviders, view, findingCount, optimizeAvailable, compareAvailable, customRange: isCustomRange, dayMode: isDayMode })
  ] });
}
function DayBanner({ label, width }) {
  return /* @__PURE__ */ jsx2(Box2, { width, paddingX: 1, marginBottom: 1, children: /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: label }) });
}
function CustomRangeBanner({ label, width }) {
  return /* @__PURE__ */ jsxs2(Box2, { width, paddingX: 1, marginBottom: 1, children: [
    /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Custom range: " }),
    /* @__PURE__ */ jsx2(Text2, { color: ORANGE3, bold: true, children: label })
  ] });
}
function StaticDashboard({ projects, period, activeProvider, planUsages, label, dayMode }) {
  const { columns } = useWindowSize();
  const { dashWidth } = getLayout(columns);
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", width: dashWidth, children: [
    dayMode ? /* @__PURE__ */ jsx2(DayBanner, { label: label ?? PERIOD_LABELS[period], width: dashWidth }) : /* @__PURE__ */ jsx2(PeriodTabs, { active: period }),
    /* @__PURE__ */ jsx2(DashboardContent, { projects, period, columns, activeProvider, planUsages, label, dayMode })
  ] });
}
async function renderDashboard(period = "week", provider = "all", refreshSeconds, projectFilter, excludeFilter, customRange, customRangeLabel, initialDay) {
  await loadPricing();
  const dayRange = initialDay ? getDayRange(initialDay) : null;
  const range = dayRange ?? customRange ?? getPeriodRange(period);
  const filteredProjects = filterProjectsByName(await parseAllSessions(range, provider), projectFilter, excludeFilter);
  const planUsages = await getPlanUsages();
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  const label = initialDay ? formatDayRangeLabel(initialDay) : customRangeLabel;
  patchStdoutForWindows();
  if (isTTY) {
    const { waitUntilExit } = render2(
      /* @__PURE__ */ jsx2(InteractiveDashboard, { initialProjects: filteredProjects, initialPeriod: period, initialProvider: provider, initialPlanUsages: planUsages, refreshSeconds, projectFilter, excludeFilter, customRange, customRangeLabel, initialDay })
    );
    await waitUntilExit();
  } else {
    const { unmount } = render2(/* @__PURE__ */ jsx2(StaticDashboard, { projects: filteredProjects, period, activeProvider: provider, planUsages, label, dayMode: initialDay != null }), { patchConsole: false });
    unmount();
  }
}

// src/main.ts
init_providers();

// src/antigravity-statusline.ts
init_antigravity();
import { mkdir as mkdir11, open as open7, readFile as readFile23, rename as rename8, unlink as unlink6 } from "fs/promises";
import { randomBytes as randomBytes7 } from "crypto";
import { dirname as dirname7, join as join40 } from "path";
import { homedir as homedir36 } from "os";
var PERSISTENT_CLI_REQUIRED_MESSAGE3 = "The Antigravity hook needs a persistent codeburn command. Install CodeBurn globally first: npm install -g codeburn";
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isCodeBurnHook(command) {
  return typeof command === "string" && /(?:^|\s)agy-statusline-hook$/.test(command.trim());
}
function shellQuote(value) {
  if (process.platform === "win32") return `"${value.replace(/(["\\])/g, "\\$1")}"`;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
async function hookCommand() {
  const codeburnPath = await resolvePersistentCodeburnPathFromPath(
    buildPersistentCodeburnLookupPath(),
    PERSISTENT_CLI_REQUIRED_MESSAGE3
  );
  return `${shellQuote(codeburnPath)} agy-statusline-hook`;
}
function settingsPath() {
  return process.env["CODEBURN_ANTIGRAVITY_SETTINGS_PATH"] ?? join40(homedir36(), ".gemini", "antigravity-cli", "settings.json");
}
function codeburnCacheDir() {
  return process.env["CODEBURN_CACHE_DIR"] ?? join40(homedir36(), ".cache", "codeburn");
}
function previousStatusLinePath() {
  return join40(codeburnCacheDir(), "antigravity-statusline-previous.json");
}
async function readSettings() {
  try {
    const raw = await readFile23(settingsPath(), "utf-8");
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
async function writeJsonAtomic(path, value) {
  await mkdir11(dirname7(path), { recursive: true });
  const tempPath = `${path}.${randomBytes7(8).toString("hex")}.tmp`;
  const handle = await open7(tempPath, "w", 384);
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}
`, { encoding: "utf-8" });
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename8(tempPath, path);
  } catch (err) {
    try {
      await unlink6(tempPath);
    } catch {
    }
    throw err;
  }
}
async function writeSettings(settings) {
  await writeJsonAtomic(settingsPath(), settings);
}
async function savePreviousStatusLine(statusLine) {
  await writeJsonAtomic(previousStatusLinePath(), {
    savedAt: (/* @__PURE__ */ new Date()).toISOString(),
    statusLine
  });
}
async function readPreviousStatusLine() {
  try {
    const raw = await readFile23(previousStatusLinePath(), "utf-8");
    const parsed = JSON.parse(raw);
    if (!isObject(parsed) || !isObject(parsed.statusLine)) return null;
    return parsed.statusLine;
  } catch {
    return null;
  }
}
async function clearPreviousStatusLine() {
  try {
    await unlink6(previousStatusLinePath());
  } catch {
  }
}
async function installAntigravityStatusLineHook(force = false) {
  const settings = await readSettings();
  const existing = settings.statusLine;
  if (existing && !isCodeBurnHook(existing.command) && !force) {
    throw new Error(
      "Antigravity CLI already has a custom statusLine command. Re-run with --force to replace it."
    );
  }
  const command = await hookCommand();
  if (isCodeBurnHook(existing?.command) && existing?.command === command && existing.type === "command" && existing.padding === 0) {
    return "already-installed";
  }
  if (existing && !isCodeBurnHook(existing.command)) await savePreviousStatusLine(existing);
  settings.statusLine = {
    type: "command",
    command,
    padding: 0
  };
  await writeSettings(settings);
  return "installed";
}
async function uninstallAntigravityStatusLineHook() {
  const settings = await readSettings();
  if (!isCodeBurnHook(settings.statusLine?.command)) return "not-installed";
  const previous = await readPreviousStatusLine();
  if (previous) settings.statusLine = previous;
  else delete settings.statusLine;
  await writeSettings(settings);
  await clearPreviousStatusLine();
  return previous ? "restored" : "removed";
}
var MAX_STDIN_BYTES = 1024 * 1024;
function readStdin() {
  return new Promise((resolve5, reject) => {
    let input = "";
    let bytes = 0;
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      bytes += Buffer.byteLength(chunk, "utf8");
      if (bytes > MAX_STDIN_BYTES) {
        process.stdin.destroy();
        reject(new Error("stdin too large"));
        return;
      }
      input += chunk;
    });
    process.stdin.on("end", () => resolve5(input));
    process.stdin.on("error", reject);
  });
}
async function runAgyStatusLineHook() {
  try {
    const input = await readStdin();
    const payload = input.trim() ? JSON.parse(input) : null;
    await recordAntigravityStatusLinePayload(payload);
    await snapshotAntigravityStatusLinePayload(payload);
  } catch {
  }
}

// src/main.ts
init_config();
init_plans();
init_currency();
import { createRequire as createRequire2 } from "module";
var require2 = createRequire2(import.meta.url);
var { version } = require2("../package.json");
async function hydrateCache() {
  try {
    return await ensureCacheHydrated(
      (range) => parseAllSessions(range, "all"),
      aggregateProjectsIntoDays
    );
  } catch {
    return emptyCache2();
  }
}
function collect(val, acc) {
  acc.push(val);
  return acc;
}
function parseNumber(value) {
  return Number(value);
}
function parseInteger(value) {
  return parseInt(value, 10);
}
function toJsonPlanSummary(planUsage) {
  return {
    id: planUsage.plan.id,
    provider: planUsage.plan.provider,
    budget: convertCost(planUsage.budgetUsd),
    spent: convertCost(planUsage.spentApiEquivalentUsd),
    percentUsed: Math.round(planUsage.percentUsed * 10) / 10,
    status: planUsage.status,
    projectedMonthEnd: convertCost(planUsage.projectedMonthUsd),
    daysUntilReset: planUsage.daysUntilReset,
    periodStart: planUsage.periodStart.toISOString(),
    periodEnd: planUsage.periodEnd.toISOString()
  };
}
function toJsonPlanSummaryMap(planUsages) {
  const summaries = {};
  for (const usage of planUsages) {
    summaries[usage.plan.provider] = toJsonPlanSummary(usage);
  }
  return summaries;
}
async function attachPlanSummaries(payload) {
  const planUsages = await getPlanUsages();
  if (planUsages.length > 0) {
    return {
      ...payload,
      plan: toJsonPlanSummary(planUsages[0]),
      plans: toJsonPlanSummaryMap(planUsages)
    };
  }
  return payload;
}
function planLabel2(plan) {
  const name = planDisplayName(plan.id);
  return plan.id === "custom" ? `${name} (${plan.provider})` : name;
}
function toPlanDisplay(plan) {
  return {
    id: plan.id,
    monthlyUsd: plan.monthlyUsd,
    provider: plan.provider,
    resetDay: clampResetDay(plan.resetDay),
    setAt: plan.setAt || null
  };
}
function sortedPlans(plans) {
  return PLAN_PROVIDERS.map((provider) => plans[provider]).filter((plan) => plan !== void 0);
}
function assertFormat(value, allowed, command) {
  if (!allowed.includes(value)) {
    process.stderr.write(
      `codeburn ${command}: unknown format "${value}". Valid values: ${allowed.join(", ")}.
`
    );
    process.exit(1);
  }
}
async function runJsonReport(period, provider, project, exclude) {
  await loadPricing();
  const { range, label } = getDateRange(period);
  const projects = filterProjectsByName(await parseAllSessions(range, provider), project, exclude);
  const report = await attachPlanSummaries(buildJsonReport(projects, label, period));
  console.log(JSON.stringify(report, null, 2));
}
var program = new Command().name("codeburn").description("See where your AI coding tokens go - by task, tool, model, and project").version(version).option("--verbose", "print warnings to stderr on read failures and skipped files").option("--timezone <zone>", "IANA timezone for date grouping (e.g. Asia/Tokyo, America/New_York)");
program.hook("preAction", async (thisCommand) => {
  const tz = thisCommand.opts().timezone ?? process.env["CODEBURN_TZ"];
  if (tz) {
    try {
      Intl.DateTimeFormat(void 0, { timeZone: tz });
    } catch {
      console.error(`
  Invalid timezone: "${tz}". Use an IANA timezone like "America/New_York" or "Asia/Tokyo".
`);
      process.exit(1);
    }
    process.env.TZ = tz;
  }
  const config = await readConfig();
  setModelAliases(config.modelAliases ?? {});
  if (thisCommand.opts().verbose) {
    process.env["CODEBURN_VERBOSE"] = "1";
  }
  await loadCurrency();
});
function buildJsonReport(projects, period, periodKey) {
  const sessions = projects.flatMap((p) => p.sessions);
  const { code } = getCurrency();
  const totalCostUSD = projects.reduce((s, p) => s + p.totalCostUSD, 0);
  const totalCalls = projects.reduce((s, p) => s + p.totalApiCalls, 0);
  const totalSessions = projects.reduce((s, p) => s + p.sessions.length, 0);
  const totalInput = sessions.reduce((s, sess) => s + sess.totalInputTokens, 0);
  const totalOutput = sessions.reduce((s, sess) => s + sess.totalOutputTokens, 0);
  const totalCacheRead = sessions.reduce((s, sess) => s + sess.totalCacheReadTokens, 0);
  const totalCacheWrite = sessions.reduce((s, sess) => s + sess.totalCacheWriteTokens, 0);
  const cacheHitDenom = totalInput + totalCacheRead;
  const cacheHitPercent2 = cacheHitDenom > 0 ? Math.round(totalCacheRead / cacheHitDenom * 1e3) / 10 : 0;
  const dailyMap = {};
  for (const sess of sessions) {
    for (const turn of sess.turns) {
      const ts = turn.timestamp || turn.assistantCalls[0]?.timestamp;
      if (!ts) {
        continue;
      }
      const day = dateKey(ts);
      if (!dailyMap[day]) {
        dailyMap[day] = { cost: 0, calls: 0, turns: 0, editTurns: 0, oneShotTurns: 0 };
      }
      dailyMap[day].turns += 1;
      if (turn.hasEdits) {
        dailyMap[day].editTurns += 1;
        if (turn.retries === 0) dailyMap[day].oneShotTurns += 1;
      }
      for (const call of turn.assistantCalls) {
        dailyMap[day].cost += call.costUSD;
        dailyMap[day].calls += 1;
      }
    }
  }
  const daily = Object.entries(dailyMap).sort().map(([date, d]) => ({
    date,
    cost: convertCost(d.cost),
    calls: d.calls,
    turns: d.turns,
    editTurns: d.editTurns,
    oneShotTurns: d.oneShotTurns,
    // Pre-computed convenience for dashboards that don't want to do the math.
    // null when there are no edit turns (the rate is undefined, not zero —
    // a day where the user only had Q&A turns shouldn't read as 0% one-shot).
    oneShotRate: d.editTurns > 0 ? Math.round(d.oneShotTurns / d.editTurns * 1e3) / 10 : null
  }));
  const projectList = projects.map((p) => ({
    name: p.project,
    path: p.projectPath,
    cost: convertCost(p.totalCostUSD),
    avgCostPerSession: p.sessions.length > 0 ? convertCost(p.totalCostUSD / p.sessions.length) : null,
    calls: p.totalApiCalls,
    sessions: p.sessions.length
  }));
  const modelMap = {};
  const modelEfficiency = aggregateModelEfficiency(projects);
  for (const sess of sessions) {
    for (const [model, d] of Object.entries(sess.modelBreakdown)) {
      if (!modelMap[model]) {
        modelMap[model] = { calls: 0, cost: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
      }
      modelMap[model].calls += d.calls;
      modelMap[model].cost += d.costUSD;
      modelMap[model].inputTokens += d.tokens.inputTokens;
      modelMap[model].outputTokens += d.tokens.outputTokens;
      modelMap[model].cacheReadTokens += d.tokens.cacheReadInputTokens;
      modelMap[model].cacheWriteTokens += d.tokens.cacheCreationInputTokens;
    }
  }
  const models = Object.entries(modelMap).sort(([, a], [, b]) => b.cost - a.cost).map(([name, { cost, ...rest }]) => {
    const efficiency = modelEfficiency.get(name);
    return {
      name,
      ...rest,
      cost: convertCost(cost),
      editTurns: efficiency?.editTurns ?? 0,
      oneShotTurns: efficiency?.oneShotTurns ?? 0,
      oneShotRate: efficiency?.oneShotRate ?? null,
      retriesPerEdit: efficiency?.retriesPerEdit ?? null,
      costPerEdit: efficiency?.costPerEditUSD !== null && efficiency?.costPerEditUSD !== void 0 ? convertCost(efficiency.costPerEditUSD) : null
    };
  });
  const catMap = {};
  for (const sess of sessions) {
    for (const [cat, d] of Object.entries(sess.categoryBreakdown)) {
      if (!catMap[cat]) {
        catMap[cat] = { turns: 0, cost: 0, editTurns: 0, oneShotTurns: 0 };
      }
      catMap[cat].turns += d.turns;
      catMap[cat].cost += d.costUSD;
      catMap[cat].editTurns += d.editTurns;
      catMap[cat].oneShotTurns += d.oneShotTurns;
    }
  }
  const activities = Object.entries(catMap).sort(([, a], [, b]) => b.cost - a.cost).map(([cat, d]) => ({
    category: CATEGORY_LABELS[cat] ?? cat,
    cost: convertCost(d.cost),
    turns: d.turns,
    editTurns: d.editTurns,
    oneShotTurns: d.oneShotTurns,
    oneShotRate: d.editTurns > 0 ? Math.round(d.oneShotTurns / d.editTurns * 1e3) / 10 : null
  }));
  const toolMap = {};
  const mcpMap = {};
  const bashMap = {};
  const skillMap = {};
  const subagentMap = {};
  for (const sess of sessions) {
    for (const [tool, d] of Object.entries(sess.toolBreakdown)) {
      toolMap[tool] = (toolMap[tool] ?? 0) + d.calls;
    }
    for (const [server, d] of Object.entries(sess.mcpBreakdown)) {
      mcpMap[server] = (mcpMap[server] ?? 0) + d.calls;
    }
    for (const [cmd, d] of Object.entries(sess.bashBreakdown)) {
      bashMap[cmd] = (bashMap[cmd] ?? 0) + d.calls;
    }
    for (const [skill, d] of Object.entries(sess.skillBreakdown)) {
      if (!skillMap[skill]) skillMap[skill] = { turns: 0, cost: 0 };
      skillMap[skill].turns += d.turns;
      skillMap[skill].cost += d.costUSD;
    }
    for (const [sat, d] of Object.entries(sess.subagentBreakdown)) {
      if (!subagentMap[sat]) subagentMap[sat] = { calls: 0, cost: 0 };
      subagentMap[sat].calls += d.calls;
      subagentMap[sat].cost += d.costUSD;
    }
  }
  const sortedMap = (m) => Object.entries(m).sort(([, a], [, b]) => b - a).map(([name, calls]) => ({ name, calls }));
  const topSessions = projects.flatMap((p) => p.sessions.map((s) => ({ project: p.project, sessionId: s.sessionId, date: s.firstTimestamp ? dateKey(s.firstTimestamp) : null, cost: convertCost(s.totalCostUSD), calls: s.apiCalls }))).sort((a, b) => b.cost - a.cost).slice(0, 5);
  return {
    generated: (/* @__PURE__ */ new Date()).toISOString(),
    currency: code,
    period,
    periodKey,
    overview: {
      cost: convertCost(totalCostUSD),
      calls: totalCalls,
      sessions: totalSessions,
      cacheHitPercent: cacheHitPercent2,
      tokens: {
        input: totalInput,
        output: totalOutput,
        cacheRead: totalCacheRead,
        cacheWrite: totalCacheWrite
      }
    },
    daily,
    projects: projectList,
    models,
    activities,
    tools: sortedMap(toolMap),
    mcpServers: sortedMap(mcpMap),
    shellCommands: sortedMap(bashMap),
    skills: Object.entries(skillMap).sort(([, a], [, b]) => b.cost - a.cost).map(([name, d]) => ({ name, turns: d.turns, cost: convertCost(d.cost) })),
    subagents: Object.entries(subagentMap).sort(([, a], [, b]) => b.cost - a.cost).map(([name, d]) => ({ name, calls: d.calls, cost: convertCost(d.cost) })),
    topSessions
  };
}
program.command("report", { isDefault: true }).description("Interactive usage dashboard").option("-p, --period <period>", "Starting period: today, week, 30days, month, all", "week").option("--day <date>", "Single day to review (YYYY-MM-DD, today, or yesterday). Overrides --period when set").option("--from <date>", "Start date (YYYY-MM-DD). Overrides --period when set").option("--to <date>", "End date (YYYY-MM-DD). Overrides --period when set").option("--provider <provider>", "Filter by provider (e.g. claude, gemini, cursor, copilot)", "all").option("--format <format>", "Output format: tui, json", "tui").option("--project <name>", "Show only projects matching name (repeatable)", collect, []).option("--exclude <name>", "Exclude projects matching name (repeatable)", collect, []).option("--refresh <seconds>", "Auto-refresh interval in seconds (0 to disable)", parseInteger, 30).action(async (opts) => {
  assertFormat(opts.format, ["tui", "json"], "report");
  let customRange = null;
  let daySelection = null;
  try {
    if (opts.day && (opts.from || opts.to)) {
      throw new Error("--day cannot be combined with --from or --to");
    }
    daySelection = parseDayFlag(opts.day);
    customRange = parseDateRangeFlags(opts.from, opts.to);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`
  Error: ${message}
`);
    process.exit(1);
  }
  const period = toPeriod(opts.period);
  if (opts.format === "json") {
    await loadPricing();
    if (daySelection || customRange) {
      const range = daySelection?.range ?? customRange;
      const label = daySelection?.label ?? formatDateRangeLabel(opts.from, opts.to);
      const periodKey = daySelection ? "day" : "custom";
      const projects = filterProjectsByName(
        await parseAllSessions(range, opts.provider),
        opts.project,
        opts.exclude
      );
      console.log(JSON.stringify(await attachPlanSummaries(buildJsonReport(projects, label, periodKey)), null, 2));
    } else {
      await runJsonReport(period, opts.provider, opts.project, opts.exclude);
    }
    return;
  }
  const customRangeLabel = customRange ? formatDateRangeLabel(opts.from, opts.to) : void 0;
  await renderDashboard(period, opts.provider, opts.refresh, opts.project, opts.exclude, customRange, customRangeLabel, daySelection?.day);
});
function buildPeriodData(label, projects) {
  const sessions = projects.flatMap((p) => p.sessions);
  const catTotals = {};
  const modelTotals = {};
  let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0;
  for (const sess of sessions) {
    inputTokens += sess.totalInputTokens;
    outputTokens += sess.totalOutputTokens;
    cacheReadTokens += sess.totalCacheReadTokens;
    cacheWriteTokens += sess.totalCacheWriteTokens;
    for (const [cat, d] of Object.entries(sess.categoryBreakdown)) {
      if (!catTotals[cat]) catTotals[cat] = { turns: 0, cost: 0, editTurns: 0, oneShotTurns: 0 };
      catTotals[cat].turns += d.turns;
      catTotals[cat].cost += d.costUSD;
      catTotals[cat].editTurns += d.editTurns;
      catTotals[cat].oneShotTurns += d.oneShotTurns;
    }
    for (const [model, d] of Object.entries(sess.modelBreakdown)) {
      if (!modelTotals[model]) modelTotals[model] = { calls: 0, cost: 0 };
      modelTotals[model].calls += d.calls;
      modelTotals[model].cost += d.costUSD;
    }
  }
  return {
    label,
    cost: projects.reduce((s, p) => s + p.totalCostUSD, 0),
    calls: projects.reduce((s, p) => s + p.totalApiCalls, 0),
    sessions: projects.reduce((s, p) => s + p.sessions.length, 0),
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    categories: Object.entries(catTotals).sort(([, a], [, b]) => b.cost - a.cost).map(([cat, d]) => ({ name: CATEGORY_LABELS[cat] ?? cat, ...d })),
    models: Object.entries(modelTotals).sort(([, a], [, b]) => b.cost - a.cost).map(([name, d]) => ({ name, ...d }))
  };
}
program.command("status").description("Compact status output (today + month)").option("--format <format>", "Output format: terminal, menubar-json, json", "terminal").option("--provider <provider>", "Filter by provider (e.g. claude, gemini, cursor, copilot)", "all").option("--project <name>", "Show only projects matching name (repeatable)", collect, []).option("--exclude <name>", "Exclude projects matching name (repeatable)", collect, []).option("--period <period>", "Primary period for menubar-json: today, week, 30days, month, all", "today").option("--day <date>", "Single day for menubar-json (YYYY-MM-DD, today, or yesterday). Overrides --period when set").option("--from <date>", "Start date (YYYY-MM-DD) for custom range").option("--to <date>", "End date (YYYY-MM-DD) for custom range").option("--days <dates>", "Comma-separated dates (YYYY-MM-DD) for multi-day selection").option("--no-optimize", "Skip optimize findings (menubar-json only, faster)").action(async (opts) => {
  assertFormat(opts.format, ["terminal", "menubar-json", "json"], "status");
  if (opts.day && (opts.from || opts.to)) {
    process.stderr.write("error: --day cannot be combined with --from or --to\n");
    process.exit(1);
  }
  if (opts.days && (opts.day || opts.from || opts.to)) {
    process.stderr.write("error: --days cannot be combined with --day, --from, or --to\n");
    process.exit(1);
  }
  await loadPricing();
  const pf = opts.provider;
  const fp = (p) => filterProjectsByName(p, opts.project, opts.exclude);
  if (opts.format === "menubar-json") {
    const daysSelection = parseDaysFlag(opts.days);
    const customRange = daysSelection ? null : parseDateRangeFlags(opts.from, opts.to);
    const daySelection = parseDayFlag(opts.day);
    const periodInfo = daysSelection ? { range: daysSelection.range, label: daysSelection.label } : customRange ? { range: customRange, label: formatDateRangeLabel(opts.from, opts.to) } : daySelection ?? getDateRange(opts.period);
    const now = /* @__PURE__ */ new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayRange = { start: todayStart, end: now };
    const todayStr = toDateString(todayStart);
    const yesterdayStr = toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    const rangeStartStr = toDateString(periodInfo.range.start);
    const rangeEndStr = toDateString(periodInfo.range.end);
    const historicalRangeEndStr = rangeEndStr < yesterdayStr ? rangeEndStr : yesterdayStr;
    const isAllProviders = pf === "all";
    let todayAllProjects = null;
    let todayAllDays = null;
    const getTodayAllProjects = async () => {
      if (!todayAllProjects) {
        todayAllProjects = fp(await parseAllSessions(todayRange, "all"));
      }
      return todayAllProjects;
    };
    const getTodayAllDays = async () => {
      if (!todayAllDays) {
        todayAllDays = aggregateProjectsIntoDays(await getTodayAllProjects());
      }
      return todayAllDays;
    };
    let currentData;
    let scanProjects;
    let scanRange;
    let cache;
    let todayProviderData = null;
    if (isAllProviders) {
      cache = await hydrateCache();
      const todayProjects = await getTodayAllProjects();
      const todayDays = await getTodayAllDays();
      const historicalDays = rangeStartStr <= historicalRangeEndStr ? getDaysInRange(cache, rangeStartStr, historicalRangeEndStr) : [];
      const todayInRange = todayDays.filter((d) => d.date >= rangeStartStr && d.date <= rangeEndStr);
      const unfilteredDays = [...historicalDays, ...todayInRange].sort((a, b) => a.date.localeCompare(b.date));
      const allDays = daysSelection ? unfilteredDays.filter((d) => daysSelection.days.has(d.date)) : unfilteredDays;
      currentData = buildPeriodDataFromDays(allDays, periodInfo.label);
      const isTodayOnly = rangeStartStr === todayStr && rangeEndStr === todayStr;
      if (isTodayOnly) {
        scanProjects = todayProjects;
        scanRange = todayRange;
      } else {
        const rawProjects = fp(await parseAllSessions(periodInfo.range, "all"));
        scanProjects = daysSelection ? filterProjectsByDays(rawProjects, daysSelection.days) : rawProjects;
        scanRange = periodInfo.range;
      }
    } else {
      cache = await loadDailyCache();
      const rawProviderProjects = fp(await parseAllSessions(periodInfo.range, pf));
      const fullProjects = daysSelection ? filterProjectsByDays(rawProviderProjects, daysSelection.days) : rawProviderProjects;
      todayProviderData = buildPeriodData(periodInfo.label, fullProjects);
      currentData = todayProviderData;
      scanProjects = fullProjects;
      scanRange = periodInfo.range;
    }
    if (isAllProviders) {
      currentData = buildPeriodData(periodInfo.label, scanProjects);
    }
    const allProviders = await getAllProviders();
    const displayNameByName = new Map(allProviders.map((p) => [p.name, p.displayName]));
    const providers = [];
    if (isAllProviders) {
      const unfilteredProviderDays = [
        ...rangeStartStr <= historicalRangeEndStr ? getDaysInRange(cache, rangeStartStr, historicalRangeEndStr) : [],
        ...(await getTodayAllDays()).filter((d) => d.date >= rangeStartStr && d.date <= rangeEndStr)
      ];
      const allDaysForProviders = daysSelection ? unfilteredProviderDays.filter((d) => daysSelection.days.has(d.date)) : unfilteredProviderDays;
      const providerTotals = {};
      for (const d of allDaysForProviders) {
        for (const [name, p] of Object.entries(d.providers)) {
          providerTotals[name] = (providerTotals[name] ?? 0) + p.cost;
        }
      }
      for (const [name, cost] of Object.entries(providerTotals)) {
        providers.push({ name: displayNameByName.get(name) ?? name, cost });
      }
      for (const p of allProviders) {
        if (providers.some((pc) => pc.name === p.displayName)) continue;
        const sources = await p.discoverSessions();
        if (sources.length > 0) providers.push({ name: p.displayName, cost: 0 });
      }
    } else {
      const display = displayNameByName.get(pf) ?? pf;
      providers.push({ name: display, cost: currentData.cost });
    }
    const historyStartStr = toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - BACKFILL_DAYS));
    const allCacheDays = getDaysInRange(cache, historyStartStr, yesterdayStr);
    let dailyHistory;
    if (isAllProviders) {
      const todayDays = (await getTodayAllDays()).filter((d) => d.date === todayStr);
      const fullHistory = [...allCacheDays, ...todayDays];
      dailyHistory = fullHistory.map((d) => {
        const topModels = Object.entries(d.models).filter(([name]) => name !== "<synthetic>").sort(([, a], [, b]) => b.cost - a.cost).slice(0, 5).map(([name, m]) => ({
          name,
          cost: m.cost,
          calls: m.calls,
          inputTokens: m.inputTokens,
          outputTokens: m.outputTokens
        }));
        return {
          date: d.date,
          cost: d.cost,
          calls: d.calls,
          inputTokens: d.inputTokens,
          outputTokens: d.outputTokens,
          cacheReadTokens: d.cacheReadTokens,
          cacheWriteTokens: d.cacheWriteTokens,
          topModels
        };
      });
    } else {
      const emptyModels = [];
      const historyFromCache = allCacheDays.map((d) => {
        const prov = d.providers[pf] ?? { calls: 0, cost: 0 };
        return {
          date: d.date,
          cost: prov.cost,
          calls: prov.calls,
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          topModels: emptyModels
        };
      });
      const todayFromParse = aggregateProjectsIntoDays(scanProjects).filter((d) => d.date === todayStr).map((d) => {
        const prov = d.providers[pf] ?? { calls: 0, cost: 0 };
        return {
          date: d.date,
          cost: prov.cost,
          calls: prov.calls,
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          topModels: emptyModels
        };
      });
      dailyHistory = [...historyFromCache, ...todayFromParse];
    }
    const home = homedir37();
    const friendlyProject = (p) => {
      const resolved = p.projectPath || p.project;
      if (resolved === home || resolved === home + "/") return "Home";
      return resolved.split("/").filter(Boolean).pop() || p.project;
    };
    currentData.projects = scanProjects.map((p) => ({
      name: friendlyProject(p),
      cost: p.totalCostUSD,
      sessions: p.sessions.length,
      sessionDetails: [...p.sessions].sort((a, b) => b.totalCostUSD - a.totalCostUSD).slice(0, 10).map((s) => ({
        cost: s.totalCostUSD,
        calls: s.apiCalls,
        inputTokens: s.totalInputTokens,
        outputTokens: s.totalOutputTokens,
        date: s.firstTimestamp?.split("T")[0] ?? "",
        models: Object.entries(s.modelBreakdown).map(([name, m]) => ({ name, cost: m.costUSD })).sort((a, b) => b.cost - a.cost).slice(0, 3)
      }))
    }));
    const effMap = aggregateModelEfficiency(scanProjects);
    currentData.modelEfficiency = [...effMap.entries()].map(([name, eff]) => ({
      name,
      costPerEdit: eff.costPerEditUSD,
      oneShotRate: eff.oneShotRate
    }));
    const retryTaxByModel = [...effMap.values()].filter((m) => m.retries > 0 && m.editTurns > 0).map((m) => ({
      name: m.model,
      taxUSD: m.retries * (m.editCostUSD / m.editTurns),
      retries: m.retries,
      retriesPerEdit: m.retriesPerEdit
    })).sort((a, b) => b.taxUSD - a.taxUSD);
    const retryTax = {
      totalUSD: retryTaxByModel.reduce((s, m) => s + m.taxUSD, 0),
      retries: retryTaxByModel.reduce((s, m) => s + m.retries, 0),
      editTurns: [...effMap.values()].filter((m) => m.retries > 0).reduce((s, m) => s + m.editTurns, 0),
      byModel: retryTaxByModel.slice(0, 5)
    };
    currentData.topSessions = scanProjects.flatMap(
      (p) => p.sessions.map((s) => ({
        project: friendlyProject(p),
        cost: s.totalCostUSD,
        calls: s.apiCalls,
        date: s.firstTimestamp?.split("T")[0] ?? ""
      }))
    ).sort((a, b) => b.cost - a.cost).slice(0, 5);
    const reliableModels = [...effMap.values()].filter((m) => m.oneShotRate !== null && m.oneShotRate >= 90 && m.editTurns >= 5 && (m.costPerEditUSD ?? 0) >= 0.01).sort((a, b) => (a.costPerEditUSD ?? Infinity) - (b.costPerEditUSD ?? Infinity));
    const baseline = reliableModels[0];
    const routingWasteByModel = baseline ? [...effMap.values()].filter((m) => m.model !== baseline.model && m.editTurns > 0 && (m.costPerEditUSD ?? 0) > (baseline.costPerEditUSD ?? 0)).map((m) => {
      const counterfactual = m.editTurns * (baseline.costPerEditUSD ?? 0);
      return {
        name: m.model,
        costPerEdit: m.costPerEditUSD ?? 0,
        editTurns: m.editTurns,
        actualUSD: m.editCostUSD,
        counterfactualUSD: counterfactual,
        savingsUSD: m.editCostUSD - counterfactual
      };
    }).filter((m) => m.savingsUSD > 0).sort((a, b) => b.savingsUSD - a.savingsUSD) : [];
    const routingWaste = {
      totalSavingsUSD: routingWasteByModel.reduce((s, m) => s + m.savingsUSD, 0),
      baselineModel: baseline?.model ?? "",
      baselineCostPerEdit: baseline?.costPerEditUSD ?? 0,
      byModel: routingWasteByModel.slice(0, 5)
    };
    const breakdowns = (() => {
      const toolMap = {};
      const skillMap = {};
      const subagentMap = {};
      const mcpMap = {};
      for (const p of scanProjects) for (const s of p.sessions) {
        for (const [t, d] of Object.entries(s.toolBreakdown)) {
          if (!t.startsWith("lang:")) toolMap[t] = (toolMap[t] ?? 0) + d.calls;
        }
        for (const [sk, d] of Object.entries(s.skillBreakdown)) {
          const e = skillMap[sk] ?? { turns: 0, cost: 0 };
          e.turns += d.turns;
          e.cost += d.costUSD;
          skillMap[sk] = e;
        }
        for (const [sa, d] of Object.entries(s.subagentBreakdown)) {
          const e = subagentMap[sa] ?? { calls: 0, cost: 0 };
          e.calls += d.calls;
          e.cost += d.costUSD;
          subagentMap[sa] = e;
        }
        for (const [m, d] of Object.entries(s.mcpBreakdown)) {
          mcpMap[m] = (mcpMap[m] ?? 0) + d.calls;
        }
      }
      return {
        tools: Object.entries(toolMap).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, calls]) => ({ name, calls })),
        skills: Object.entries(skillMap).sort(([, a], [, b]) => b.cost - a.cost).slice(0, 10).map(([name, d]) => ({ name, ...d })),
        subagents: Object.entries(subagentMap).sort(([, a], [, b]) => b.cost - a.cost).slice(0, 10).map(([name, d]) => ({ name, ...d })),
        mcpServers: Object.entries(mcpMap).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, calls]) => ({ name, calls }))
      };
    })();
    const optimize = opts.optimize === false ? null : await scanAndDetect(scanProjects, scanRange);
    console.log(JSON.stringify(buildMenubarPayload(currentData, providers, optimize, dailyHistory, retryTax, routingWaste, breakdowns)));
    return;
  }
  if (opts.format === "json") {
    const todayProjects = fp(await parseAllSessions(getDateRange("today").range, pf));
    const todayData = buildPeriodData("today", todayProjects);
    clearSessionCache();
    const monthProjects = fp(await parseAllSessions(getDateRange("month").range, pf));
    const monthData = buildPeriodData("month", monthProjects);
    clearSessionCache();
    const { code, rate: rate2 } = getCurrency();
    const payload = {
      currency: code,
      today: { cost: Math.round(todayData.cost * rate2 * 100) / 100, calls: todayData.calls },
      month: { cost: Math.round(monthData.cost * rate2 * 100) / 100, calls: monthData.calls }
    };
    console.log(JSON.stringify(await attachPlanSummaries(payload)));
    return;
  }
  const monthProjects2 = fp(await parseAllSessions(getDateRange("month").range, pf));
  clearSessionCache();
  console.log(renderStatusBar(monthProjects2));
});
program.command("today").description("Today's usage dashboard").option("--provider <provider>", "Filter by provider (e.g. claude, gemini, cursor, copilot)", "all").option("--format <format>", "Output format: tui, json", "tui").option("--project <name>", "Show only projects matching name (repeatable)", collect, []).option("--exclude <name>", "Exclude projects matching name (repeatable)", collect, []).option("--refresh <seconds>", "Auto-refresh interval in seconds (0 to disable)", parseInteger, 30).action(async (opts) => {
  assertFormat(opts.format, ["tui", "json"], "today");
  if (opts.format === "json") {
    await runJsonReport("today", opts.provider, opts.project, opts.exclude);
    return;
  }
  await renderDashboard("today", opts.provider, opts.refresh, opts.project, opts.exclude);
});
program.command("month").description("This month's usage dashboard").option("--provider <provider>", "Filter by provider (e.g. claude, gemini, cursor, copilot)", "all").option("--format <format>", "Output format: tui, json", "tui").option("--project <name>", "Show only projects matching name (repeatable)", collect, []).option("--exclude <name>", "Exclude projects matching name (repeatable)", collect, []).option("--refresh <seconds>", "Auto-refresh interval in seconds (0 to disable)", parseInteger, 30).action(async (opts) => {
  assertFormat(opts.format, ["tui", "json"], "month");
  if (opts.format === "json") {
    await runJsonReport("month", opts.provider, opts.project, opts.exclude);
    return;
  }
  await renderDashboard("month", opts.provider, opts.refresh, opts.project, opts.exclude);
});
program.command("export").description("Export usage data to CSV or JSON").option("-f, --format <format>", "Export format: csv, json", "csv").option("-o, --output <path>", "Output file path").option("--from <date>", "Start date (YYYY-MM-DD). Exports a single custom period when set").option("--to <date>", "End date (YYYY-MM-DD). Exports a single custom period when set").option("--provider <provider>", "Filter by provider (e.g. claude, gemini, cursor, copilot)", "all").option("--project <name>", "Show only projects matching name (repeatable)", collect, []).option("--exclude <name>", "Exclude projects matching name (repeatable)", collect, []).action(async (opts) => {
  assertFormat(opts.format, ["csv", "json"], "export");
  await loadPricing();
  const pf = opts.provider;
  const fp = (p) => filterProjectsByName(p, opts.project, opts.exclude);
  let customRange = null;
  try {
    customRange = parseDateRangeFlags(opts.from, opts.to);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`
  Error: ${message}
`);
    process.exit(1);
  }
  let periods;
  if (customRange) {
    periods = [{ label: formatDateRangeLabel(opts.from, opts.to), projects: fp(await parseAllSessions(customRange, pf)) }];
    clearSessionCache();
  } else {
    const thirtyDayProjects = fp(await parseAllSessions(getDateRange("30days").range, pf));
    clearSessionCache();
    periods = [
      { label: "Today", projects: filterProjectsByDateRange(thirtyDayProjects, getDateRange("today").range) },
      { label: "7 Days", projects: filterProjectsByDateRange(thirtyDayProjects, getDateRange("week").range) },
      { label: "30 Days", projects: thirtyDayProjects }
    ];
  }
  if (periods.every((p) => p.projects.length === 0)) {
    console.log("\n  No usage data found.\n");
    return;
  }
  const defaultName = `codeburn-${toDateString(/* @__PURE__ */ new Date())}`;
  const outputPath = opts.output ?? `${defaultName}.${opts.format}`;
  let savedPath;
  try {
    if (opts.format === "json") {
      savedPath = await exportJson(periods, outputPath);
    } else {
      savedPath = await exportCsv(periods, outputPath);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`
  Export failed: ${message}
`);
    process.exit(1);
  }
  const exportedLabel = customRange ? formatDateRangeLabel(opts.from, opts.to) : "Today + 7 Days + 30 Days";
  console.log(`
  Exported (${exportedLabel}) to: ${savedPath}
`);
});
program.command("menubar").description("Install and launch the macOS menubar app (one command, no clone)").option("--force", "Reinstall even if an older copy is already in ~/Applications").action(async (opts) => {
  try {
    const result = await installMenubarApp({ force: opts.force });
    console.log(`
  Ready. ${result.installedPath}
`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`
  Menubar install failed: ${message}
`);
    process.exit(1);
  }
});
program.command("currency [code]").description("Set display currency (e.g. codeburn currency GBP)").option("--symbol <symbol>", "Override the currency symbol").option("--reset", "Reset to USD (removes currency config)").action(async (code, opts) => {
  if (opts?.reset) {
    const config2 = await readConfig();
    delete config2.currency;
    await saveConfig(config2);
    console.log("\n  Currency reset to USD.\n");
    return;
  }
  if (!code) {
    const { code: activeCode, rate: rate3, symbol: symbol2 } = getCurrency();
    if (activeCode === "USD" && rate3 === 1) {
      console.log("\n  Currency: USD (default)");
      console.log(`  Config: ${getConfigFilePath()}
`);
    } else {
      console.log(`
  Currency: ${activeCode}`);
      console.log(`  Symbol: ${symbol2}`);
      console.log(`  Rate: 1 USD = ${rate3} ${activeCode}`);
      console.log(`  Config: ${getConfigFilePath()}
`);
    }
    return;
  }
  const upperCode = code.toUpperCase();
  if (!isValidCurrencyCode(upperCode)) {
    console.error(`
  "${code}" is not a valid ISO 4217 currency code.
`);
    process.exitCode = 1;
    return;
  }
  const config = await readConfig();
  config.currency = {
    code: upperCode,
    ...opts?.symbol ? { symbol: opts.symbol } : {}
  };
  await saveConfig(config);
  await loadCurrency();
  const { rate: rate2, symbol } = getCurrency();
  console.log(`
  Currency set to ${upperCode}.`);
  console.log(`  Symbol: ${symbol}`);
  console.log(`  Rate: 1 USD = ${rate2} ${upperCode}`);
  console.log(`  Config saved to ${getConfigFilePath()}
`);
});
program.command("model-alias [from] [to]").description("Map a provider model name to a canonical one for pricing (e.g. codeburn model-alias my-model claude-opus-4-6)").option("--remove <from>", "Remove an alias").option("--list", "List configured aliases").action(async (from, to, opts) => {
  const config = await readConfig();
  const aliases = config.modelAliases ?? {};
  if (opts?.list || !from && !opts?.remove) {
    const entries = Object.entries(aliases);
    if (entries.length === 0) {
      console.log("\n  No model aliases configured.");
      console.log(`  Config: ${getConfigFilePath()}
`);
    } else {
      console.log("\n  Model aliases:");
      for (const [src, dst] of entries) {
        console.log(`    ${src} -> ${dst}`);
      }
      console.log(`  Config: ${getConfigFilePath()}
`);
    }
    return;
  }
  if (opts?.remove) {
    if (!(opts.remove in aliases)) {
      console.error(`
  Alias not found: ${opts.remove}
`);
      process.exitCode = 1;
      return;
    }
    delete aliases[opts.remove];
    config.modelAliases = Object.keys(aliases).length > 0 ? aliases : void 0;
    await saveConfig(config);
    console.log(`
  Removed alias: ${opts.remove}
`);
    return;
  }
  if (!from || !to) {
    console.error("\n  Usage: codeburn model-alias <from> <to>\n");
    process.exitCode = 1;
    return;
  }
  aliases[from] = to;
  config.modelAliases = aliases;
  await saveConfig(config);
  console.log(`
  Alias saved: ${from} -> ${to}`);
  console.log(`  Config: ${getConfigFilePath()}
`);
});
program.command("plan [action] [id]").description("Show or configure a subscription plan for overage tracking").option("--format <format>", "Output format: text or json", "text").option("--monthly-usd <n>", "Monthly plan price in USD (for custom)", parseNumber).option("--provider <name>", "Provider scope: all, claude, codex, cursor").option("--reset-day <n>", "Day of month plan resets (1-28)", parseInteger, 1).action(async (action, id, opts) => {
  assertFormat(opts?.format ?? "text", ["text", "json"], "plan");
  const mode = action ?? "show";
  const providerOption = opts?.provider;
  if (providerOption !== void 0 && !isPlanProvider(providerOption)) {
    console.error(`
  --provider must be one of: all, claude, codex, cursor; got "${providerOption}".
`);
    process.exitCode = 1;
    return;
  }
  if (mode === "show") {
    const plans = sortedPlans(await readPlans()).filter((plan) => plan.id !== "none").filter((plan) => !providerOption || providerOption === "all" || plan.provider === providerOption);
    if (opts?.format === "json") {
      if (plans.length === 0) {
        console.log(JSON.stringify({ id: "none", monthlyUsd: 0, provider: "all", resetDay: 1, setAt: null }));
        return;
      }
      console.log(JSON.stringify({
        ...toPlanDisplay(plans[0]),
        plans: Object.fromEntries(plans.map((plan) => [plan.provider, toPlanDisplay(plan)]))
      }));
      return;
    }
    if (plans.length === 0) {
      console.log("\n  Plan: none");
      console.log("  API-pricing view is active.");
      console.log(`  Config: ${getConfigFilePath()}
`);
      return;
    }
    console.log(`
  Plans: ${plans.length}`);
    for (const plan of plans) {
      console.log(`  ${plan.provider}: ${planLabel2(plan)} (${plan.id})`);
      console.log(`    Budget: $${plan.monthlyUsd}/month`);
      console.log(`    Reset day: ${clampResetDay(plan.resetDay)}`);
      if (plan.setAt) console.log(`    Set at: ${plan.setAt}`);
    }
    console.log(`  Config: ${getConfigFilePath()}
`);
    return;
  }
  if (mode === "reset") {
    await clearPlan(providerOption);
    if (providerOption) {
      console.log(`
  Plan reset for ${providerOption}.
`);
    } else {
      console.log("\n  Plan reset. API-pricing view is active.\n");
    }
    return;
  }
  if (mode !== "set") {
    console.error("\n  Usage: codeburn plan [set <id> | reset]\n");
    process.exitCode = 1;
    return;
  }
  if (!id || !isPlanId(id)) {
    console.error(`
  Plan id must be one of: ${PLAN_IDS.join(", ")}; got "${id ?? ""}".
`);
    process.exitCode = 1;
    return;
  }
  const resetDay = opts?.resetDay ?? 1;
  if (!Number.isInteger(resetDay) || resetDay < 1 || resetDay > 28) {
    console.error(`
  --reset-day must be an integer from 1 to 28; got ${resetDay}.
`);
    process.exitCode = 1;
    return;
  }
  if (id === "none") {
    await clearPlan(providerOption);
    if (providerOption) {
      console.log(`
  Plan reset for ${providerOption}.
`);
    } else {
      console.log("\n  Plan reset. API-pricing view is active.\n");
    }
    return;
  }
  if (id === "custom") {
    if (opts?.monthlyUsd === void 0) {
      console.error("\n  Custom plans require --monthly-usd <positive number>.\n");
      process.exitCode = 1;
      return;
    }
    const monthlyUsd = opts.monthlyUsd;
    if (!Number.isFinite(monthlyUsd) || monthlyUsd <= 0) {
      console.error(`
  --monthly-usd must be a positive number; got ${opts.monthlyUsd}.
`);
      process.exitCode = 1;
      return;
    }
    const provider = providerOption ?? "all";
    await savePlan({
      id: "custom",
      monthlyUsd,
      provider,
      resetDay,
      setAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log(`
  Plan set to custom ($${monthlyUsd}/month, ${provider}, reset day ${resetDay}).`);
    console.log(`  Config saved to ${getConfigFilePath()}
`);
    return;
  }
  const preset = getPresetPlan(id);
  if (!preset) {
    console.error(`
  Unknown preset "${id}".
`);
    process.exitCode = 1;
    return;
  }
  if (providerOption === "all") {
    console.error(`
  ${id} is a ${preset.provider} plan; omit --provider or use --provider ${preset.provider}.
`);
    process.exitCode = 1;
    return;
  }
  if (providerOption && providerOption !== preset.provider) {
    console.error(`
  ${id} is a ${preset.provider} plan; use --provider ${preset.provider} or omit --provider.
`);
    process.exitCode = 1;
    return;
  }
  await savePlan({
    ...preset,
    resetDay,
    setAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  console.log(`
  Plan set to ${planDisplayName(preset.id)} ($${preset.monthlyUsd}/month).`);
  console.log(`  Provider: ${preset.provider}`);
  console.log(`  Reset day: ${resetDay}`);
  console.log(`  Config saved to ${getConfigFilePath()}
`);
});
program.command("optimize").description("Find token waste and get exact fixes").option("-p, --period <period>", "Analysis period: today, week, 30days, month, all", "30days").option("--provider <provider>", "Filter by provider (e.g. claude, gemini, cursor, copilot)", "all").action(async (opts) => {
  await loadPricing();
  const { range, label } = getDateRange(opts.period);
  const projects = await parseAllSessions(range, opts.provider);
  await runOptimize(projects, label, range);
});
program.command("compare").description("Compare two AI models side-by-side").option("-p, --period <period>", "Analysis period: today, week, 30days, month, all", "all").option("--provider <provider>", "Filter by provider (e.g. claude, gemini, cursor, copilot)", "all").action(async (opts) => {
  await loadPricing();
  const { range } = getDateRange(opts.period);
  await renderCompare(range, opts.provider);
});
program.command("models").description("Per-model token + cost table, optionally exploded by task type").option("-p, --period <period>", "Analysis period: today, week, 30days, month, all", "30days").option("--from <date>", "Custom range start (YYYY-MM-DD)").option("--to <date>", "Custom range end (YYYY-MM-DD)").option("--provider <provider>", "Filter by provider (e.g. claude, codex, cursor)", "all").option("--task <category>", "Filter to one task type (e.g. feature, debugging, refactoring)").option("--by-task", "One row per (provider, model, task) instead of one row per (provider, model)").option("--top <n>", "Show only the top N rows", (v) => parseInt(v, 10)).option("--min-cost <usd>", "Hide rows below this cost threshold", (v) => parseFloat(v)).option("--no-totals", "Suppress the footer totals row").option("--format <format>", "Output format: table, markdown, json, csv", "table").action(async (opts) => {
  const { aggregateModels: aggregateModels2, renderTable: renderTable2, renderMarkdown: renderMarkdown2, renderJson: renderJson2, renderCsv: renderCsv2 } = await Promise.resolve().then(() => (init_models_report(), models_report_exports));
  await loadPricing();
  let range;
  if (opts.from || opts.to) {
    const customRange = parseDateRangeFlags(opts.from, opts.to);
    if (!customRange) {
      process.stderr.write("codeburn: --from and --to must be valid YYYY-MM-DD dates\n");
      process.exit(1);
    }
    range = customRange;
  } else {
    range = getDateRange(opts.period).range;
  }
  const projects = await parseAllSessions(range, opts.provider);
  const rows = await aggregateModels2(projects, {
    byTask: !!opts.byTask,
    taskFilter: opts.task,
    topN: typeof opts.top === "number" && Number.isFinite(opts.top) ? opts.top : void 0,
    minCost: typeof opts.minCost === "number" && Number.isFinite(opts.minCost) ? opts.minCost : 0.01
  });
  const fmt = (opts.format ?? "table").toLowerCase();
  if (rows.length === 0 && (fmt === "table" || fmt === "markdown")) {
    process.stdout.write("No model usage found for the selected period.\n");
    return;
  }
  if (fmt === "json") {
    process.stdout.write(renderJson2(rows) + "\n");
  } else if (fmt === "csv") {
    process.stdout.write(renderCsv2(rows, { byTask: !!opts.byTask }) + "\n");
  } else if (fmt === "markdown" || fmt === "md") {
    process.stdout.write(renderMarkdown2(rows, { byTask: !!opts.byTask, showTotals: opts.totals !== false }) + "\n");
  } else if (fmt === "table") {
    process.stdout.write(renderTable2(rows, { byTask: !!opts.byTask, showTotals: opts.totals !== false }) + "\n");
  } else {
    process.stderr.write(`codeburn: unknown --format "${opts.format}". Choose table, markdown, json, or csv.
`);
    process.exit(1);
  }
});
program.command("yield").description("Track which AI spend shipped to main vs reverted/abandoned (experimental)").option("-p, --period <period>", "Analysis period: today, week, 30days, month, all", "week").action(async (opts) => {
  const { computeYield: computeYield2, formatYieldSummary: formatYieldSummary2 } = await Promise.resolve().then(() => (init_yield(), yield_exports));
  await loadPricing();
  const { range, label } = getDateRange(opts.period);
  console.log(`
  Analyzing yield for ${label}...
`);
  const summary = await computeYield2(range, process.cwd());
  console.log(formatYieldSummary2(summary));
});
program.command("antigravity-hook").description("Install or remove exact Antigravity CLI usage capture").argument("<action>", "install or uninstall").option("--force", "Replace an existing custom Antigravity CLI statusLine command").action(async (action, opts) => {
  try {
    if (action === "install") {
      const result = await installAntigravityStatusLineHook(!!opts.force);
      console.log(result === "already-installed" ? "\n  Antigravity CLI usage capture is already installed.\n" : "\n  Antigravity CLI usage capture installed.\n");
      return;
    }
    if (action === "uninstall") {
      const result = await uninstallAntigravityStatusLineHook();
      console.log(result === "not-installed" ? "\n  Antigravity CLI usage capture is not installed.\n" : result === "restored" ? "\n  Antigravity CLI usage capture removed; previous statusLine restored.\n" : "\n  Antigravity CLI usage capture removed.\n");
      return;
    }
    console.error("\n  Usage: codeburn antigravity-hook <install|uninstall>\n");
    process.exit(1);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`
  Antigravity hook failed: ${message}
`);
    process.exit(1);
  }
});
program.command("agy-statusline-hook", { hidden: true }).description("Internal Antigravity CLI statusLine hook").action(async () => {
  await runAgyStatusLineHook();
});
program.parse();
//# sourceMappingURL=main.js.map