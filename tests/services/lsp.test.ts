import assert from "node:assert/strict";
import { test } from "vitest";

import { LspClient } from "@/services/lsp.js";
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts";

test("lsp client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport();
  const client = new LspClient(transport as never);
  await client.start("sb-1", "typescript", "/workspace");
  await client.stop("sb-1", "typescript", "/workspace");
  await client.didOpenPath("sb-1", "typescript", "/workspace", "/workspace/a.ts");
  await client.didClosePath("sb-1", "typescript", "/workspace", "/workspace/a.ts");
  await client.completionsPath("sb-1", "typescript", "/workspace", "/workspace/a.ts", 1, 2);
  await client.documentSymbolsPath("sb-1", "typescript", "/workspace", "/workspace/a.ts");
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/lsp/start");
  assert.deepEqual(jsonOf(calls[0]!), { language_id: "typescript", path_to_project: "/workspace" });
  assert.deepEqual(jsonOf(calls[2]!) as { uri: string }, {
    language_id: "typescript",
    path_to_project: "/workspace",
    uri: "file:///workspace/a.ts",
  });
  assert.deepEqual(jsonOf(calls[4]!), {
    language_id: "typescript",
    path_to_project: "/workspace",
    uri: "file:///workspace/a.ts",
    position: { line: 1, character: 2 },
  });
});
