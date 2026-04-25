import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "vitest";

import { Leap0Error } from "@/core/errors.js";
import { SandboxesClient } from "@/services/sandboxes.js";
import { createRecordedTransport, jsonOf } from "@tests/utils/helpers.ts";

function makeClient() {
  const { transport, calls } = createRecordedTransport({
    requestJson: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve({
        id: "sb-1",
        template_id: "tpl-1",
        state: "running",
        vcpu: 2,
        memory: 1024,
        disk: 4096,
        timeout: 10,
        auto_pause: false,
        created_at: "2026-01-01T00:00:00Z",
      });
    },
  });
  const client = new SandboxesClient(transport as never);
  return { client, calls };
}

const ENV_KEYS = ["OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_HEADERS"] as const;
let envSnapshot: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  envSnapshot = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = envSnapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

test("sandboxes create validates payload and wraps result", async () => {
  const { client, calls } = makeClient();
  const result = await client.create({
    templateName: " custom ",
    vcpu: 2,
    memory: 1024,
    timeout: 10,
  });
  assert.equal(result.id, "sb-1");
  assert.equal(result.templateId, "tpl-1");
  assert.equal(result.memory, 1024);
  assert.equal(result.disk, 4096);
  assert.equal(result.createdAt, "2026-01-01T00:00:00Z");
  assert.equal(calls[0]?.path, "/v1/sandbox");
  assert.equal((jsonOf(calls[0]!) as { template_name: string }).template_name, "custom");
});

test("sandboxes create serializes object storage mounts", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve({
        id: "sb-1",
        template_id: "tpl-1",
        state: "running",
        vcpu: 2,
        memory: 1024,
        disk: 4096,
        timeout: 10,
        auto_pause: false,
        mounts: [
          {
            id: "mnt-1",
            type: "object-storage",
            bucket: "project-assets",
            mount_path: "/data/assets",
            prefix: "docs/",
            read_only: true,
          },
        ],
        created_at: "2026-01-01T00:00:00Z",
      });
    },
  });
  const client = new SandboxesClient(transport as never);

  const result = await client.create({
    mounts: [
      {
        type: "object-storage",
        bucket: "project-assets",
        mountPath: "/data/assets",
        endpoint: "https://storage.example.com",
        prefix: "docs/",
      },
    ],
  });

  assert.deepEqual((jsonOf(calls[0]!) as { mounts: unknown }).mounts, [
    {
      type: "object-storage",
      bucket: "project-assets",
      mount_path: "/data/assets",
      endpoint: "https://storage.example.com",
      prefix: "docs/",
    },
  ]);
  assert.equal(result.mounts?.[0]?.bucket, "project-assets");
  assert.equal(result.mounts?.[0]?.mountPath, "/data/assets");
});

test("sandboxes create rejects invalid parameters", async () => {
  const { client } = makeClient();
  await assert.rejects(() => client.create(null as never), /params must be an object/);
  await assert.rejects(
    () => client.create({ templateName: 123 as never }),
    /templateName must be a string/,
  );
  await assert.rejects(() => client.create({ vcpu: 0 }), Leap0Error);
  await assert.rejects(() => client.create({ memory: 513 }), Leap0Error);
  await assert.rejects(() => client.create({ timeout: 99999 }), Leap0Error);
  await assert.rejects(() => client.create({ mounts: [{ type: "object-storage", bucket: "b", mountPath: "/data", endpoint: "not-a-url" }] }), Leap0Error);
  await assert.rejects(() => client.create({ mounts: [
    { type: "object-storage", bucket: "a", mountPath: "/data", endpoint: "https://storage-a.example.com" },
    { type: "object-storage", bucket: "b", mountPath: "/data", endpoint: "https://storage-b.example.com" },
  ] }), /unique mountPath/);
});

