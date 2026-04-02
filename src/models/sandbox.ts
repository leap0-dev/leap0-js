import { z } from "zod"

export const NetworkPolicyMode = {
  ALLOW_ALL: "allow-all",
  DENY_ALL: "deny-all",
  CUSTOM: "custom",
} as const

export const SandboxState = {
  CREATING: "creating",
  STARTING: "starting",
  STARTED: "started",
  PAUSING: "pausing",
  PAUSED: "paused",
  STOPPING: "stopping",
  STOPPED: "stopped",
  DESTROYED: "destroyed",
  ERROR: "error",
} as const

export const networkPolicyModeSchema = z.enum([
  NetworkPolicyMode.ALLOW_ALL,
  NetworkPolicyMode.DENY_ALL,
  NetworkPolicyMode.CUSTOM,
])
export type NetworkPolicyMode = z.infer<typeof networkPolicyModeSchema>

export const networkPolicySchema = z.object({
  mode: networkPolicyModeSchema,
  allowedDomains: z.array(z.string()).optional(),
  allowedCidrs: z.array(z.string()).optional(),
})
export type NetworkPolicy = z.infer<typeof networkPolicySchema>

export const sandboxStateSchema = z.enum([
  SandboxState.CREATING,
  SandboxState.STARTING,
  SandboxState.STARTED,
  SandboxState.PAUSING,
  SandboxState.PAUSED,
  SandboxState.STOPPING,
  SandboxState.STOPPED,
  SandboxState.DESTROYED,
  SandboxState.ERROR,
])
export type SandboxState = z.infer<typeof sandboxStateSchema>

export const sandboxDataSchema = z.object({
  id: z.string(),
  templateName: z.string().optional(),
  state: sandboxStateSchema.optional(),
  vcpu: z.number().optional(),
  memoryMib: z.number().optional(),
  timeoutMin: z.number().optional(),
  autoPause: z.boolean().optional(),
  envVars: z.record(z.string(), z.string()).optional(),
  networkPolicy: networkPolicySchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).catchall(z.unknown())
export type SandboxData = z.infer<typeof sandboxDataSchema>

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
})
export type CreateSandboxParams = z.infer<typeof createSandboxParamsSchema>
