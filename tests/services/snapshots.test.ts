import assert from "node:assert/strict"
import { test } from "vitest"

import { SnapshotsClient } from "@/services/snapshots.js"
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts"

test("snapshots client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport({ requestJson: async (path: string, init: RequestInit, options: never) => { calls.push({ path, init, options }); return { id: "snap-1" } } })
  const client = new SnapshotsClient(transport as never, (data) => ({ wrapped: true, ...data }))
  await client.create("sb-1", { name: "snap-a" })
  await client.pause("sb-1", { name: "snap-b" })
  const restored = await client.resume({ snapshotName: "snap-c", autoPause: true, timeoutMin: 12 })
  await client.delete({ id: "snap-1" })
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/snapshot/create")
  assert.deepEqual(jsonOf(calls[0]!), { name: "snap-a" })
  assert.equal(calls[1]?.path, "/v1/sandbox/sb-1/snapshot/pause")
  assert.equal(calls[2]?.path, "/v1/snapshot/resume")
  assert.deepEqual(jsonOf(calls[2]!), { snapshot_name: "snap-c", auto_pause: true, timeout_min: 12 })
  assert.equal((restored as { wrapped?: boolean }).wrapped, true)
  assert.equal(calls[3]?.path, "/v1/snapshot/snap-1")
})
