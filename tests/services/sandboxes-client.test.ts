import assert from "node:assert/strict"
import { test } from "vitest"

import { Leap0Error } from "@/core/errors.js"
import { SandboxesClient } from "@/services/sandboxes.js"
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts"

function makeClient() {
  const { transport, calls } = createRecordedTransport({ requestJson: (path: string, init: RequestInit, options: unknown) => { calls.push({ path, init, options: options as never }); return Promise.resolve({ id: "sb-1", state: "started" }) } })
  const client = new SandboxesClient(transport as never, "sandbox.example.com", (data) => ({ wrapped: true, ...data }))
  return { client, calls }
}

test("sandboxes create validates payload and wraps result", async () => {
  const { client, calls } = makeClient()
  const result = await client.create({ templateName: " custom ", vcpu: 2, memoryMib: 1024, timeoutMin: 10 })
  assert.equal(result.id, "sb-1")
  assert.equal((result as unknown as { wrapped: boolean }).wrapped, true)
  assert.equal(calls[0]?.path, "/v1/sandbox")
  assert.equal((jsonOf(calls[0]!) as { template_name: string }).template_name, "custom")
})

test("sandboxes create rejects invalid parameters", () => {
  const { client } = makeClient()
  assert.throws(() => client.create({ vcpu: 0 }), Leap0Error)
  assert.throws(() => client.create({ memoryMib: 513 }), Leap0Error)
  assert.throws(() => client.create({ timeoutMin: 999 }), Leap0Error)
})

test("sandboxes get pause and delete target sandbox ids", async () => {
  const { client, calls } = makeClient()
  await client.get({ id: "sb-1" })
  await client.pause("sb-2")
  await client.delete("sb-3")
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/")
  assert.equal(calls[1]?.path, "/v1/sandbox/sb-2/pause")
  assert.equal(calls[2]?.path, "/v1/sandbox/sb-3/")
})

test("sandboxes build invoke and websocket urls", () => {
  const { client } = makeClient()
  assert.equal(client.invokeUrl("sb-1", "healthz"), "https://sb-1.sandbox.example.com/healthz")
  assert.equal(client.websocketUrl("sb-1", "/ws"), "wss://sb-1.sandbox.example.com/ws")
})

test("sandboxes create injects otel env when enabled", async () => {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://collector:4318"
  process.env.OTEL_EXPORTER_OTLP_HEADERS = "authorization=token"
  const { client, calls } = makeClient()

  await client.create({
    otelExport: true,
    envVars: { APP_ENV: "test" },
  })

  assert.deepEqual((jsonOf(calls[0]!) as { env_vars: Record<string, string> }).env_vars, {
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
    OTEL_EXPORTER_OTLP_HEADERS: "authorization=token",
    APP_ENV: "test",
  })
})

test("sandboxes create accepts telemetry alias for otel export", async () => {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://collector:4318"
  delete process.env.OTEL_EXPORTER_OTLP_HEADERS
  const { client, calls } = makeClient()

  await client.create({ telemetry: true })

  assert.deepEqual((jsonOf(calls[0]!) as { env_vars: Record<string, string> }).env_vars, {
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
  })
})

test("sandboxes create rejects otel export without endpoint", () => {
  delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  delete process.env.OTEL_EXPORTER_OTLP_HEADERS
  const { client } = makeClient()

  assert.throws(() => client.create({ otelExport: true }), /OTEL_EXPORTER_OTLP_ENDPOINT/)
})
