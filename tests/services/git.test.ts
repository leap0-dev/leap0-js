import assert from "node:assert/strict";
import { test } from "vitest";

import { GitClient } from "@/services/git.js";
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts";

test("git client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: async (path: string, init: RequestInit, options: never) => {
      calls.push({ path, init, options });
      if (path.endsWith("/commit"))
        return { result: { output: "ok", exit_code: 0 } };
      return { output: "ok", exit_code: 0 };
    },
  });
  const client = new GitClient(transport as never);
  await client.clone("sb-1", "https://example.com/repo.git", "/workspace/repo");
  await client.status("sb-1", "/workspace/repo");
  await client.branches("sb-1", "/workspace/repo");
  await client.diffUnstaged("sb-1", "/workspace/repo");
  await client.diffStaged("sb-1", "/workspace/repo");
  await client.diff("sb-1", "/workspace/repo");
  await client.reset("sb-1", "/workspace/repo");
  await client.log("sb-1", "/workspace/repo");
  await client.show("sb-1", "/workspace/repo", "HEAD");
  await client.createBranch("sb-1", "/workspace/repo", "feat");
  await client.checkoutBranch("sb-1", "/workspace/repo", "feat");
  await client.deleteBranch("sb-1", "/workspace/repo", "feat");
  await client.add("sb-1", "/workspace/repo", ["a.ts"]);
  await client.commit("sb-1", "/workspace/repo", "msg", "Test User", "test@example.com");
  await client.push("sb-1", "/workspace/repo");
  await client.pull("sb-1", "/workspace/repo");

  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/git/clone");
  assert.deepEqual(jsonOf(calls[0]!), {
    url: "https://example.com/repo.git",
    path: "/workspace/repo",
  });
  assert.deepEqual(jsonOf(calls[8]!), { path: "/workspace/repo", revision: "HEAD" });
  assert.deepEqual(jsonOf(calls[12]!), { path: "/workspace/repo", files: ["a.ts"] });
  assert.deepEqual(jsonOf(calls[13]!), {
    path: "/workspace/repo",
    message: "msg",
    author: "Test User",
    email: "test@example.com",
  });
});
