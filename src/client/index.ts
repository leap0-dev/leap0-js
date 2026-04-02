import { resolveConfig } from "@/config/index.js"
import type { Leap0ConfigInput, SandboxData } from "@/models/index.js"
import { initOtel } from "@/core/otel.js"
import { Leap0Transport } from "@/core/transport.js"
import {
  CodeInterpreterClient,
  DesktopClient,
  FilesystemClient,
  GitClient,
  LspClient,
  ProcessClient,
  PtyClient,
  SandboxesClient,
  SnapshotsClient,
  SshClient,
  TemplatesClient,
} from "@/services/index.js"

import { Sandbox } from "@/client/sandbox.js"

/**
 * Top-level Leap0 SDK client that exposes all service groups.
 */
export class Leap0Client {
  private readonly transport: Leap0Transport

  readonly sandboxes: SandboxesClient<Sandbox>
  readonly snapshots: SnapshotsClient<Sandbox>
  readonly templates: TemplatesClient
  readonly filesystem: FilesystemClient
  readonly git: GitClient
  readonly process: ProcessClient
  readonly pty: PtyClient
  readonly lsp: LspClient
  readonly ssh: SshClient
  readonly codeInterpreter: CodeInterpreterClient
  readonly desktop: DesktopClient

  /** Creates a client using explicit config or environment variables. */
  constructor(config: Leap0ConfigInput = {}) {
    const resolved = resolveConfig(config)
    this.transport = new Leap0Transport(resolved)
    if (resolved.sdkOtelEnabled) {
      initOtel(resolved)
    }

    const wrapSandbox = (data: SandboxData) => new Sandbox(this, data)

    this.sandboxes = new SandboxesClient(this.transport, resolved.sandboxDomain, wrapSandbox)
    this.snapshots = new SnapshotsClient(this.transport, wrapSandbox)
    this.templates = new TemplatesClient(this.transport)
    this.filesystem = new FilesystemClient(this.transport)
    this.git = new GitClient(this.transport)
    this.process = new ProcessClient(this.transport)
    this.pty = new PtyClient(this.transport, resolved.sandboxDomain)
    this.lsp = new LspClient(this.transport)
    this.ssh = new SshClient(this.transport)
    this.codeInterpreter = new CodeInterpreterClient(this.transport, resolved.sandboxDomain)
    this.desktop = new DesktopClient(this.transport, resolved.sandboxDomain)
  }

  /**
   * Fetches a sandbox by ID.
   *
   * Args:
   *   sandboxId: Sandbox identifier.
   *
   * Returns:
   *   The sandbox payload.
   */
  getSandbox(sandboxId: string): Promise<Sandbox> {
    return this.sandboxes.get(sandboxId)
  }

  /**
   * Creates a new sandbox.
   *
   * Args:
   *   params: Sandbox creation parameters.
   *   options: Optional request settings.
   *
   * Returns:
   *   The created sandbox payload.
   */
  createSandbox(params?: Parameters<SandboxesClient<Sandbox>["create"]>[0], options?: Parameters<SandboxesClient<Sandbox>["create"]>[1]): Promise<Sandbox> {
    return this.sandboxes.create(params, options)
  }

  /** Closes the underlying transport. */
  async close(): Promise<void> {
    await this.transport.close()
  }
}

export { Sandbox } from "@/client/sandbox.js"
