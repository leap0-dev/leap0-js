import assert from "node:assert/strict"
import { test } from "vitest"

import { FilesystemClient } from "@/services/filesystem.js"
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts"

test("filesystem client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport()
  const client = new FilesystemClient(transport as never)
  await client.ls("sb-1", "/workspace")
  await client.stat("sb-1", "/tmp/file")
  await client.mkdir("sb-1", "/tmp/new")
  await client.writeFile("sb-1", "/tmp/a.txt", "hello")
  await client.writeBytes("sb-1", "/tmp/b.bin", new Uint8Array([1, 2]))
  await client.readFile("sb-1", "/tmp/a.txt", { head: 10 })
  await client.readBytes("sb-1", "/tmp/b.bin")
  await client.delete("sb-1", "/tmp/a.txt")
  await client.setPermissions("sb-1", "/tmp/a.txt", "0755")
  await client.glob("sb-1", "/workspace", "**/*.ts")
  await client.grep("sb-1", "/workspace", "todo")
  await client.editFile("sb-1", "/tmp/a.txt", { oldText: "a", newText: "b" })
  await client.editFiles("sb-1", [{ path: "/tmp/a.txt", edit: { oldText: "a", newText: "b" } }])
  await client.move("sb-1", "/tmp/a", "/tmp/b")
  await client.copy("sb-1", "/tmp/b", "/tmp/c")
  await client.exists("sb-1", "/tmp/c")
  await client.tree("sb-1", "/workspace", 2)

  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/filesystem/ls")
  assert.deepEqual(jsonOf(calls[0]!), { path: "/workspace" })
  assert.equal(new Headers(calls[3]!.init.headers).get("content-type"), "text/plain")
  assert.equal(calls[3]?.options.query?.path, "/tmp/a.txt")
  assert.equal(new Headers(calls[4]!.init.headers).get("content-type"), "application/octet-stream")
  assert.equal(calls[5]?.options.query?.head, 10)
  assert.deepEqual(jsonOf(calls[11]!), { path: "/tmp/a.txt", edit: { oldText: "a", newText: "b" } })
  assert.deepEqual(jsonOf(calls[16]!), { path: "/workspace", max_depth: 2 })
})
