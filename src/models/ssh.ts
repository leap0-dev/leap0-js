import { z } from "zod"

export const sshAccessSchema = z.object({
  id: z.string(),
  hostname: z.string(),
  port: z.number(),
  username: z.string(),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
}).catchall(z.unknown())
export type SshAccess = z.infer<typeof sshAccessSchema>

export const sshValidationSchema = z.object({
  valid: z.boolean(),
}).catchall(z.unknown())
export type SshValidation = z.infer<typeof sshValidationSchema>
