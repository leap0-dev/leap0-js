import { z } from "zod"

export const ptySessionSchema = z.object({
  id: z.string(),
  cols: z.number().optional(),
  rows: z.number().optional(),
  cwd: z.string().optional(),
}).catchall(z.unknown())
export type PtySession = z.infer<typeof ptySessionSchema>

export const createPtySessionParamsSchema = z.object({
  id: z.string().optional(),
  cols: z.number().optional(),
  rows: z.number().optional(),
  cwd: z.string().optional(),
  command: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
})
export type CreatePtySessionParams = z.infer<typeof createPtySessionParamsSchema>
