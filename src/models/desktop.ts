import { z } from "zod"

export const desktopDisplayInfoSchema = z.object({
  width: z.number(),
  height: z.number(),
  scale: z.number().optional(),
}).catchall(z.unknown())
export type DesktopDisplayInfo = z.infer<typeof desktopDisplayInfoSchema>

export const desktopPointerPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
}).catchall(z.unknown())
export type DesktopPointerPosition = z.infer<typeof desktopPointerPositionSchema>

export const desktopSetScreenParamsSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  scale: z.number().optional(),
}).catchall(z.unknown())
export type DesktopSetScreenParams = z.infer<typeof desktopSetScreenParamsSchema>

export const desktopScreenshotRegionParamsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
}).catchall(z.unknown())
export type DesktopScreenshotRegionParams = z.infer<typeof desktopScreenshotRegionParamsSchema>

export const desktopDragParamsSchema = z.object({
  startX: z.number().optional(),
  startY: z.number().optional(),
  endX: z.number().optional(),
  endY: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  button: z.number().optional(),
}).catchall(z.unknown())
export type DesktopDragParams = z.infer<typeof desktopDragParamsSchema>

export const desktopScrollParamsSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  deltaX: z.number().optional(),
  deltaY: z.number().optional(),
}).catchall(z.unknown())
export type DesktopScrollParams = z.infer<typeof desktopScrollParamsSchema>

export const desktopWindowSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
}).catchall(z.unknown())
export type DesktopWindow = z.infer<typeof desktopWindowSchema>

export const desktopHealthSchema = z.object({
  ok: z.boolean(),
}).catchall(z.unknown())
export type DesktopHealth = z.infer<typeof desktopHealthSchema>

export const desktopRecordingSummarySchema = z.object({
  id: z.string(),
}).catchall(z.unknown())
export type DesktopRecordingSummary = z.infer<typeof desktopRecordingSummarySchema>

export const desktopRecordingStatusSchema = z.object({
  active: z.boolean(),
}).catchall(z.unknown())
export type DesktopRecordingStatus = z.infer<typeof desktopRecordingStatusSchema>

export const desktopProcessStatusSchema = z.object({
  name: z.string().optional(),
  status: z.string().optional(),
}).catchall(z.unknown())
export type DesktopProcessStatus = z.infer<typeof desktopProcessStatusSchema>

export const desktopProcessStatusListSchema = z.object({
  processes: z.array(desktopProcessStatusSchema),
})
export type DesktopProcessStatusList = z.infer<typeof desktopProcessStatusListSchema>

export const desktopStatusStreamEventSchema = z.object({
  status: z.string().optional(),
  error: z.string().optional(),
}).catchall(z.unknown())
export type DesktopStatusStreamEvent = z.infer<typeof desktopStatusStreamEventSchema>

export const desktopProcessLogsSchema = z.object({
  logs: z.string(),
})
export type DesktopProcessLogs = z.infer<typeof desktopProcessLogsSchema>

export const desktopProcessErrorsSchema = z.object({
  errors: z.string(),
})
export type DesktopProcessErrors = z.infer<typeof desktopProcessErrorsSchema>

export const desktopProcessRestartSchema = z.object({
  success: z.boolean(),
}).catchall(z.unknown())
export type DesktopProcessRestart = z.infer<typeof desktopProcessRestartSchema>
