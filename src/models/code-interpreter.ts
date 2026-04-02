import { z } from "zod"

export const CodeLanguage = {
  PYTHON: "python",
  TYPESCRIPT: "typescript",
} as const

export const StreamEventType = {
  STDOUT: "stdout",
  STDERR: "stderr",
  EXIT: "exit",
  ERROR: "error",
} as const

export const codeLanguageSchema = z.enum([CodeLanguage.PYTHON, CodeLanguage.TYPESCRIPT])
export type CodeLanguage = z.infer<typeof codeLanguageSchema>

export const streamEventTypeSchema = z.enum([
  StreamEventType.STDOUT,
  StreamEventType.STDERR,
  StreamEventType.EXIT,
  StreamEventType.ERROR,
])
export type StreamEventType = z.infer<typeof streamEventTypeSchema>

export const codeContextSchema = z.object({
  id: z.string(),
  language: z.union([codeLanguageSchema, z.string()]).optional(),
  createdAt: z.string().optional(),
}).catchall(z.unknown())
export type CodeContext = z.infer<typeof codeContextSchema>

export const codeExecutionOutputSchema = z.object({
  type: z.string().optional(),
  text: z.string().optional(),
  data: z.unknown().optional(),
  mimeType: z.string().optional(),
}).catchall(z.unknown())
export type CodeExecutionOutput = z.infer<typeof codeExecutionOutputSchema>

export const codeExecutionErrorSchema = z.object({
  message: z.string(),
  traceback: z.string().optional(),
}).catchall(z.unknown())
export type CodeExecutionError = z.infer<typeof codeExecutionErrorSchema>

export const executionLogsSchema = z.object({
  stdout: z.string().optional(),
  stderr: z.string().optional(),
})
export type ExecutionLogs = z.infer<typeof executionLogsSchema>

export const codeExecutionResultSchema = z.object({
  contextId: z.string().optional(),
  outputs: z.array(codeExecutionOutputSchema).optional(),
  error: codeExecutionErrorSchema.nullable().optional(),
  logs: executionLogsSchema.optional(),
}).catchall(z.unknown())
export type CodeExecutionResult = z.infer<typeof codeExecutionResultSchema>

export const streamEventSchema = z.object({
  type: streamEventTypeSchema,
  data: z.unknown(),
})
export type StreamEvent = z.infer<typeof streamEventSchema>
