import Foundation

/// Single entry point for spawning the `codeburn` CLI. All callers route through here so the
/// binary argv is validated once and no code path ever passes user-influenced strings through
/// a shell (`/bin/zsh -c`, `open --args`, AppleScript). This closes the shell-injection attack
/// surface end-to-end.
enum CodeburnCLI {
    /// Matches a plain file path / program name: alphanumerics, dot, underscore, slash, hyphen,
    /// space. Deliberately excludes shell metacharacters (`$`, `;`, `&`, `|`, quotes, backticks,
    /// newlines) so a malicious `CODEBURN_BIN="codeburn; rm -rf ~"` can't slip through.
    private static let safeArgPattern = try! NSRegularExpression(pattern: "^[A-Za-z0-9 ._/\\-]+$")

    private static let additionalPathEntries: [String] = {
        var entries = ["/opt/homebrew/bin", "/usr/local/bin"]
        let home = NSHomeDirectory()

        // nvm: resolve the default alias to find the active node version's bin directory.
        let nvmDir = (ProcessInfo.processInfo.environment["NVM_DIR"] as String?) ?? home + "/.nvm"
        if let alias = try? String(contentsOfFile: nvmDir + "/alias/default", encoding: .utf8)
            .trimmingCharacters(in: .whitespacesAndNewlines),
           !alias.isEmpty {
            let prefix = alias.hasPrefix("v") ? alias : "v" + alias
            let versionsDir = nvmDir + "/versions/node"
            if let candidates = try? FileManager.default.contentsOfDirectory(atPath: versionsDir) {
                let match = candidates
                    .filter { $0.hasPrefix(prefix) }
                    .sorted()
                    .last
                if let match {
                    entries.append(versionsDir + "/" + match + "/bin")
                }
            }
        }

        // volta
        let voltaBin = home + "/.volta/bin"
        if FileManager.default.fileExists(atPath: voltaBin) { entries.append(voltaBin) }

        // fnm
        let fnmBin = home + "/.local/share/fnm/aliases/default/bin"
        if FileManager.default.fileExists(atPath: fnmBin) { entries.append(fnmBin) }

        return entries
    }()

    /// Returns the argv that launches the CLI. Dev override via `CODEBURN_BIN` is honoured only
    /// if every whitespace-delimited token passes `safeArgPattern`. Otherwise falls back to the
    /// plain `codeburn` name (resolved via PATH).
    static func baseArgv() -> [String] {
        guard let raw = ProcessInfo.processInfo.environment["CODEBURN_BIN"], !raw.isEmpty else {
            return ["codeburn"]
        }
        let parts = raw.split(separator: " ", omittingEmptySubsequences: true).map(String.init)
        guard parts.allSatisfy(isSafe) else {
            NSLog("CodeBurn: refusing unsafe CODEBURN_BIN; using default 'codeburn'")
            return ["codeburn"]
        }
        return parts
    }

    /// Builds a `Process` that runs the CLI with the given subcommand args. Uses `/usr/bin/env`
    /// so PATH lookup happens without involving a shell, and augments PATH with Homebrew
    /// defaults. Caller sets stdout/stderr pipes and calls `run()`.
    static func makeProcess(subcommand: [String]) -> Process {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        var environment = ProcessInfo.processInfo.environment
        environment["PATH"] = augmentedPath(environment["PATH"] ?? "")
        process.environment = environment
        // `env --` treats everything following as argv, not VAR=val pairs -- guards against an
        // argument accidentally resembling an env assignment.
        process.arguments = ["--"] + baseArgv() + subcommand
        // The menubar runs as an accessory app with no foreground window, and macOS
        // background-throttles accessory apps and their children. Without this lift the
        // codeburn subprocess parses 5-10x slower than the same command run from a
        // user-interactive terminal, which starves the 15s refresh cadence on large corpora.
        process.qualityOfService = .userInitiated
        return process
    }

    static func isSafe(_ s: String) -> Bool {
        let range = NSRange(s.startIndex..<s.endIndex, in: s)
        return safeArgPattern.firstMatch(in: s, range: range) != nil
    }

    private static func augmentedPath(_ existing: String) -> String {
        var parts = existing.split(separator: ":", omittingEmptySubsequences: true).map(String.init)
        for extra in additionalPathEntries where !parts.contains(extra) {
            parts.append(extra)
        }
        return parts.joined(separator: ":")
    }
}
