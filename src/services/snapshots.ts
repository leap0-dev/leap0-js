import type {
  CreateSnapshotParams,
  RequestOptions,
  ResumeSnapshotParams,
  SandboxData,
  SandboxRef,
  SnapshotData,
  SnapshotRef,
} from "@/models/index.js"
import { Leap0Transport, jsonBody } from "@/core/transport.js"
import { sandboxIdOf, snapshotIdOf } from "@/core/utils.js"
import { withErrorPrefix } from "@/services/shared.js"

/** Creates, restores, and deletes named snapshots. */
export class SnapshotsClient<WrappedSandbox extends SandboxData = SandboxData> {
  constructor(private readonly transport: Leap0Transport, private readonly wrapSandbox: (data: SandboxData) => WrappedSandbox) {}

  /** Creates a snapshot from a running sandbox. */
  create(sandbox: SandboxRef, params: CreateSnapshotParams = {}, options: RequestOptions = {}): Promise<SnapshotData> {
    return withErrorPrefix("Failed to create snapshot: ", () =>
      this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/snapshot/create`, { method: "POST", body: jsonBody(params) }, options),
    )
  }

  /** Creates a snapshot and terminates the source sandbox. */
  pause(sandbox: SandboxRef, params: CreateSnapshotParams = {}, options: RequestOptions = {}): Promise<SnapshotData> {
    return withErrorPrefix("Failed to pause sandbox into snapshot: ", () =>
      this.transport.requestJson(`/v1/sandbox/${sandboxIdOf(sandbox)}/snapshot/pause`, { method: "POST", body: jsonBody(params) }, options),
    )
  }

  /** Restores a sandbox from a snapshot. */
  resume(params: ResumeSnapshotParams, options: RequestOptions = {}): Promise<WrappedSandbox> {
    return withErrorPrefix("Failed to resume snapshot: ", () =>
      this.transport
        .requestJson<SandboxData>(
          "/v1/snapshot/resume",
          {
            method: "POST",
            body: jsonBody({
              snapshot_name: params.snapshotName,
              auto_pause: params.autoPause,
              timeout_min: params.timeoutMin,
              network_policy: params.networkPolicy,
            }),
          },
          options,
        )
        .then((data) => this.wrapSandbox(data)),
    )
  }

  /** Deletes a snapshot by ID. */
  async delete(snapshot: SnapshotRef, options: RequestOptions = {}): Promise<void> {
    await withErrorPrefix("Failed to delete snapshot: ", () =>
      this.transport.request(`/v1/snapshot/${snapshotIdOf(snapshot)}`, { method: "DELETE" }, options),
    )
  }
}
