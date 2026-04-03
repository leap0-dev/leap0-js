import { z } from "zod";
import { Leap0Error } from "@/core/errors.js";
import { normalize } from "@/core/normalize.js";
import type {
  CodeContext,
  CodeExecutionResult,
  CodeLanguage,
  RequestOptions,
  SandboxRef,
  StreamEvent,
} from "@/models/index.js";
import { Leap0Transport, jsonBody } from "@/core/transport.js";
import { sandboxBaseUrl, sandboxIdOf } from "@/core/utils.js";
import { StreamEventType } from "@/models/index.js";
import { codeContextSchema, codeExecutionResultSchema } from "@/models/code-interpreter.js";

/** Talks to the sandbox-hosted code interpreter service. */
export class CodeInterpreterClient {
  constructor(
    private readonly transport: Leap0Transport,
    private readonly sandboxDomain: string,
  ) {}

  private requestPath(sandbox: SandboxRef, path: string): string {
    return `${sandboxBaseUrl(sandboxIdOf(sandbox), this.sandboxDomain)}${path}`;
  }

  private async fetchJson<T>(
    sandbox: SandboxRef,
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {},
  ): Promise<T> {
    return await this.transport.requestJsonUrl(this.requestPath(sandbox, path), init, options);
  }

  async health(sandbox: SandboxRef, options: RequestOptions = {}): Promise<{ ok: boolean }> {
    return await this.fetchJson(sandbox, "/healthz", { method: "GET" }, options);
  }
  async createContext(
    sandbox: SandboxRef,
    language: CodeLanguage,
    options: RequestOptions = {},
  ): Promise<CodeContext> {
    return normalize(
      codeContextSchema,
      await this.fetchJson(
        sandbox,
        "/contexts",
        { method: "POST", body: jsonBody({ language }) },
        options,
      ),
    );
  }
  async listContexts(sandbox: SandboxRef, options: RequestOptions = {}): Promise<CodeContext[]> {
    return (
      normalize(
        z.object({ items: z.array(codeContextSchema).optional() }),
        await this.fetchJson(sandbox, "/contexts", { method: "GET" }, options),
      ).items ?? []
    );
  }
  async getContext(
    sandbox: SandboxRef,
    contextId: string,
    options: RequestOptions = {},
  ): Promise<CodeContext> {
    return normalize(
      codeContextSchema,
      await this.fetchJson(
        sandbox,
        `/contexts/${encodeURIComponent(contextId)}`,
        { method: "GET" },
        options,
      ),
    );
  }
  async deleteContext(
    sandbox: SandboxRef,
    contextId: string,
    options: RequestOptions = {},
  ): Promise<void> {
    await this.fetchJson(
      sandbox,
      `/contexts/${encodeURIComponent(contextId)}`,
      { method: "DELETE" },
      options,
    );
  }
  async execute(
    sandbox: SandboxRef,
    params: { code: string; language: CodeLanguage; contextId?: string },
    options: RequestOptions = {},
  ): Promise<CodeExecutionResult> {
    return normalize(
      codeExecutionResultSchema,
      await this.fetchJson(
        sandbox,
        "/execute",
        {
          method: "POST",
          body: jsonBody({
            code: params.code,
            language: params.language,
            context_id: params.contextId,
          }),
        },
        options,
      ),
    );
  }

  async *executeStream(
    sandbox: SandboxRef,
    params: { code: string; language: CodeLanguage; contextId?: string },
    options: RequestOptions = {},
  ): AsyncIterable<StreamEvent> {
    for await (const event of this.transport.streamJsonUrl(
      this.requestPath(sandbox, "/execute/async"),
      {
        method: "POST",
        body: jsonBody({
          code: params.code,
          language: params.language,
          context_id: params.contextId,
        }),
      },
      options,
    )) {
      if (!event || typeof event !== "object") {
        throw new Leap0Error("Malformed code execution stream event");
      }
      const parsed = { ...event } as Record<string, unknown>;
      if (parsed.envelope === "error") {
        throw new Leap0Error(typeof parsed.message === "string" ? parsed.message : "Stream error");
      }
      if (parsed.type === 0) parsed.type = StreamEventType.STDOUT;
      if (parsed.type === 1) parsed.type = StreamEventType.STDERR;
      if (parsed.type === 2) parsed.type = StreamEventType.EXIT;
      if (parsed.type === 3) parsed.type = StreamEventType.ERROR;
      yield parsed as unknown as StreamEvent;
    }
  }
}
