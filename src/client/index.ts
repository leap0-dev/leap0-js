import { resolveConfig } from "@/config/index.js";
import type { Leap0ConfigInput } from "@/models/index.js";
import { initOtel } from "@/core/otel.js";
import { Leap0Transport } from "@/core/transport.js";
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
} from "@/services/index.js";

import { Sandbox } from "@/client/sandbox.js";

/**
 * Top-level Leap0 SDK client that exposes all service groups.
 */
export class Leap0Client {
  private readonly transport: Leap0Transport;

  readonly sandboxes: SandboxesClient;
  readonly snapshots: SnapshotsClient;
  readonly templates: TemplatesClient;
  readonly filesystem: FilesystemClient;
  readonly git: GitClient;
  readonly process: ProcessClient;
  readonly pty: PtyClient;
  readonly lsp: LspClient;
  readonly ssh: SshClient;
  readonly codeInterpreter: CodeInterpreterClient;
  readonly desktop: DesktopClient;

  /** Creates a client using explicit config or environment variables. */
  constructor(config: Leap0ConfigInput = {}) {
    const resolved = resolveConfig(config);
    this.transport = new Leap0Transport(resolved);
    if (resolved.sdkOtelEnabled) {
      initOtel(resolved);
    }

    this.sandboxes = new SandboxesClient(this.transport);
    this.snapshots = new SnapshotsClient(this.transport);
    this.templates = new TemplatesClient(this.transport);
    this.filesystem = new FilesystemClient(this.transport);
    this.git = new GitClient(this.transport);
    this.process = new ProcessClient(this.transport);
    this.pty = new PtyClient(this.transport);
    this.lsp = new LspClient(this.transport);
    this.ssh = new SshClient(this.transport);
    this.codeInterpreter = new CodeInterpreterClient(this.transport);
    this.desktop = new DesktopClient(this.transport);
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
  async getSandbox(sandboxId: string): Promise<Sandbox> {
    const data = await this.sandboxes.get(sandboxId);
    return new Sandbox(this, data);
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
  async createSandbox(
    params?: Parameters<SandboxesClient["create"]>[0],
    options?: Parameters<SandboxesClient["create"]>[1],
  ): Promise<Sandbox> {
    const data = await this.sandboxes.create(params, options);
    return new Sandbox(this, data);
  }

  /**
   * Resumes a sandbox from a snapshot.
   *
   * Args:
   *   params: Snapshot resume parameters.
   *   options: Optional request settings.
   *
   * Returns:
   *   The restored sandbox payload.
   */
  async resumeSnapshot(
    params: Parameters<SnapshotsClient["resume"]>[0],
    options?: Parameters<SnapshotsClient["resume"]>[1],
  ): Promise<Sandbox> {
    const data = await this.snapshots.resume(params, options);
    return new Sandbox(this, data);
  }

  /** Closes the underlying transport. */
  async close(): Promise<void> {
    await this.transport.close();
  }
}

export { Sandbox } from "@/client/sandbox.js";
