import type {
  EditFileResult,
  EditResult,
  FileEdit,
  FileInfo,
  LsResult,
  RequestOptions,
  SandboxRef,
  SearchMatch,
  TreeResult,
} from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxIdOf } from "@/core/utils.js"

/** Performs filesystem operations inside a sandbox. */
export class FilesystemClient {
  constructor(private readonly transport: Leap0Transport) {}

  /** Lists directory contents. */
  ls(sandbox: SandboxRef, path = "/workspace", options: RequestOptions = {}): Promise<LsResult> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/ls`, { method: "POST", body: jsonBody({ path }) }, options)
  }

  /** Fetches metadata for a path. */
  stat(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<FileInfo> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/stat`, { method: "POST", body: jsonBody({ path }) }, options)
  }

  async mkdir(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/mkdir`, { method: "POST", body: jsonBody({ path }) }, options)
  }

  async writeFile(sandbox: SandboxRef, path: string, content: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/write-file`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: content,
    }, { ...options, query: { path } })
  }

  async writeBytes(sandbox: SandboxRef, path: string, content: Uint8Array, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/write-file`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: Buffer.from(content),
    }, { ...options, query: { path } })
  }

  readFile(
    sandbox: SandboxRef,
    path: string,
    params: { offset?: number; limit?: number; head?: number; tail?: number } = {},
    options: RequestOptions = {},
  ): Promise<string> {
    return this.transport.requestText(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/read-file`, { method: "GET" }, { ...options, query: { path, ...params } })
  }

  readBytes(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<Uint8Array> {
    return this.transport.requestBytes(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/read-file`, { method: "GET" }, { ...options, query: { path } })
  }

  async delete(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/delete`, { method: "POST", body: jsonBody({ path }) }, options)
  }

  async setPermissions(sandbox: SandboxRef, path: string, mode: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/set-permissions`, { method: "POST", body: jsonBody({ path, mode }) }, options)
  }

  glob(sandbox: SandboxRef, path: string, pattern: string, options: RequestOptions = {}): Promise<string[]> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/glob`, { method: "POST", body: jsonBody({ path, pattern }) }, options)
  }

  grep(sandbox: SandboxRef, path: string, pattern: string, options: RequestOptions = {}): Promise<SearchMatch[]> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/grep`, { method: "POST", body: jsonBody({ path, pattern }) }, options)
  }

  editFile(sandbox: SandboxRef, path: string, edit: FileEdit, options: RequestOptions = {}): Promise<EditFileResult> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/edit-file`, { method: "POST", body: jsonBody({ path, edit }) }, options)
  }

  editFiles(sandbox: SandboxRef, files: Array<{ path: string; edit: FileEdit }>, options: RequestOptions = {}): Promise<EditResult> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/edit-files`, { method: "POST", body: jsonBody({ files }) }, options)
  }

  async move(sandbox: SandboxRef, source: string, destination: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/move`, { method: "POST", body: jsonBody({ source, destination }) }, options)
  }

  async copy(sandbox: SandboxRef, source: string, destination: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/copy`, { method: "POST", body: jsonBody({ source, destination }) }, options)
  }

  exists(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<{ exists: boolean }> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/exists`, { method: "POST", body: jsonBody({ path }) }, options)
  }

  tree(sandbox: SandboxRef, path: string, maxDepth?: number, options: RequestOptions = {}): Promise<TreeResult> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/tree`, { method: "POST", body: jsonBody({ path, max_depth: maxDepth }) }, options)
  }
}
