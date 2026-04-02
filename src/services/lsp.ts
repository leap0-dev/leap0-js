import type { LspJsonRpcResponse, LspResponse, RequestOptions, SandboxRef } from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxIdOf, toFileUri } from "@/core/utils.js"

/** Starts and interacts with language servers inside a sandbox. */
export class LspClient {
  constructor(private readonly transport: Leap0Transport) {}

  private json<T>(sandbox: SandboxRef, endpoint: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/lsp/${endpoint}`, { method: "POST", body: jsonBody(body) }, options)
  }

  start(sandbox: SandboxRef, languageId: string, pathToProject: string, options?: RequestOptions): Promise<LspResponse> { return this.json(sandbox, "start", { language_id: languageId, path_to_project: pathToProject }, options) }
  stop(sandbox: SandboxRef, languageId: string, pathToProject: string, options?: RequestOptions): Promise<LspResponse> { return this.json(sandbox, "stop", { language_id: languageId, path_to_project: pathToProject }, options) }
  didOpen(sandbox: SandboxRef, languageId: string, pathToProject: string, uri: string, options?: RequestOptions): Promise<LspResponse> { return this.json(sandbox, "did-open", { language_id: languageId, path_to_project: pathToProject, uri }, options) }
  didOpenPath(sandbox: SandboxRef, languageId: string, pathToProject: string, path: string, options?: RequestOptions): Promise<LspResponse> { return this.didOpen(sandbox, languageId, pathToProject, toFileUri(path), options) }
  didClose(sandbox: SandboxRef, languageId: string, pathToProject: string, uri: string, options?: RequestOptions): Promise<LspResponse> { return this.json(sandbox, "did-close", { language_id: languageId, path_to_project: pathToProject, uri }, options) }
  didClosePath(sandbox: SandboxRef, languageId: string, pathToProject: string, path: string, options?: RequestOptions): Promise<LspResponse> { return this.didClose(sandbox, languageId, pathToProject, toFileUri(path), options) }
  completions(sandbox: SandboxRef, languageId: string, pathToProject: string, uri: string, line: number, character: number, options?: RequestOptions): Promise<LspJsonRpcResponse> { return this.json(sandbox, "completions", { language_id: languageId, path_to_project: pathToProject, uri, line, character }, options) }
  completionsPath(sandbox: SandboxRef, languageId: string, pathToProject: string, path: string, line: number, character: number, options?: RequestOptions): Promise<LspJsonRpcResponse> { return this.completions(sandbox, languageId, pathToProject, toFileUri(path), line, character, options) }
  documentSymbols(sandbox: SandboxRef, languageId: string, pathToProject: string, uri: string, options?: RequestOptions): Promise<LspJsonRpcResponse> { return this.json(sandbox, "document-symbols", { language_id: languageId, path_to_project: pathToProject, uri }, options) }
  documentSymbolsPath(sandbox: SandboxRef, languageId: string, pathToProject: string, path: string, options?: RequestOptions): Promise<LspJsonRpcResponse> { return this.documentSymbols(sandbox, languageId, pathToProject, toFileUri(path), options) }
}
