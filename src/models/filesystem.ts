import { z } from "zod"

export const fileInfoSchema = z.object({
  path: z.string(),
  name: z.string().optional(),
  size: z.number().optional(),
  mode: z.number().optional(),
  isDir: z.boolean().optional(),
  modifiedAt: z.string().optional(),
}).catchall(z.unknown())
export type FileInfo = z.infer<typeof fileInfoSchema>

export const lsResultSchema = z.object({
  items: z.array(fileInfoSchema),
})
export type LsResult = z.infer<typeof lsResultSchema>

export const searchMatchSchema = z.object({
  path: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  match: z.string().optional(),
}).catchall(z.unknown())
export type SearchMatch = z.infer<typeof searchMatchSchema>

export const treeEntrySchema: z.ZodType<{
  path: string
  name: string
  type: "file" | "dir"
  children?: Array<{
    path: string
    name: string
    type: "file" | "dir"
    children?: unknown
  }>
}> = z.lazy(() =>
  z.object({
    path: z.string(),
    name: z.string(),
    type: z.enum(["file", "dir"]),
    children: z.array(treeEntrySchema).optional(),
  }),
)
export type TreeEntry = z.infer<typeof treeEntrySchema>

export const treeResultSchema = z.object({
  root: z.string(),
  entries: z.array(treeEntrySchema),
})
export type TreeResult = z.infer<typeof treeResultSchema>

export const fileEditSchema = z.object({
  oldText: z.string(),
  newText: z.string(),
  replaceAll: z.boolean().optional(),
})
export type FileEdit = z.infer<typeof fileEditSchema>

export const editFileResultSchema = z.object({
  path: z.string(),
  changed: z.boolean(),
  content: z.string().optional(),
}).catchall(z.unknown())
export type EditFileResult = z.infer<typeof editFileResultSchema>

export const editResultSchema = z.object({
  results: z.array(editFileResultSchema),
})
export type EditResult = z.infer<typeof editResultSchema>
