import assert from "node:assert/strict";
import { expectTypeOf, test } from "vitest";

import { Leap0Client, Sandbox } from "@/client/index.js";
import { SERVICES } from "@/client/sandbox.js";
import type { PresignedUrl, RequestOptions } from "@/models/index.js";

test("Leap0Client wires services and supports direct access", async () => {
  const originalApiKey = process.env.LEAP0_API_KEY;
  process.env.LEAP0_API_KEY = "env-key";
  const client = new Leap0Client({ apiKey: "explicit-key", sandboxDomain: "sandbox.example.com" });
  const originalGet = client.sandboxes.get;
  const originalCreate = client.sandboxes.create;
  client.sandboxes.get = (async (id: string) => ({
    id,
    templateId: "tpl-1",
    state: "running",
    vcpu: 1,
    memory: 1024,
    disk: 4096,
    autoPause: false,
    createdAt: "2026-01-01T00:00:00Z",
  })) as never;
  client.sandboxes.create = (async () => ({
    id: "sb-2",
    templateId: "tpl-1",
    state: "starting",
    vcpu: 1,
    memory: 1024,
    disk: 4096,
    autoPause: false,
    createdAt: "2026-01-01T00:00:00Z",
  })) as never;
  try {
    assert.equal((await client.sandboxes.get("sb-1")).id, "sb-1");
    assert.equal((await client.sandboxes.create()).id, "sb-2");
  } finally {
    client.sandboxes.get = originalGet;
    client.sandboxes.create = originalCreate;
    if (originalApiKey === undefined) {
      delete process.env.LEAP0_API_KEY;
    } else {
      process.env.LEAP0_API_KEY = originalApiKey;
    }
    await client.close();
  }
});

test("Sandbox binds service methods to itself", async () => {
  let wrapped = false;
  const fakeClient = {
    sandboxes: {
      get: async () => {
        if (!wrapped) {
          wrapped = true;
          return new Sandbox(fakeClient as never, {
            id: "sb-1",
            templateId: "tpl-1",
            state: "running",
            vcpu: 2,
            memory: 2048,
            disk: 4096,
            autoPause: false,
            createdAt: "2026-01-01T00:00:00Z",
          });
        }
        return {
          id: "sb-1",
          templateId: "tpl-1",
          state: "running",
          vcpu: 2,
          memory: 2048,
          disk: 4096,
          autoPause: false,
          createdAt: "2026-01-01T00:00:00Z",
        };
      },
      pause: async () => ({
        id: "sb-1",
        templateId: "tpl-1",
        state: "paused",
        vcpu: 1,
        memory: 1024,
        disk: 4096,
        autoPause: false,
        createdAt: "2026-01-01T00:00:00Z",
      }),
      stop: async () => ({
        id: "sb-1",
        templateId: "tpl-1",
        state: "stopped",
        vcpu: 1,
        memory: 1024,
        disk: 4096,
        autoPause: false,
        createdAt: "2026-01-01T00:00:00Z",
      }),
      start: async () => ({
        id: "sb-1",
        templateId: "tpl-1",
        state: "running",
        vcpu: 1,
        memory: 1024,
        disk: 4096,
        autoPause: false,
        createdAt: "2026-01-01T00:00:00Z",
      }),
      createSnapshot: async () => ({
        id: "snap-1",
        name: "snap-a",
        templateId: "tpl-1",
        vcpu: 1,
        memory: 1024,
        disk: 4096,
        createdAt: "2026-01-01T00:00:00Z",
      }),
      delete: async () => undefined,
      addMount: async () => ({
        id: "mnt-1",
        type: "object-storage",
        bucket: "project-assets",
        mountPath: "/data/assets",
        prefix: "docs/",
        readOnly: true,
      }),
      updateMount: async () => ({
        id: "mnt-1",
        type: "object-storage",
        bucket: "project-assets",
        mountPath: "/data/assets",
        prefix: "docs/",
        readOnly: false,
      }),
      deleteMount: async () => undefined,
      createPresignedUrl: async () => ({
        id: "psu-1",
        token: "tok_1",
        url: "https://tok_1.leap0.app",
        sandboxId: "sb-1",
        port: 8080,
        expiresAt: "2026-01-01T00:15:00Z",
        createdAt: "2026-01-01T00:00:00Z",
      }),
      deletePresignedUrl: async () => undefined,
      getUserHomeDir: async (id: string) => `home:${id}`,
      getWorkdir: async (id: string) => `workdir:${id}`,
      invokeUrl: (id: string, path: string, port?: number) => `invoke:${id}:${path}:${port ?? ""}`,
      websocketUrl: (id: string, path: string, port?: number) => `ws:${id}:${path}:${port ?? ""}`,
    },
    [SERVICES]: {
      filesystem: {
        readFile: async (sandbox: { id: string }, path: string) => `${sandbox.id}:${path}`,
      },
      git: {},
      process: {},
      pty: {},
      lsp: {},
      ssh: {},
      codeInterpreter: {},
      desktop: {},
    },
  };
  const sandbox = new Sandbox(fakeClient as never, {
    id: "sb-1",
    templateId: "tpl-1",
    state: "running",
    vcpu: 1,
    memory: 1024,
    disk: 4096,
    autoPause: false,
    createdAt: "2026-01-01T00:00:00Z",
  });
  assert.equal(await sandbox.filesystem.readFile("/tmp/test.txt"), "sb-1:/tmp/test.txt");
  assert.equal(sandbox.vcpu, 1);
  await sandbox.refresh();
  assert.equal(sandbox.vcpu, 2);
  assert.equal(sandbox.memory, 2048);
  await sandbox.pause();
  assert.equal(sandbox.state, "paused");
  await sandbox.stop();
  assert.equal(sandbox.state, "stopped");
  await sandbox.start();
  assert.equal(sandbox.state, "running");
  assert.equal((await sandbox.createSnapshot({ name: "snap-a", killSandboxAfter: true })).id, "snap-1");
  assert.equal((await sandbox.addMount({ type: "object-storage", bucket: "project-assets", mountPath: "/data/assets", endpoint: "https://storage.example.com" })).id, "mnt-1");
  assert.equal((await sandbox.updateMount("mnt-1", { readOnly: false })).readOnly, false);
  await sandbox.deleteMount("mnt-1");
  assert.equal(sandbox.invokeUrl("/healthz", 3000), "invoke:sb-1:/healthz:3000");
  assert.equal(await sandbox.getUserHomeDir(), "home:sb-1");
  assert.equal(await sandbox.getWorkdir(), "workdir:sb-1");
  assert.equal((await sandbox.createPresignedUrl({ port: 8080, expiresIn: 15 })).url, "https://tok_1.leap0.app");
  await sandbox.deletePresignedUrl("psu-1");
});

