import type { SandboxData, SandboxState } from "@/models/index.js";
import {
  CodeInterpreterClient,
  DesktopClient,
  FilesystemClient,
  GitClient,
  LspClient,
  ProcessClient,
  PtyClient,
  SshClient,
} from "@/services/index.js";

import type { Leap0Client } from "@/client/index.js";

type BoundSandboxMethod<Method> = Method extends (
  sandbox: infer _Sandbox,
  ...args: infer Args
) => infer Result
  ? (...args: Args) => Result
  : Method;

type BoundSandboxService<Service extends object> = {
  [Key in keyof Service]: BoundSandboxMethod<Service[Key]>;
};

class SandboxServiceProxy<Service extends object> {
  constructor(
    private readonly service: Service,
    private readonly sandbox: Sandbox,
  ) {}

  get proxy(): BoundSandboxService<Service> {
    return new Proxy(this.service, {
      get: (target, prop, receiver) => {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== "function") {
          return value;
        }
        return (...args: unknown[]) => Reflect.apply(value, target, [this.sandbox, ...args]);
      },
    }) as BoundSandboxService<Service>;
  }
}

/**
 * Bound sandbox handle with convenience methods and resource-scoped helpers.
 */
export class Sandbox implements SandboxData {
  id!: string;
  templateId!: string;
  state!: SandboxState;
  vcpu!: number;
  memoryMib!: number;
  diskMib!: number;
  autoPause!: boolean;
  networkPolicy?: SandboxData["networkPolicy"];
  createdAt!: string;
  [key: string]: unknown;

  readonly filesystem: BoundSandboxService<FilesystemClient>;
  readonly git: BoundSandboxService<GitClient>;
  readonly process: BoundSandboxService<ProcessClient>;
  readonly pty: BoundSandboxService<PtyClient>;
  readonly lsp: BoundSandboxService<LspClient>;
  readonly ssh: BoundSandboxService<SshClient>;
  readonly codeInterpreter: BoundSandboxService<CodeInterpreterClient>;
  readonly desktop: BoundSandboxService<DesktopClient>;

  /** Creates a sandbox handle bound to a parent client. */
  constructor(
    private readonly client: Leap0Client,
    data: SandboxData,
  ) {
    this.update(data);
    this.filesystem = new SandboxServiceProxy(client.filesystem, this).proxy;
    this.git = new SandboxServiceProxy(client.git, this).proxy;
    this.process = new SandboxServiceProxy(client.process, this).proxy;
    this.pty = new SandboxServiceProxy(client.pty, this).proxy;
    this.lsp = new SandboxServiceProxy(client.lsp, this).proxy;
    this.ssh = new SandboxServiceProxy(client.ssh, this).proxy;
    this.codeInterpreter = new SandboxServiceProxy(client.codeInterpreter, this).proxy;
    this.desktop = new SandboxServiceProxy(client.desktop, this).proxy;
  }

  /**
   * Applies fresh sandbox data onto the current handle.
   *
   * Args:
   *   data: Latest sandbox payload.
   *
   * Returns:
   *   The updated sandbox handle.
   */
  update(data: SandboxData): this {
    Object.assign(this, data);
    return this;
  }

  /**
   * Fetches the latest sandbox state from the API.
   *
   * Returns:
   *   The refreshed sandbox handle.
   */
  async refresh(): Promise<this> {
    this.update(await this.client.sandboxes.get(this.id));
    return this;
  }

  /**
   * Pauses the sandbox and updates local state.
   *
   * Args:
   *   options: Optional request settings.
   *
   * Returns:
   *   The paused sandbox handle.
   */
  async pause(options?: { timeout?: number }): Promise<this> {
    this.update(await this.client.sandboxes.pause(this.id, options));
    return this;
  }

  /**
   * Deletes the sandbox.
   *
   * Args:
   *   options: Optional request settings.
   */
  async delete(options?: { timeout?: number }): Promise<void> {
    await this.client.sandboxes.delete(this.id, options);
  }

  /**
   * Returns the public invoke URL for the sandbox.
   *
   * Args:
   *   path: Route path to append.
   *   port: Optional forwarded port.
   *
   * Returns:
   *   The public HTTPS URL.
   */
  invokeUrl(path = "/", port?: number): string {
    return this.client.sandboxes.invokeUrl(this.id, path, port);
  }

  /**
   * Returns the public websocket URL for the sandbox.
   *
   * Args:
   *   path: Route path to append.
   *   port: Optional forwarded port.
   *
   * Returns:
   *   The public websocket URL.
   */
  websocketUrl(path = "/", port?: number): string {
    return this.client.sandboxes.websocketUrl(this.id, path, port);
  }
}
