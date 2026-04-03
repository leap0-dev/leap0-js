import { z } from "zod";

export const NetworkPolicyMode = {
  ALLOW_ALL: "allow-all",
  DENY_ALL: "deny-all",
  CUSTOM: "custom",
} as const;

export const SandboxState = {
  STARTING: "starting",
  RUNNING: "running",
  SNAPSHOTTING: "snapshotting",
  PAUSED: "paused",
  UNPAUSING: "unpausing",
  DELETING: "deleting",
  DELETED: "deleted",
} as const;

export const networkPolicyModeSchema = z.enum([
  NetworkPolicyMode.ALLOW_ALL,
  NetworkPolicyMode.DENY_ALL,
  NetworkPolicyMode.CUSTOM,
]);
export type NetworkPolicyMode = z.infer<typeof networkPolicyModeSchema>;

export const networkPolicySchema = z.object({
  mode: networkPolicyModeSchema,
  allowedDomains: z.array(z.string()).optional(),
  allowedCidrs: z.array(z.string()).optional(),
  transforms: z
    .array(
      z.object({
        domain: z.string(),
        injectHeaders: z.record(z.string(), z.string()).optional(),
        stripHeaders: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});
export type NetworkPolicy = z.infer<typeof networkPolicySchema>;

export const sandboxStateSchema = z.enum([
  SandboxState.STARTING,
  SandboxState.RUNNING,
  SandboxState.SNAPSHOTTING,
  SandboxState.PAUSED,
  SandboxState.UNPAUSING,
  SandboxState.DELETING,
  SandboxState.DELETED,
]);
export type SandboxState = z.infer<typeof sandboxStateSchema>;

export const sandboxDataSchema = z
  .object({
    id: z.string(),
    templateId: z.string(),
    state: sandboxStateSchema,
    vcpu: z.number(),
    memoryMib: z.number(),
    diskMib: z.number(),
    autoPause: z.boolean(),
    networkPolicy: networkPolicySchema.optional(),
    createdAt: z.string(),
  })
  .catchall(z.unknown());
export type SandboxData = z.infer<typeof sandboxDataSchema>;

export const createSandboxParamsSchema = z.object({
  templateName: z.string().optional(),
  vcpu: z.number().int().positive().optional(),
  memoryMib: z.number().int().positive().optional(),
  timeoutMin: z.number().int().positive().optional(),
  autoPause: z.boolean().optional(),
  otelExport: z.boolean().optional(),
  telemetry: z.boolean().optional(),
  envVars: z.record(z.string(), z.string()).optional(),
  networkPolicy: networkPolicySchema.optional(),
});
export type CreateSandboxParams = z.infer<typeof createSandboxParamsSchema>;

type NetworkPolicyWire = {
  mode: NetworkPolicyMode;
  allow_domains?: string[];
  allow_cidrs?: string[];
  transforms?: Array<{
    domain: string;
    inject_headers?: Record<string, string>;
    strip_headers?: string[];
  }>;
};

export function toNetworkPolicyWire(
  policy: NetworkPolicy | undefined,
): NetworkPolicyWire | undefined {
  if (policy == null) return undefined;

  return {
    mode: policy.mode,
    allow_domains: policy.allowedDomains,
    allow_cidrs: policy.allowedCidrs,
    transforms: policy.transforms?.map((transform) => ({
      domain: transform.domain,
      inject_headers: transform.injectHeaders,
      strip_headers: transform.stripHeaders,
    })),
  };
}