test("sandboxes add update and delete mounts", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve({
        id: "mnt-1",
        type: "object-storage",
        bucket: "project-assets",
        mount_path: "/data/assets",
        prefix: "docs/",
        read_only: false,
      });
    },
    request: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  });
  const client = new SandboxesClient(transport as never);

  const added = await client.addMount("sb-1", {
    type: "object-storage",
    bucket: "project-assets",
    mountPath: "/data/assets",
    endpoint: "https://storage.example.com",
    prefix: "docs/",
  });
  const updated = await client.updateMount("sb-1", "mnt-1", {
    prefix: "docs/",
    readOnly: false,
  });
  await client.deleteMount("sb-1", "mnt-1");

  assert.equal(added.id, "mnt-1");
  assert.equal(updated.mountPath, "/data/assets");
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/mounts");
  assert.deepEqual(jsonOf(calls[0]!) as { endpoint: string; mount_path: string }, {
    type: "object-storage",
    bucket: "project-assets",
    mount_path: "/data/assets",
    endpoint: "https://storage.example.com",
    prefix: "docs/",
  });
  assert.equal(calls[1]?.path, "/v1/sandbox/sb-1/mounts/mnt-1");
  assert.deepEqual(jsonOf(calls[1]!) as { prefix: string; read_only: boolean }, {
    prefix: "docs/",
    read_only: false,
  });
  assert.equal(calls[2]?.path, "/v1/sandbox/sb-1/mounts/mnt-1");
});

test("sandboxes get pause stop start and delete target sandbox ids", async () => {
  const { client, calls } = makeClient();
  await client.get({ id: "sb-1" });
  await client.pause("sb-2");
  await client.stop("sb-3");
  await client.start("sb-4");
  await client.delete("sb-5");
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/");
  assert.equal(calls[1]?.path, "/v1/sandbox/sb-2/pause");
  assert.equal(calls[2]?.path, "/v1/sandbox/sb-3/stop");
  assert.equal(calls[3]?.path, "/v1/sandbox/sb-4/start");
  assert.equal(calls[4]?.path, "/v1/sandbox/sb-4/");
  assert.equal(calls[5]?.path, "/v1/sandbox/sb-5/");
});

test("sandboxes list accepts stopped lifecycle filters", async () => {
  const { transport } = createRecordedTransport({
    requestJson: () => Promise.resolve({ items: [], total_items: 0 }),
  });
  const client = new SandboxesClient(transport as never);

  await client.list({ state: "stopping" });
  await client.list({ state: "stopped" });
});

test("sandboxes createSnapshot targets sandbox snapshot endpoint", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve({
        id: "snap-1",
        name: "snap-a",
        template_id: "tpl-1",
        vcpu: 2,
        memory: 1024,
        disk: 4096,
        created_at: "2026-01-01T00:00:00Z",
      });
    },
  });
  const client = new SandboxesClient(transport as never);

  const created = await client.createSnapshot("sb-1", { name: "snap-a", killSandboxAfter: true });

  assert.equal(created.id, "snap-1");
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/snapshot/create");
  assert.deepEqual(jsonOf(calls[0]!), { name: "snap-a", kill_sandbox_after: true });
});

test("sandboxes createSnapshot validates snapshot params", async () => {
  const { client } = makeClient();
  await assert.rejects(() => client.createSnapshot("sb-1", { name: "" }), Leap0Error);
  await assert.rejects(() => client.createSnapshot("sb-1", { name: "   " }), Leap0Error);
});

test("sandboxes runtime info targets system endpoints", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      if (path.endsWith("/user-home-dir")) {
        return Promise.resolve({ user_home_dir: "/home/steven" });
      }
      return Promise.resolve({ workdir: "/home/steve/agent" });
    },
  });
  const client = new SandboxesClient(transport as never);

  assert.equal(await client.getUserHomeDir("sb-1"), "/home/steven");
  assert.equal(await client.getWorkdir("sb-1"), "/home/steve/agent");
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/system/user-home-dir");
  assert.equal(calls[1]?.path, "/v1/sandbox/sb-1/system/workdir");
});

test("sandboxes runtime info rejects non-object responses", async () => {
  const { transport } = createRecordedTransport({
    requestJson: (path: string) => {
      if (path.endsWith("/user-home-dir")) {
        return Promise.resolve(null);
      }
      return Promise.resolve("/tmp");
    },
  });
  const client = new SandboxesClient(transport as never);

  await assert.rejects(() => client.getUserHomeDir("sb-1"), /missing user_home_dir/);
  await assert.rejects(() => client.getWorkdir("sb-1"), /missing workdir/);
});

