import assert from "node:assert/strict";
import { test } from "vitest";

import { camelizeKeys } from "@/core/normalize.js";

test("camelizeKeys converts nested API response keys", () => {
  const result = camelizeKeys({
    template_id: "tpl-1",
    memory_mib: 1024,
    network_policy: {
      allow_domains: ["example.com"],
      transforms: [{ inject_headers: { authorization: "token" }, strip_headers: ["cookie"] }],
    },
    snapshots: [{ created_at: "2026-01-01T00:00:00Z" }],
  });

  assert.deepEqual(result, {
    templateId: "tpl-1",
    memoryMib: 1024,
    networkPolicy: {
      allowDomains: ["example.com"],
      transforms: [{ injectHeaders: { authorization: "token" }, stripHeaders: ["cookie"] }],
    },
    snapshots: [{ createdAt: "2026-01-01T00:00:00Z" }],
  });
});