test("Sandbox refresh rejects invalid sandbox states", async () => {
  const sandbox = new Sandbox(
    {
      sandboxes: {
        get: async () => ({
          id: "sb-1",
          templateId: "tpl-1",
          state: "not-real",
          vcpu: 1,
          memory: 1024,
          disk: 4096,
          createdAt: "2026-01-01T00:00:00Z",
        }),
      },
      [SERVICES]: {
        filesystem: {},
        git: {},
        process: {},
        pty: {},
        lsp: {},
        ssh: {},
        codeInterpreter: {},
        desktop: {},
      },
    } as never,
    {
      id: "sb-1",
      templateId: "tpl-1",
      state: "running",
      vcpu: 1,
      memory: 1024,
      disk: 4096,
      createdAt: "2026-01-01T00:00:00Z",
    },
  );

  await assert.rejects(
    () => sandbox.refresh(),
    /Expected this\.client\.sandboxes\.get\(\) to return SandboxData or Sandbox/,
  );
});

test("client and sandbox helpers stay strongly typed", () => {
  expectTypeOf<ReturnType<Leap0Client["sandboxes"]["create"]>>().toMatchTypeOf<
    Promise<{ id: string }>
  >();
  expectTypeOf<ReturnType<Leap0Client["snapshots"]["restore"]>>().toMatchTypeOf<
    Promise<{ id: string }>
  >();

  expectTypeOf<Sandbox["process"]["execute"]>().parameters.toEqualTypeOf<
    [params: { command: string; cwd?: string; timeout?: number; env?: Record<string, string> }, options?: RequestOptions]
  >();
  expectTypeOf<Sandbox["ssh"]["validateAccess"]>().parameters.toEqualTypeOf<
    [params: { id: string; password: string }, options?: RequestOptions]
  >();
  expectTypeOf<Sandbox["ssh"]["deleteAccess"]>().parameters.toEqualTypeOf<
    [params: { id: string }, options?: RequestOptions]
  >();
  expectTypeOf<Sandbox["ssh"]["regenerateAccess"]>().parameters.toEqualTypeOf<
    [params: { id: string }, options?: RequestOptions]
  >();
  expectTypeOf<ReturnType<Sandbox["getUserHomeDir"]>>().toEqualTypeOf<Promise<string>>();
  expectTypeOf<ReturnType<Sandbox["getWorkdir"]>>().toEqualTypeOf<Promise<string>>();
  expectTypeOf<ReturnType<Sandbox["createPresignedUrl"]>>().toEqualTypeOf<Promise<PresignedUrl>>();
  expectTypeOf<Sandbox["templateName"]>().toEqualTypeOf<string | undefined>();
  expectTypeOf<Sandbox["timeout"]>().toEqualTypeOf<number | undefined>();
  expectTypeOf<Sandbox["envVars"]>().toEqualTypeOf<Record<string, string> | undefined>();
  expectTypeOf<Sandbox["mounts"]>().toEqualTypeOf<
    | Array<{ id: string; type: "object-storage"; bucket: string; mountPath: string; prefix?: string | undefined; readOnly?: boolean | undefined }>
    | undefined
  >();
  expectTypeOf<ReturnType<Sandbox["addMount"]>>().toEqualTypeOf<Promise<{ id: string; type: "object-storage"; bucket: string; mountPath: string; prefix?: string | undefined; readOnly?: boolean | undefined }>>();
  expectTypeOf<Sandbox["updateMount"]>().parameters.toEqualTypeOf<
    [mountID: string, mount: { bucket?: string; mountPath?: string; endpoint?: string; prefix?: string; readOnly?: boolean; accessKeyId?: string; secretAccessKey?: string }, options?: { timeout?: number }]
  >();
  expectTypeOf<Sandbox["updatedAt"]>().toEqualTypeOf<string | undefined>();
});
