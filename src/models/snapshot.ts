import { z } from "zod"
import { networkPolicySchema } from "@/models/sandbox.js"

export const snapshotDataSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  sandboxId: z.string().optional(),
  createdAt: z.string().optional(),
}).catchall(z.unknown())
export type SnapshotData = z.infer<typeof snapshotDataSchema>

export const createSnapshotParamsSchema = z.object({
  name: z.string().optional(),
})
export type CreateSnapshotParams = z.infer<typeof createSnapshotParamsSchema>

export const resumeSnapshotParamsSchema = z.object({
  snapshotName: z.string(),
  autoPause: z.boolean().optional(),
  timeoutMin: z.number().int().optional(),
  networkPolicy: networkPolicySchema.optional(),
})
export type ResumeSnapshotParams = z.infer<typeof resumeSnapshotParamsSchema>
