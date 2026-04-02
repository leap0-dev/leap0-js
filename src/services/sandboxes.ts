import {
  DEFAULT_MEMORY_MIB,
  DEFAULT_TEMPLATE_NAME,
  DEFAULT_TIMEOUT_MIN,
  DEFAULT_VCPU,
} from "@/config/constants.js"
import { Leap0Error } from "@/core/errors.js"
import type { CreateSandboxParams, RequestOptions, SandboxData, SandboxRef } from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { ensureLeadingSlash, sandboxBaseUrl, sandboxIdOf, websocketUrlFromHttp } from "@/core/utils.js"
import { withErrorPrefix } from "@/services/shared.js"

const OTEL_EXPORTER_OTLP_ENDPOINT = "OTEL_EXPORTER_OTLP_ENDPOINT"
const OTEL_EXPORTER_OTLP_HEADERS = "OTEL_EXPORTER_OTLP_HEADERS"

function injectOtelEnv(envVars: Record<string, string> | undefined, enabled: boolean): Record<string, string> | undefined {
  if (!enabled) {
    return envVars
  }

  const endpoint = process.env[OTEL_EXPORTER_OTLP_ENDPOINT]?.trim()
  if (!endpoint) {
    throw new Leap0Error(`otelExport=true requires ${OTEL_EXPORTER_OTLP_ENDPOINT} in the local environment`)
  }

  const merged: Record<string, string> = {
    [OTEL_EXPORTER_OTLP_ENDPOINT]: endpoint,
  }
  const headers = process.env[OTEL_EXPORTER_OTLP_HEADERS]?.trim()
  if (headers) {
    merged[OTEL_EXPORTER_OTLP_HEADERS] = headers
  }
  if (envVars) {
    Object.assign(merged, envVars)
  }
  return merged
}

/** Creates, fetches, pauses, and deletes sandboxes. */
export class SandboxesClient<WrappedSandbox extends SandboxData = SandboxData> {
  constructor(
    private readonly transport: Leap0Transport,
    private readonly sandboxDomain: string,
    private readonly wrapSandbox: (data: SandboxData) => WrappedSandbox,
  ) {}

  /** Creates a sandbox from a template and resource config. */
  create(params: CreateSandboxParams = {}, options: RequestOptions = {}): Promise<WrappedSandbox> {
    const templateName = (params.templateName ?? DEFAULT_TEMPLATE_NAME).trim()
    const vcpu = params.vcpu ?? DEFAULT_VCPU
    const memoryMib = params.memoryMib ?? DEFAULT_MEMORY_MIB
    const timeoutMin = params.timeoutMin ?? DEFAULT_TIMEOUT_MIN

    if (!templateName || templateName.length > 64) throw new Leap0Error("templateName must be 1-64 characters")
    if (!Number.isInteger(vcpu) || vcpu < 1 || vcpu > 8) throw new Leap0Error("vcpu must be between 1 and 8")
    if (!Number.isInteger(memoryMib) || memoryMib < 512 || memoryMib > 8192 || memoryMib % 2 !== 0) {
      throw new Leap0Error("memoryMib must be even and between 512 and 8192")
    }
    if (!Number.isInteger(timeoutMin) || timeoutMin < 1 || timeoutMin > 480) {
      throw new Leap0Error("timeoutMin must be between 1 and 480")
    }

    const effectiveOtelExport = params.otelExport ?? Boolean(params.telemetry)
    const payload = {
      template_name: templateName,
      vcpu,
      memory_mib: memoryMib,
      timeout_min: timeoutMin,
      auto_pause: params.autoPause ?? false,
      env_vars: injectOtelEnv(params.envVars, effectiveOtelExport),
      network_policy: params.networkPolicy,
    }

    return withErrorPrefix("Failed to create sandbox: ", () =>
      this.transport
        .requestJson<SandboxData>("/v1/sandbox", { method: "POST", body: jsonBody(payload) }, options)
        .then((data) => this.wrapSandbox(data)),
    )
  }

  /** Pauses a running sandbox. */
  pause(sandbox: SandboxRef, options: RequestOptions = {}): Promise<WrappedSandbox> {
    return withErrorPrefix("Failed to pause sandbox: ", () =>
      this.transport
        .requestJson<SandboxData>(`/v1/sandbox/${sandboxIdOf(sandbox)}/pause`, { method: "POST" }, options)
        .then((data) => this.wrapSandbox(data)),
    )
  }

  /** Fetches a sandbox by ID. */
  get(sandbox: SandboxRef, options: RequestOptions = {}): Promise<WrappedSandbox> {
    return withErrorPrefix("Failed to get sandbox: ", () =>
      this.transport
        .requestJson<SandboxData>(`/v1/sandbox/${sandboxIdOf(sandbox)}/`, { method: "GET" }, options)
        .then((data) => this.wrapSandbox(data)),
    )
  }

  /** Deletes a sandbox by ID. */
  async delete(sandbox: SandboxRef, options: RequestOptions = {}): Promise<void> {
    await withErrorPrefix("Failed to delete sandbox: ", () =>
      this.transport.request(`/v1/sandbox/${sandboxIdOf(sandbox)}/`, { method: "DELETE" }, options),
    )
  }

  /** Builds the public invoke URL for a sandbox. */
  invokeUrl(sandbox: SandboxRef, path = "/", port?: number): string {
    return `${sandboxBaseUrl(sandboxIdOf(sandbox), this.sandboxDomain, port)}${ensureLeadingSlash(path)}`
  }

  /** Builds the public websocket URL for a sandbox. */
  websocketUrl(sandbox: SandboxRef, path = "/", port?: number): string {
    return websocketUrlFromHttp(this.invokeUrl(sandbox, path, port))
  }
}
