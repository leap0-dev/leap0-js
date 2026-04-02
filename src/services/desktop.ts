import { Leap0Error } from "@/core/errors.js"
import type {
  DesktopDisplayInfo,
  DesktopDragParams,
  DesktopHealth,
  DesktopPointerPosition,
  DesktopProcessErrors,
  DesktopProcessLogs,
  DesktopProcessRestart,
  DesktopProcessStatus,
  DesktopProcessStatusList,
  DesktopRecordingStatus,
  DesktopRecordingSummary,
  DesktopScreenshotRegionParams,
  DesktopScrollParams,
  DesktopSetScreenParams,
  DesktopStatusStreamEvent,
  DesktopWindow,
  RequestOptions,
  SandboxRef,
} from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxBaseUrl, sandboxIdOf } from "@/core/utils.js"
import { asRecord } from "@/services/shared.js"

/** Drives the desktop sandbox APIs for browser and GUI automation. */
export class DesktopClient {
  constructor(private readonly transport: Leap0Transport, private readonly sandboxDomain: string) {}

  private requestUrl(sandbox: SandboxRef, path: string): string {
    return `${sandboxBaseUrl(sandboxIdOf(sandbox), this.sandboxDomain)}${path}`
  }

  browserUrl(sandbox: SandboxRef): string { return sandboxBaseUrl(sandboxIdOf(sandbox), this.sandboxDomain) }
  display(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopDisplayInfo> { return this.requestJson(sandbox, "/api/display", { method: "GET" }, options) }
  screen(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopDisplayInfo> { return this.requestJson(sandbox, "/api/display/screen", { method: "GET" }, options) }
  setScreen(sandbox: SandboxRef, payload: DesktopSetScreenParams, options?: RequestOptions): Promise<DesktopDisplayInfo> { return this.transport.requestJsonUrl(this.requestUrl(sandbox, "/api/display/screen"), { method: "POST", body: jsonBody(payload) }, options) }
  windows(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopWindow[]> { return this.requestJson(sandbox, "/api/display/windows", { method: "GET" }, options) }
  screenshot(sandbox: SandboxRef, options?: RequestOptions): Promise<string> { return this.requestJson(sandbox, "/api/screenshot", { method: "GET" }, options) }
  screenshotRegion(sandbox: SandboxRef, payload: DesktopScreenshotRegionParams, options?: RequestOptions): Promise<string> { return this.transport.requestJsonUrl(this.requestUrl(sandbox, "/api/screenshot/region"), { method: "POST", body: jsonBody(payload) }, options) }
  pointerPosition(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopPointerPosition> { return this.requestJson(sandbox, "/api/input/position", { method: "GET" }, options) }
  movePointer(sandbox: SandboxRef, x: number, y: number, options?: RequestOptions): Promise<void> { return this.requestJson(sandbox, "/api/input/move", { method: "POST", body: jsonBody({ x, y }) }, options) }
  click(sandbox: SandboxRef, button = 1, options?: RequestOptions): Promise<void> { return this.requestJson(sandbox, "/api/input/click", { method: "POST", body: jsonBody({ button }) }, options) }
  drag(sandbox: SandboxRef, payload: DesktopDragParams, options?: RequestOptions): Promise<void> { return this.transport.requestJsonUrl(this.requestUrl(sandbox, "/api/input/drag"), { method: "POST", body: jsonBody(payload) }, options) }
  scroll(sandbox: SandboxRef, payload: DesktopScrollParams, options?: RequestOptions): Promise<void> { return this.transport.requestJsonUrl(this.requestUrl(sandbox, "/api/input/scroll"), { method: "POST", body: jsonBody(payload) }, options) }
  typeText(sandbox: SandboxRef, text: string, options?: RequestOptions): Promise<void> { return this.requestJson(sandbox, "/api/input/type", { method: "POST", body: jsonBody({ text }) }, options) }
  press(sandbox: SandboxRef, key: string, options?: RequestOptions): Promise<void> { return this.requestJson(sandbox, "/api/input/press", { method: "POST", body: jsonBody({ key }) }, options) }
  hotkey(sandbox: SandboxRef, keys: string[], options?: RequestOptions): Promise<void> { return this.requestJson(sandbox, "/api/input/hotkey", { method: "POST", body: jsonBody({ keys }) }, options) }
  recordingStatus(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopRecordingStatus> { return this.requestJson(sandbox, "/api/recording", { method: "GET" }, options) }
  startRecording(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopRecordingStatus> { return this.requestJson(sandbox, "/api/recording/start", { method: "POST" }, options) }
  stopRecording(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopRecordingStatus> { return this.requestJson(sandbox, "/api/recording/stop", { method: "POST" }, options) }
  recordings(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopRecordingSummary[]> { return this.requestJson(sandbox, "/api/recordings", { method: "GET" }, options) }
  recording(sandbox: SandboxRef, id: string, options?: RequestOptions): Promise<DesktopRecordingSummary> { return this.requestJson(sandbox, `/api/recordings/${encodeURIComponent(id)}`, { method: "GET" }, options) }
  downloadRecording(sandbox: SandboxRef, id: string, options?: RequestOptions): Promise<string> { return this.requestJson(sandbox, `/api/recordings/${encodeURIComponent(id)}/download`, { method: "GET" }, options) }
  async deleteRecording(sandbox: SandboxRef, id: string, options?: RequestOptions): Promise<void> { await this.requestJson(sandbox, `/api/recordings/${encodeURIComponent(id)}`, { method: "DELETE" }, options) }
  health(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopHealth> { return this.requestJson(sandbox, "/api/healthz", { method: "GET" }, options) }
  status(sandbox: SandboxRef, options?: RequestOptions): Promise<DesktopProcessStatusList> { return this.requestJson(sandbox, "/api/status", { method: "GET" }, options) }
  processStatus(sandbox: SandboxRef, name: string, options?: RequestOptions): Promise<DesktopProcessStatus> { return this.requestJson(sandbox, `/api/process/${encodeURIComponent(name)}/status`, { method: "GET" }, options) }
  restartProcess(sandbox: SandboxRef, name: string, options?: RequestOptions): Promise<DesktopProcessRestart> { return this.requestJson(sandbox, `/api/process/${encodeURIComponent(name)}/restart`, { method: "POST" }, options) }
  processLogs(sandbox: SandboxRef, name: string, options?: RequestOptions): Promise<DesktopProcessLogs> { return this.requestJson(sandbox, `/api/process/${encodeURIComponent(name)}/logs`, { method: "GET" }, options) }
  processErrors(sandbox: SandboxRef, name: string, options?: RequestOptions): Promise<DesktopProcessErrors> { return this.requestJson(sandbox, `/api/process/${encodeURIComponent(name)}/errors`, { method: "GET" }, options) }

  private requestJson<T>(sandbox: SandboxRef, path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
    return this.transport.requestJsonUrl(this.requestUrl(sandbox, path), init, options)
  }

  async *statusStream(sandbox: SandboxRef, options: RequestOptions = {}): AsyncIterable<DesktopStatusStreamEvent> {
    for await (const event of this.transport.streamJsonUrl(this.requestUrl(sandbox, "/api/status/stream"), { method: "GET" }, options)) {
      if (!event || typeof event !== "object") {
        throw new Leap0Error("Malformed desktop status stream event")
      }
      if (typeof asRecord(event).error === "string") {
        throw new Leap0Error(String(asRecord(event).error))
      }
      yield event as DesktopStatusStreamEvent
    }
  }

  async waitUntilReady(sandbox: SandboxRef, timeout = 60): Promise<void> {
    const startedAt = Date.now()
    let delayMs = 250
    while (true) {
      const status = await this.status(sandbox, { timeout })
      if (status.processes.every((process) => process.status === "running")) {
        return
      }
      if (Date.now() - startedAt > timeout * 1000) {
        throw new Leap0Error("Desktop did not become ready within timeout")
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      delayMs = Math.min(delayMs * 2, 2000)
    }
  }
}