test("sandboxes create and delete presigned urls", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve({
        id: "psu-1",
        token: "tok_1",
        url: "https://tok_1.leap0.app",
        sandbox_id: "sb-1",
        port: 8080,
        expires_at: "2026-01-01T00:15:00Z",
        created_at: "2026-01-01T00:00:00Z",
      });
    },
    request: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  });
  const client = new SandboxesClient(transport as never);

  const created = await client.createPresignedUrl("sb-1", { port: 8080, expiresIn: 900 });
  await client.deletePresignedUrl("sb-1", created.id);

  assert.equal(created.url, "https://tok_1.leap0.app");
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/presigned-url");
  assert.deepEqual(jsonOf(calls[0]!) as { port: number; expires_in: number }, {
    port: 8080,
    expires_in: 900,
  });
  assert.equal(calls[1]?.path, "/v1/sandbox/sb-1/presigned-url/psu-1");
});


test("sandboxes list sends query params and normalizes response", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: (path: string, init: RequestInit, options: unknown) => {
      calls.push({ path, init, options: options as never });
      return Promise.resolve({
        items: [
          {
            id: "sb-1",
            template_id: "tpl-1",
            state: "running",
            launch_time: "2026-01-01T00:00:05Z",
            state_change_time: "2026-01-01T00:00:10Z",
            timeout_at: 1735689900,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
        total_items: 1,
      });
    },
  });
  const client = new SandboxesClient(transport as never);

  const result = await client.list({
    state: "running",
    sort: "state",
    orderBy: "asc",
    page: 2,
    pageSize: 10,
  });

  assert.equal(calls[0]?.path, "/v1/sandboxes");
  assert.deepEqual(calls[0]?.options.query, {
    state: "running",
    sort: "state",
    "order-by": "asc",
    page: 2,
    "page-size": 10,
  });
  assert.equal(result.totalItems, 1);
  assert.equal(result.items[0]?.templateId, "tpl-1");
  assert.equal(result.items[0]?.launchTime, "2026-01-01T00:00:05Z");
});

test("sandboxes build invoke and websocket urls", () => {
  const { client } = makeClient();
  assert.equal(client.invokeUrl("sb-1", "healthz"), "https://sb-1.sandbox.example.com/healthz");
  assert.equal(client.websocketUrl("sb-1", "/ws"), "wss://sb-1.sandbox.example.com/ws");
});

test("sandboxes create injects otel env when enabled", async () => {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://collector:4318";
  process.env.OTEL_EXPORTER_OTLP_HEADERS = "authorization=token";
  const { client, calls } = makeClient();

  await client.create({
    otelExport: true,
    envVars: { APP_ENV: "test" },
  });

  assert.deepEqual((jsonOf(calls[0]!) as { env_vars: Record<string, string> }).env_vars, {
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
    OTEL_EXPORTER_OTLP_HEADERS: "authorization=token",
    APP_ENV: "test",
  });
});

test("sandboxes create accepts telemetry alias for otel export", async () => {
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://collector:4318";
  delete process.env.OTEL_EXPORTER_OTLP_HEADERS;
  const { client, calls } = makeClient();

  await client.create({ telemetry: true });

  assert.deepEqual((jsonOf(calls[0]!) as { env_vars: Record<string, string> }).env_vars, {
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://collector:4318",
  });
});

test("sandboxes create rejects otel export without endpoint", async () => {
  delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  delete process.env.OTEL_EXPORTER_OTLP_HEADERS;
  const { client } = makeClient();

  await assert.rejects(() => client.create({ otelExport: true }), /OTEL_EXPORTER_OTLP_ENDPOINT/);
});

test("sandboxes create serializes network policy using api field names", async () => {
  const { client, calls } = makeClient();

  await client.create({
    networkPolicy: {
      mode: "custom",
      allowedDomains: ["example.com"],
      allowedCidrs: ["10.0.0.0/8"],
      transforms: [
        {
          domain: "example.com",
          injectHeaders: { authorization: "token" },
          stripHeaders: ["cookie"],
        },
      ],
    },
  });

  assert.deepEqual((jsonOf(calls[0]!) as { network_policy: unknown }).network_policy, {
    mode: "custom",
    allow_domains: ["example.com"],
    allow_cidrs: ["10.0.0.0/8"],
    transforms: [
      {
        domain: "example.com",
        inject_headers: { authorization: "token" },
        strip_headers: ["cookie"],
      },
    ],
  });
});
