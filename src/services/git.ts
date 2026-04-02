import type { GitCommitResult, GitResult, RequestOptions, SandboxRef } from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxIdOf } from "@/core/utils.js"

/** Runs git operations inside a sandbox repository. */
export class GitClient {
  constructor(private readonly transport: Leap0Transport) {}

  private json<T>(sandbox: SandboxRef, endpoint: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/git/${endpoint}`, { method: "POST", body: jsonBody(body) }, options)
  }

  clone(sandbox: SandboxRef, url: string, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "clone", { url, path }, options) }
  status(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "status", { path }, options) }
  branches(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "branches", { path }, options) }
  diffUnstaged(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "diff-unstaged", { path }, options) }
  diffStaged(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "diff-staged", { path }, options) }
  diff(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "diff", { path }, options) }
  reset(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "reset", { path }, options) }
  log(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "log", { path }, options) }
  show(sandbox: SandboxRef, path: string, ref: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "show", { path, ref }, options) }
  createBranch(sandbox: SandboxRef, path: string, name: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "create-branch", { path, name }, options) }
  checkoutBranch(sandbox: SandboxRef, path: string, name: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "checkout-branch", { path, name }, options) }
  deleteBranch(sandbox: SandboxRef, path: string, name: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "delete-branch", { path, name }, options) }
  add(sandbox: SandboxRef, path: string, files: string[], options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "add", { path, files }, options) }
  commit(sandbox: SandboxRef, path: string, message: string, options?: RequestOptions): Promise<GitCommitResult> { return this.json(sandbox, "commit", { path, message }, options) }
  push(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "push", { path }, options) }
  pull(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> { return this.json(sandbox, "pull", { path }, options) }
}
