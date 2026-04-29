# CodeBurn — CLI + macOS menubar app

# ─── CLI ──────────────────────────────────────────────

# Install CLI globally from the fork (clone → build → pack → install)
cli-install:
    #!/usr/bin/env bash
    set -euo pipefail
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    git clone --depth 1 https://github.com/Findigs/codeburn.git "$tmp/codeburn"
    cd "$tmp/codeburn"
    npm install --ignore-scripts
    npx --no-install tsup
    npm pack --ignore-scripts
    npm install -g codeburn-*.tgz

# Update CLI to latest main
cli-update:
    -npm uninstall -g codeburn
    just cli-install

# Remove globally installed CLI
cli-clean:
    npm uninstall -g codeburn

# Build CLI from local source
cli-build:
    npm run build

# Run CLI from local source without building
cli-dev *ARGS:
    npx tsx src/cli.ts {{ARGS}}

# ─── Menubar ─────────────────────────────────────────

# Build menubar app (release)
menubar-build:
    cd mac && swift build -c release

# Build and launch menubar app (pointed at local CLI build)
menubar-dev: cli-build
    cd mac && swift build && CODEBURN_BIN="node {{justfile_directory()}}/dist/cli.js" swift run

# Install menubar app from latest GitHub release
menubar-install:
    codeburn menubar --force

# Install menubar app from local source build
menubar-install-local: menubar-build
    -pkill -x CodeBurnMenubar
    mkdir -p ~/bin
    cp mac/.build/release/CodeBurnMenubar ~/bin/
    ~/bin/CodeBurnMenubar &

# Remove menubar app
menubar-clean:
    -pkill -x CodeBurnMenubar
    rm -f ~/bin/CodeBurnMenubar
    rm -rf ~/Applications/CodeBurnMenubar.app

# ─── All ─────────────────────────────────────────────

# Install both CLI and menubar app
install: cli-install menubar-install

# Update both CLI and menubar app
update: cli-update menubar-install

# Remove CLI and menubar app
clean: cli-clean menubar-clean

# Run tests
test:
    npx vitest run

# Run Swift tests
test-swift:
    cd mac && swift test
