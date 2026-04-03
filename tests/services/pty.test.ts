import assert from "node:assert/strict";
import { test } from "vitest";

import { PtyClient, PtyConnection } from "@/services/pty.js";
import { createRecordedTransport } from "@tests/utils/helpers.ts";

test("pty client sends expected request shapes", async () => {
  const { transport, calls } = createRecordedTransport({
    requestJson: async (path: string, init: RequestInit, options: never) => {
      calls.push({ path, init, options });
      const session = {
        id: "sess-1",
        cwd: "/workspace",
        envs: {},
        cols: 80,
        rows: 24,
        created_at: "2026-01-01T00:00:00Z",
        active: true,
        lazy_start: false,
      };
      if (path.endsWith("/pty") && (init.method ?? "GET") === "GET") return { items: [session] };
      return session;
    },
  });
  const client = new PtyClient(transport as never);
  await client.list("sb-1");
  await client.create("sb-1", { cols: 80, rows: 24, cwd: "/workspace" });
  await client.get("sb-1", "sess-1");
  await client.resize("sb-1", "sess-1", 120, 40);
  await client.delete("sb-1", "sess-1");
  assert.equal(calls[0]?.path, "/v1/sandbox/sb-1/pty");
  assert.equal(calls[1]?.path, "/v1/sandbox/sb-1/pty");
  assert.equal(calls[3]?.path, "/v1/sandbox/sb-1/pty/sess-1/resize");
  assert.equal(
    client.websocketUrl("sb-1", "sess-1"),
    "wss://api.example.com/v1/sandbox/sb-1/pty/sess-1/connect",
  );
  assert.deepEqual(client.websocketHeaders(), { authorization: "test-api-key" });
});

test("pty connection sends, receives, and closes websocket data", async () => {
  let sent: unknown;
  let closed = false;
  const handlers = new Map<string, (event: { data?: unknown }) => void>();
  const socket = {
    send(data: unknown) {
      sent = data;
    },
    close() {
      closed = true;
    },
    addEventListener(type: string, handler: (event: { data?: unknown }) => void) {
      handlers.set(type, handler);
    },
    removeEventListener(type: string) {
      handlers.delete(type);
    },
  };
  const connection = new PtyConnection(socket as never);
  connection.send("hello");
  const recv = connection.recv();
  handlers.get("message")?.({ data: "world" });
  assert.equal(sent, "hello");
  assert.deepEqual(Array.from(await recv), Array.from(new TextEncoder().encode("world")));
  connection.close();
  assert.equal(closed, true);
});
