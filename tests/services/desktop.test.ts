import assert from "node:assert/strict"
import { test } from "vitest"

import { Leap0Error } from "@/core/errors.js"
import { DesktopClient } from "@/services/desktop.js"
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts"

test("desktop client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJsonUrl: (url: string, init: RequestInit = {}, options = {}) => {
      calls.push({ path: new URL(url).pathname, url, init, options })
      return Promise.resolve({ ok: true, processes: [{ status: "running" }] })
    },
  })
  const client = new DesktopClient(transport as never, "sandbox.example.com")
  await client.display("sb-1")
  await client.setScreen("sb-1", { width: 1280 })
  await client.movePointer("sb-1", 10, 20)
  await client.typeText("sb-1", "hello")
  await client.processStatus("sb-1", "vnc-server")
  await client.drag("sb-1", { startX: 1, startY: 2, endX: 3, endY: 4 })
  await client.scroll("sb-1", { deltaY: -100 })
  await client.waitUntilReady("sb-1", 1)
  assert.equal(calls[0]?.url, "https://sb-1.sandbox.example.com/api/display")
  assert.equal(calls[1]?.url, "https://sb-1.sandbox.example.com/api/display/screen")
  assert.deepEqual(jsonOf(calls[1]!), { width: 1280 })
  assert.equal(calls[2]?.url, "https://sb-1.sandbox.example.com/api/input/move")
  assert.equal(calls[4]?.url, "https://sb-1.sandbox.example.com/api/process/vnc-server/status")
  assert.equal(calls[5]?.url, "https://sb-1.sandbox.example.com/api/input/drag")
  assert.equal(calls[6]?.url, "https://sb-1.sandbox.example.com/api/input/scroll")
})

test("desktop statusStream parses SSE and raises API errors", async () => {
  const { transport, calls } = createRecordedTransport({
    streamJsonUrl: async function* (url: string) {
      calls.push({ path: new URL(url).pathname, url, init: { method: "GET" }, options: {} })
      yield { status: "running" }
    },
    requestJsonUrl: () => Promise.reject(new Leap0Error("Desktop request failed")),
  })
  const client = new DesktopClient(transport as never, "sandbox.example.com")
  const events: unknown[] = []
  for await (const event of client.statusStream("sb-1")) events.push(event)
  assert.deepEqual(events, [{ status: "running" }])
  assert.equal(calls[0]?.url, "https://sb-1.sandbox.example.com/api/status/stream")
  await assert.rejects(() => client.health("sb-1"), Leap0Error)
})
