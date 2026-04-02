# Leap0 JS SDK

TypeScript SDK for [Leap0](https://leap0.dev), enterprise-grade cloud sandboxes for AI agents.

This package mirrors the Python SDK shape while staying idiomatic for TypeScript: async-first, bound sandbox helpers, and small transport primitives you can build on.

## Install

This SDK is Node.js-only and requires Node.js 20.6.0 or newer. It is not intended for browser runtimes.

```bash
npm install leap0
```

## Quick start

```ts
import { Leap0Client } from "leap0"

const client = new Leap0Client({ apiKey: process.env.LEAP0_API_KEY })
const sandbox = await client.sandboxes.create()

try {
  const result = await sandbox.process.execute({ command: "echo hello from leap0" })
  console.log(result.result.trim())
} finally {
  await sandbox.delete()
  await client.close()
}
```

## Supported imports

Import from `leap0` only:

```ts
import { Leap0Client, SandboxState, type CreateSandboxParams } from "leap0"
```

Deep imports such as `leap0/models`, `leap0/services`, or `leap0/dist/...` are not part of the supported public API.

## Examples

See the [`examples/`](examples/) directory for complete usage examples:

- **[`quickstart.ts`](examples/quickstart.ts)** - Basic code execution
- **[`code_interpreter_stream.ts`](examples/code_interpreter_stream.ts)** - Streaming code execution output
- **[`filesystem_and_git.ts`](examples/filesystem_and_git.ts)** - File and Git operations
- **[`pty.ts`](examples/pty.ts)** - Interactive terminal session
- **[`desktop.ts`](examples/desktop.ts)** - Desktop GUI automation
- **[`snapshots.ts`](examples/snapshots.ts)** - Save and restore sandbox state
- **[`ssh.ts`](examples/ssh.ts)** - Generate and validate SSH access

## Status

This is an initial SDK foundation with the same major resource groups as the Python SDK:

- sandboxes
- snapshots
- templates
- filesystem
- git
- process
- pty
- lsp
- ssh
- code interpreter
- desktop

The public API is exported from `src/index.ts` and compiles to `dist/`.

## Runtime support

- Node.js 20.6.0+
- ESM package (`"type": "module"`)
- Uses Node-specific APIs such as `process.env`, OpenTelemetry Node providers, and `User-Agent` request headers
