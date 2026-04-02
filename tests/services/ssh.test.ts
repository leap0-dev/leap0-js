import assert from "node:assert/strict"
import { test } from "vitest"

import { SshClient } from "@/services/ssh.js"
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts"

test("ssh client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport()
  const client = new SshClient(transport as never)
  await client.createAccess("sb-1")
  await client.validateAccess("sb-1", "ssh-1", "secret")
  await client.regenerateAccess("sb-1")
  await client.deleteAccess("sb-1")
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/ssh/access")
  assert.deepEqual(jsonOf(calls[1]!), { access_id: "ssh-1", password: "secret" })
  assert.equal(calls[2]?.path, "/v1/sandbox/sb-1/ssh/regen")
  assert.equal(calls[3]?.path, "/v1/sandbox/sb-1/ssh/access")
})
