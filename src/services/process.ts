import type { ProcessResult, RequestOptions, SandboxRef } from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxIdOf } from "@/core/utils.js"

/** Executes one-shot commands inside a sandbox. */
export class ProcessClient {
  constructor(private readonly transport: Leap0Transport) {}

  /** Executes a command and returns stdout, stderr, and exit code output. */
  execute(
    sandbox: SandboxRef,
    params: { command: string; cwd?: string; timeout?: number },
    options: RequestOptions = {},
  ): Promise<ProcessResult> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/process/execute`, { method: "POST", body: jsonBody(params) }, options)
  }
}
