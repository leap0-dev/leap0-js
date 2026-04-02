import { Leap0Error } from "@/core/errors.js"
import type { CodeContext, CodeExecutionResult, CodeLanguage, RequestOptions, SandboxRef, StreamEvent } from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxBaseUrl, sandboxIdOf } from "@/core/utils.js"
import { StreamEventType } from "@/models/index.js"

/** Talks to the sandbox-hosted code interpreter service. */
export class CodeInterpreterClient {
  constructor(private readonly transport: Leap0Transport, private readonly sandboxDomain: string) {}

  private requestPath(sandbox: SandboxRef, path: string): string {
    return `${sandboxBaseUrl(sandboxIdOf(sandbox), this.sandboxDomain)}${path}`
  }

  private fetchJson<T>(sandbox: SandboxRef, path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
    return this.transport.requestJsonUrl(this.requestPath(sandbox, path), init, options)
  }

  health(sandbox: SandboxRef, options: RequestOptions = {}): Promise<{ ok: boolean }> { return this.fetchJson(sandbox, "/healthz", { method: "GET" }, options) }
  createContext(sandbox: SandboxRef, language: CodeLanguage, options: RequestOptions = {}): Promise<CodeContext> { return this.fetchJson(sandbox, "/contexts", { method: "POST", body: jsonBody({ language }) }, options) }
  listContexts(sandbox: SandboxRef, options: RequestOptions = {}): Promise<CodeContext[]> { return this.fetchJson(sandbox, "/contexts", { method: "GET" }, options) }
  getContext(sandbox: SandboxRef, contextId: string, options: RequestOptions = {}): Promise<CodeContext> { return this.fetchJson(sandbox, `/contexts/${encodeURIComponent(contextId)}`, { method: "GET" }, options) }
  async deleteContext(sandbox: SandboxRef, contextId: string, options: RequestOptions = {}): Promise<void> { await this.fetchJson(sandbox, `/contexts/${encodeURIComponent(contextId)}`, { method: "DELETE" }, options) }
  execute(sandbox: SandboxRef, params: { code: string; language: CodeLanguage; contextId?: string }, options: RequestOptions = {}): Promise<CodeExecutionResult> { return this.fetchJson(sandbox, "/execute", { method: "POST", body: jsonBody(params) }, options) }

  async *executeStream(sandbox: SandboxRef, params: { code: string; language: CodeLanguage; contextId?: string }, options: RequestOptions = {}): AsyncIterable<StreamEvent> {
    for await (const event of this.transport.streamJsonUrl(this.requestPath(sandbox, "/execute/async"), {
      method: "POST",
      body: jsonBody(params),
    }, options)) {
      if (!event || typeof event !== "object") {
        throw new Leap0Error("Malformed code execution stream event")
      }
      const parsed = { ...event } as Record<string, unknown>
      if (parsed.envelope === "error") {
        throw new Leap0Error(typeof parsed.message === "string" ? parsed.message : "Stream error")
      }
      if (parsed.type === 0) parsed.type = StreamEventType.STDOUT
      if (parsed.type === 1) parsed.type = StreamEventType.STDERR
      if (parsed.type === 2) parsed.type = StreamEventType.EXIT
      if (parsed.type === 3) parsed.type = StreamEventType.ERROR
      yield parsed as unknown as StreamEvent
    }
  }
}
