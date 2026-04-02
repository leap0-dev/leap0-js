import assert from "node:assert/strict"
import { expectTypeOf, test } from "vitest"

import { Leap0Client, Sandbox } from "@/client/index.js"
import type { RequestOptions } from "@/models/index.js"

test("Leap0Client wires services and supports convenience methods", async () => {
  process.env.LEAP0_API_KEY = "env-key"
  const client = new Leap0Client({ apiKey: "explicit-key", sandboxDomain: "sandbox.example.com" })
  const originalGet = client.sandboxes.get
  const originalCreate = client.sandboxes.create
  client.sandboxes.get = (async (id: string) => ({ id, state: "started" })) as never
  client.sandboxes.create = (async () => ({ id: "sb-2", state: "creating" })) as never
  try {
    assert.equal((await client.getSandbox("sb-1")).id, "sb-1")
    assert.equal((await client.createSandbox()).id, "sb-2")
  } finally {
    client.sandboxes.get = originalGet
    client.sandboxes.create = originalCreate
    await client.close()
  }
})

test("Sandbox binds service methods to itself", async () => {
  const fakeClient = {
    sandboxes: {
      get: async () => ({ id: "sb-1", state: "started", refreshed: true }),
      pause: async () => ({ id: "sb-1", state: "paused" }),
      delete: async () => undefined,
      invokeUrl: (id: string, path: string, port?: number) => `invoke:${id}:${path}:${port ?? ""}`,
      websocketUrl: (id: string, path: string, port?: number) => `ws:${id}:${path}:${port ?? ""}`,
    },
    filesystem: { readFile: async (sandbox: { id: string }, path: string) => `${sandbox.id}:${path}` },
    git: {}, process: {}, pty: {}, lsp: {}, ssh: {}, codeInterpreter: {}, desktop: {},
  }
  const sandbox = new Sandbox(fakeClient as never, { id: "sb-1", state: "started" })
  assert.equal(await sandbox.filesystem.readFile("/tmp/test.txt"), "sb-1:/tmp/test.txt")
  await sandbox.refresh()
  assert.equal((sandbox as { refreshed?: boolean }).refreshed, true)
  await sandbox.pause()
  assert.equal(sandbox.state, "paused")
  assert.equal(sandbox.invokeUrl("/healthz", 3000), "invoke:sb-1:/healthz:3000")
})

test("client and sandbox helpers stay strongly typed", () => {
  expectTypeOf<ReturnType<Leap0Client["getSandbox"]>>().toEqualTypeOf<Promise<Sandbox>>()
  expectTypeOf<ReturnType<Leap0Client["createSandbox"]>>().toEqualTypeOf<Promise<Sandbox>>()
  expectTypeOf<ReturnType<Leap0Client["sandboxes"]["create"]>>().toEqualTypeOf<Promise<Sandbox>>()
  expectTypeOf<ReturnType<Leap0Client["snapshots"]["resume"]>>().toEqualTypeOf<Promise<Sandbox>>()

  expectTypeOf<Sandbox["process"]["execute"]>().parameters.toEqualTypeOf<[
    params: { command: string; cwd?: string; timeout?: number },
    options?: RequestOptions,
  ]>()
  expectTypeOf<Sandbox["filesystem"]["writeFile"]>().parameters.toEqualTypeOf<[
    path: string,
    content: string,
    options?: RequestOptions,
  ]>()
  expectTypeOf<Sandbox["git"]["clone"]>().parameters.toEqualTypeOf<[
    url: string,
    path: string,
    options?: RequestOptions,
  ]>()
  expectTypeOf<Sandbox["pty"]["create"]>().parameters.toEqualTypeOf<[
    params?: { id?: string; cols?: number; rows?: number; cwd?: string; command?: string; env?: Record<string, string> },
    options?: RequestOptions,
  ]>()
  expectTypeOf<Sandbox["desktop"]["waitUntilReady"]>().parameters.toEqualTypeOf<[timeout?: number]>()
  expectTypeOf<Sandbox["ssh"]["validateAccess"]>().parameters.toEqualTypeOf<[
    accessId: string,
    password: string,
    options?: RequestOptions,
  ]>()
  expectTypeOf<Sandbox["codeInterpreter"]["executeStream"]>().parameters.toEqualTypeOf<[
    params: { code: string; language: "python" | "typescript"; contextId?: string },
    options?: RequestOptions,
  ]>()
})
