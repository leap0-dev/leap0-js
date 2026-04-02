import assert from "node:assert/strict"
import { test } from "vitest"

import { resolveConfig } from "@/config/index.js"
import { ensureLeadingSlash, sandboxBaseUrl, sandboxIdOf, snapshotIdOf, templateIdOf, toFileUri, trimSlash, websocketUrlFromHttp, withQuery } from "@/core/utils.js"

test("resolveConfig trims values and reads env defaults", () => {
  process.env.LEAP0_API_KEY = " env-key "
  process.env.LEAP0_BASE_URL = "https://api.example.com/"
  process.env.LEAP0_SANDBOX_DOMAIN = "sandbox.example.com/"
  delete process.env.LEAP0_SDK_OTEL_ENABLED
  delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT

  const config = resolveConfig()
  assert.equal(config.apiKey, "env-key")
  assert.equal(config.baseUrl, "https://api.example.com")
  assert.equal(config.sandboxDomain, "sandbox.example.com")
  assert.equal(config.authHeader, "authorization")
  assert.equal(config.sdkOtelEnabled, false)
})

test("resolveConfig respects explicit values", () => {
  const config = resolveConfig({ apiKey: "key", baseUrl: "https://api.custom.dev/", sandboxDomain: "sb.custom.dev/", timeout: 42, authHeader: "x-api-key", bearer: false, sdkOtelEnabled: true })
  assert.deepEqual(config, { apiKey: "key", baseUrl: "https://api.custom.dev", sandboxDomain: "sb.custom.dev", timeout: 42, authHeader: "x-api-key", bearer: false, sdkOtelEnabled: true })
})

test("resolveConfig enables sdk otel from standard OTEL env", () => {
  process.env.LEAP0_API_KEY = "env-key"
  delete process.env.LEAP0_SDK_OTEL_ENABLED
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4318"

  const config = resolveConfig()
  assert.equal(config.sdkOtelEnabled, true)
})

test("resolveConfig respects explicit sdk otel disable", () => {
  process.env.LEAP0_API_KEY = "env-key"
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4318"

  const config = resolveConfig({ sdkOtelEnabled: false })
  assert.equal(config.sdkOtelEnabled, false)
})

test("resolveConfig rejects invalid config", () => {
  assert.throws(() => resolveConfig({ timeout: -1, apiKey: "key" }))
  assert.throws(() => resolveConfig({ apiKey: "   " }))
  assert.throws(() => resolveConfig({ apiKey: "key", authHeader: "   " }))
})

test("utility helpers normalize refs and urls", () => {
  assert.equal(sandboxIdOf("sb-1"), "sb-1")
  assert.equal(snapshotIdOf({ id: "snap-1" }), "snap-1")
  assert.equal(templateIdOf({ id: "tpl-1" }), "tpl-1")
  assert.equal(trimSlash("https://api.example.com///"), "https://api.example.com")
  assert.equal(ensureLeadingSlash("foo"), "/foo")
  assert.equal(sandboxBaseUrl("sb-1", "sandbox.example.com", 3000), "https://sb-1-3000.sandbox.example.com")
  assert.equal(websocketUrlFromHttp("https://a.example.com/x"), "wss://a.example.com/x")
  assert.equal(toFileUri("workspace/app.ts"), "file:///workspace/app.ts")
  assert.equal(withQuery("/v1/test", { a: 1, b: true, c: undefined }), "/v1/test?a=1&b=true")
})
