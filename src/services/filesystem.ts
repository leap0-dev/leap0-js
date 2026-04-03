import { z } from "zod";
import { normalize } from "@/core/normalize.js";
import type {
  EditFileResult,
  EditFilesResult,
  FileEdit,
  FileInfo,
  LsResult,
  RequestOptions,
  SandboxRef,
  SearchMatch,
  TreeResult,
} from "@/models/index.js";
import { Leap0Transport, jsonBody } from "@/core/transport.js";
import {
  editFileResultSchema,
  editFilesResultSchema,
  fileInfoSchema,
  lsResultSchema,
  searchMatchSchema,
  treeResultSchema,
} from "@/models/filesystem.js";
import { sandboxIdOf } from "@/core/utils.js";

/** Performs filesystem operations inside a sandbox. */
export class FilesystemClient {
  constructor(private readonly transport: Leap0Transport) {}

  /** Lists directory contents. */
  async ls(
    sandbox: SandboxRef,
    path = "/workspace",
    options: RequestOptions = {},
  ): Promise<LsResult> {
    const data = await this.transport.requestJson<LsResult>(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/ls`,
      { method: "POST", body: jsonBody({ path }) },
      options,
    );
    return normalize(lsResultSchema, data);
  }

  /** Fetches metadata for a path. */
  async stat(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<FileInfo> {
    const data = await this.transport.requestJson<FileInfo>(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/stat`,
      { method: "POST", body: jsonBody({ path }) },
      options,
    );
    return normalize(fileInfoSchema, data);
  }

  async mkdir(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/mkdir`,
      { method: "POST", body: jsonBody({ path }) },
      options,
    );
  }

  async writeFile(
    sandbox: SandboxRef,
    path: string,
    content: string,
    options: RequestOptions = {},
  ): Promise<void> {
    await this.transport.request(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/write-file`,
      {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: content,
      },
      { ...options, query: { path } },
    );
  }

  async writeBytes(
    sandbox: SandboxRef,
    path: string,
    content: Uint8Array,
    options: RequestOptions = {},
  ): Promise<void> {
    await this.transport.request(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/write-file`,
      {
        method: "POST",
        headers: { "content-type": "application/octet-stream" },
        body: Buffer.from(content),
      },
      { ...options, query: { path } },
    );
  }

  async readFile(
    sandbox: SandboxRef,
    path: string,
    params: { offset?: number; limit?: number; head?: number; tail?: number } = {},
    options: RequestOptions = {},
  ): Promise<string> {
    return await this.transport.requestText(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/read-file`,
      { method: "GET" },
      { ...options, query: { path, ...params } },
    );
  }

  async readBytes(
    sandbox: SandboxRef,
    path: string,
    options: RequestOptions = {},
  ): Promise<Uint8Array> {
    return await this.transport.requestBytes(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/read-file`,
      { method: "GET" },
      { ...options, query: { path } },
    );
  }

  async delete(sandbox: SandboxRef, path: string, options: RequestOptions = {}): Promise<void> {
    await this.transport.request(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/delete`,
      { method: "POST", body: jsonBody({ path }) },
      options,
    );
  }

  async setPermissions(
    sandbox: SandboxRef,
    path: string,
    mode: string,
    options: RequestOptions = {},
  ): Promise<void> {
    await this.transport.request(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/set-permissions`,
      { method: "POST", body: jsonBody({ path, mode }) },
      options,
    );
  }

  async glob(
    sandbox: SandboxRef,
    path: string,
    pattern: string,
    options: RequestOptions = {},
  ): Promise<string[]> {
    return await this.transport.requestJson(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/glob`,
      { method: "POST", body: jsonBody({ path, pattern }) },
      options,
    );
  }

  async grep(
    sandbox: SandboxRef,
    path: string,
    pattern: string,
    options: RequestOptions = {},
  ): Promise<SearchMatch[]> {
    const data = await this.transport.requestJson<SearchMatch[]>(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/grep`,
      { method: "POST", body: jsonBody({ path, pattern }) },
      options,
    );
    return normalize(z.object({ items: z.array(searchMatchSchema) }), data).items;
  }

  async editFile(
    sandbox: SandboxRef,
    path: string,
    edit: FileEdit,
    options: RequestOptions = {},
  ): Promise<EditFileResult> {
    const data = await this.transport.requestJson<EditFileResult>(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/edit-file`,
      { method: "POST", body: jsonBody({ path, edits: [edit] }) },
      options,
    );
    return normalize(editFileResultSchema, data);
  }

  async editFiles(
    sandbox: SandboxRef,
    files: Array<{ path: string; edit: FileEdit }>,
    options: RequestOptions = {},
  ): Promise<EditFilesResult> {
    const firstEdit = files[0]?.edit;
    const data = await this.transport.requestJson<EditFilesResult>(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/edit-files`,
      {
        method: "POST",
        body: jsonBody({
          files: files.map((file) => file.path),
          find: firstEdit?.find,
          replace: firstEdit?.replace,
        }),
      },
      options,
    );
    return normalize(editFilesResultSchema, data);
  }

  async move(
    sandbox: SandboxRef,
    source: string,
    destination: string,
    options: RequestOptions = {},
  ): Promise<void> {
    await this.transport.request(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/move`,
      { method: "POST", body: jsonBody({ src_path: source, dst_path: destination }) },
      options,
    );
  }

  async copy(
    sandbox: SandboxRef,
    source: string,
    destination: string,
    options: RequestOptions = {},
  ): Promise<void> {
    await this.transport.request(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/copy`,
      { method: "POST", body: jsonBody({ src_path: source, dst_path: destination }) },
      options,
    );
  }

  async exists(
    sandbox: SandboxRef,
    path: string,
    options: RequestOptions = {},
  ): Promise<{ exists: boolean }> {
    return await this.transport.requestJson(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/exists`,
      { method: "POST", body: jsonBody({ path }) },
      options,
    );
  }

  async tree(
    sandbox: SandboxRef,
    path: string,
    maxDepth?: number,
    options: RequestOptions = {},
  ): Promise<TreeResult> {
    const data = await this.transport.requestJson<TreeResult>(
      `/v1/sandbox/${sandboxIdOf(sandbox)}/filesystem/tree`,
      { method: "POST", body: jsonBody({ path, max_depth: maxDepth }) },
      options,
    );
    return normalize(treeResultSchema, data);
  }
}
