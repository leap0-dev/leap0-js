import { z } from "zod"

export const leap0ConfigInputSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  sandboxDomain: z.string().optional(),
  timeout: z.number().positive().optional(),
  authHeader: z.string().optional(),
  bearer: z.boolean().optional(),
  sdkOtelEnabled: z.boolean().optional(),
})
export type Leap0ConfigInput = z.infer<typeof leap0ConfigInputSchema>

export const leap0ConfigResolvedSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string(),
  sandboxDomain: z.string(),
  timeout: z.number().positive(),
  authHeader: z.string(),
  bearer: z.boolean(),
  sdkOtelEnabled: z.boolean(),
})
export type Leap0ConfigResolved = z.infer<typeof leap0ConfigResolvedSchema>
