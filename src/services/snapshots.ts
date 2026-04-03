import type {
  CreateSnapshotParams,
  RequestOptions,
  ResumeSnapshotParams,
  SandboxData,
  SandboxRef,
  SnapshotData,
  SnapshotRef,
} from "@/models/index.js";
import { normalize } from "@/core/normalize.js";
import { snapshotDataSchema } from "@/models/snapshot.js";
import { sandboxDataSchema, toNetworkPolicyWire } from "@/models/sandbox.js";
import { Leap0Transport, jsonBody } from "@/core/transport.js";
import { sandboxIdOf, snapshotIdOf } from "@/core/utils.js";
import { withErrorPrefix } from "@/services/shared.js";

/** Creates, restores, and deletes named snapshots. */
export class SnapshotsClient {
  constructor(private readonly transport: Leap0Transport) {}

  /** Creates a snapshot from a running sandbox. */
  async create(
    sandbox: SandboxRef,
    params: CreateSnapshotParams = {},
    options: RequestOptions = {},
  ): Promise<SnapshotData> {
    return withErrorPrefix("Failed to create snapshot: ", async () => {
      const data = await this.transport.requestJson<unknown>(
        `/v1/sandbox/${sandboxIdOf(sandbox)}/snapshot/create`,
        { method: "POST", body: jsonBody(params) },
        options,
      );
      return normalize(snapshotDataSchema, data);
    });
  }

  /** Creates a snapshot and terminates the source sandbox. */
  async pause(
    sandbox: SandboxRef,
    params: CreateSnapshotParams = {},
    options: RequestOptions = {},
  ): Promise<SnapshotData> {
    return withErrorPrefix("Failed to pause sandbox into snapshot: ", async () => {
      const data = await this.transport.requestJson<unknown>(
        `/v1/sandbox/${sandboxIdOf(sandbox)}/snapshot/pause`,
        { method: "POST", body: jsonBody(params) },
        options,
      );
      return normalize(snapshotDataSchema, data);
    });
  }

  /** Restores a sandbox from a snapshot. */
  async resume(params: ResumeSnapshotParams, options: RequestOptions = {}): Promise<SandboxData> {
    return withErrorPrefix("Failed to resume snapshot: ", async () => {
      const data = await this.transport.requestJson<unknown>(
        "/v1/snapshot/resume",
        {
          method: "POST",
          body: jsonBody({
            snapshot_name: params.snapshotName,
            auto_pause: params.autoPause,
            timeout_min: params.timeoutMin,
            network_policy: toNetworkPolicyWire(params.networkPolicy),
          }),
        },
        options,
      );
      return normalize(sandboxDataSchema, data);
    });
  }

  /** Deletes a snapshot by ID. */
  async delete(snapshot: SnapshotRef, options: RequestOptions = {}): Promise<void> {
    await withErrorPrefix("Failed to delete snapshot: ", () =>
      this.transport.request(
        `/v1/snapshot/${snapshotIdOf(snapshot)}`,
        { method: "DELETE" },
        options,
      ),
    );
  }
}
