# CodeBurn — CLI + macOS menubar app

repo := "github:Findigs/codeburn"

# ─── CLI ──────────────────────────────────────────────

# Install CLI globally from the fork
cli-install:
    npm install -g git+https://github.com/Findigs/codeburn.git

# Update CLI to latest main
cli-update:
    npm uninstall -g codeburn && npm install -g git+https://github.com/Findigs/codeburn.git

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

# Install menubar app to ~/Applications
menubar-install: menubar-build
    mkdir -p ~/Applications
    rm -rf ~/Applications/CodeBurnMenubar.app
    cp -R mac/.build/release/CodeBurnMenubar.app ~/Applications/
    xattr -dr com.apple.quarantine ~/Applications/CodeBurnMenubar.app
    open ~/Applications/CodeBurnMenubar.app

# Remove menubar app from ~/Applications
menubar-clean:
    -pkill -x CodeBurnMenubar
    rm -rf ~/Applications/CodeBurnMenubar.app

# ─── All ─────────────────────────────────────────────

# Install both CLI and menubar app
install: cli-install menubar-install

# Update CLI and rebuild menubar app
update: cli-update menubar-install

# Remove CLI and menubar app
clean: cli-clean menubar-clean

# Run tests
test:
    npx vitest run

# Run Swift tests
test-swift:
    cd mac && swift test
