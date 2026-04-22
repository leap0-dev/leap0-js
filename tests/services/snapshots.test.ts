import assert from "node:assert/strict";
import { test } from "vitest";

import { SnapshotsClient } from "@/services/snapshots.js";
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts";

test("snapshots client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: async (path: string, init: RequestInit, options: never) => {
      calls.push({ path, init, options });
      if (path === "/v1/snapshot/restore") {
        return {
          id: "sb-2",
          state: "running",
          template_id: "tpl-1",
          vcpu: 2,
          memory: 1024,
          disk: 4096,
          timeout: 12,
          auto_pause: true,
          created_at: "2026-01-01T00:00:00Z",
        };
      }
    },
  });
  const client = new SnapshotsClient(transport as never);
  const restored = await client.restore({ snapshotName: "snap-c", autoPause: true, timeout: 12 });
  await client.delete({ id: "snap-1" });
  assert.equal(calls[0]?.path, "/v1/snapshot/restore");
  assert.deepEqual(jsonOf(calls[0]!), {
    snapshot_name: "snap-c",
    auto_pause: true,
    timeout: 12,
  });
  assert.equal(restored.templateId, "tpl-1");
  assert.equal(calls[1]?.path, "/v1/snapshot/snap-1");
});

test("snapshots client validates snapshot names before transport", async () => {
  const { transport, calls } = createRecordedTransport();
  const client = new SnapshotsClient(transport as never);

  await assert.rejects(() => client.restore({ snapshotName: "" }));
  await assert.rejects(() => client.restore({ snapshotName: "   " }));
  await assert.rejects(() => client.restore({ snapshotName: "snap-a", timeout: 99999 }));
  assert.equal(calls.length, 0);
});

test("snapshots client lists snapshots with query params", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: async (path: string, init: RequestInit, options: never) => {
      calls.push({ path, init, options });
      return {
        items: [
          {
            id: "snap-1",
            name: "snap-a",
            template_id: "tpl-1",
            vcpu: 2,
            memory: 1024,
            disk: 4096,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
        total_items: 1,
      };
    },
  });
  const client = new SnapshotsClient(transport as never);

  const result = await client.list({
    query: "snap",
    sort: "template_id",
    orderBy: "asc",
    page: 2,
    pageSize: 5,
  });

  assert.equal(calls[0]?.path, "/v1/snapshots");
  assert.deepEqual(calls[0]?.options.query, {
    query: "snap",
    sort: "template_id",
    "order-by": "asc",
    page: 2,
    "page-size": 5,
  });
  assert.equal(result.totalItems, 1);
  assert.equal(result.items[0]?.name, "snap-a");
});
