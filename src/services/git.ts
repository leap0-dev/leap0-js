import { normalize } from "@/core/normalize.js";
import type { GitCommitResult, GitResult, RequestOptions, SandboxRef } from "@/models/index.js";
import { Leap0Transport, jsonBody } from "@/core/transport.js";
import { gitCommitResultSchema, gitResultSchema } from "@/models/git.js";
import { sandboxIdOf } from "@/core/utils.js";

/** Runs git operations inside a sandbox repository. */
export class GitClient {
  constructor(private readonly transport: Leap0Transport) {}

  private async json<T>(
    sandbox: SandboxRef,
    endpoint: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return await this.transport.requestJson(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/git/${endpoint}`,
      { method: "POST", body: jsonBody(body) },
      options,
    );
  }

  async clone(
    sandbox: SandboxRef,
    url: string,
    path: string,
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "clone", { url, path }, options));
  }
  async status(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "status", { path }, options));
  }
  async branches(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "branches", { path }, options));
  }
  async diffUnstaged(
    sandbox: SandboxRef,
    path: string,
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "diff-unstaged", { path }, options));
  }
  async diffStaged(
    sandbox: SandboxRef,
    path: string,
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "diff-staged", { path }, options));
  }
  async diff(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "diff", { path }, options));
  }
  async reset(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "reset", { path }, options));
  }
  async log(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "log", { path }, options));
  }
  async show(
    sandbox: SandboxRef,
    path: string,
    ref: string,
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(
      gitResultSchema,
      await this.json(sandbox, "show", { path, revision: ref }, options),
    );
  }
  async createBranch(
    sandbox: SandboxRef,
    path: string,
    name: string,
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(
      gitResultSchema,
      await this.json(sandbox, "create-branch", { path, name }, options),
    );
  }
  async checkoutBranch(
    sandbox: SandboxRef,
    path: string,
    name: string,
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(
      gitResultSchema,
      await this.json(sandbox, "checkout-branch", { path, branch: name }, options),
    );
  }
  async deleteBranch(
    sandbox: SandboxRef,
    path: string,
    name: string,
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(
      gitResultSchema,
      await this.json(sandbox, "delete-branch", { path, name }, options),
    );
  }
  async add(
    sandbox: SandboxRef,
    path: string,
    files: string[],
    options?: RequestOptions,
  ): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "add", { path, files }, options));
  }
  async commit(
    sandbox: SandboxRef,
    path: string,
    message: string,
    options?: RequestOptions,
  ): Promise<GitCommitResult> {
    return normalize(
      gitCommitResultSchema,
      await this.json(sandbox, "commit", { path, message }, options),
    );
  }
  async push(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "push", { path }, options));
  }
  async pull(sandbox: SandboxRef, path: string, options?: RequestOptions): Promise<GitResult> {
    return normalize(gitResultSchema, await this.json(sandbox, "pull", { path }, options));
  }
}
