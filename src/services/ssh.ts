import type { RequestOptions, SandboxRef, SshAccess, SshValidation } from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxIdOf } from "@/core/utils.js"

/** Manages SSH access credentials for a sandbox. */
export class SshClient {
  constructor(private readonly transport: Leap0Transport) {}

  createAccess(sandbox: SandboxRef, options: RequestOptions = {}): Promise<SshAccess> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/ssh/access`, { method: "POST" }, options)
  }

  async deleteAccess(sandbox: SandboxRef, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/ssh/access`, { method: "DELETE" }, options)
  }

  validateAccess(sandbox: SandboxRef, accessId: string, password: string, options: RequestOptions = {}): Promise<SshValidation> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/ssh/validate`, { method: "POST", body: jsonBody({ access_id: accessId, password }) }, options)
  }

  regenerateAccess(sandbox: SandboxRef, options: RequestOptions = {}): Promise<SshAccess> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/ssh/regen`, { method: "POST" }, options)
  }
}
