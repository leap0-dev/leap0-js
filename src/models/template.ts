import { z } from "zod"

export const RegistryCredentialType = {
  BASIC: "basic",
  AWS: "aws",
  GCP: "gcp",
  AZURE: "azure",
} as const

export const templateDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  uri: z.string().optional(),
  createdAt: z.string().optional(),
}).catchall(z.unknown())
export type TemplateData = z.infer<typeof templateDataSchema>

export const registryCredentialTypeSchema = z.enum([
  RegistryCredentialType.BASIC,
  RegistryCredentialType.AWS,
  RegistryCredentialType.GCP,
  RegistryCredentialType.AZURE,
])
export type RegistryCredentialType = z.infer<typeof registryCredentialTypeSchema>

export const basicRegistryCredentialsSchema = z.object({
  type: z.literal(RegistryCredentialType.BASIC),
  username: z.string(),
  password: z.string(),
})

export const awsRegistryCredentialsSchema = z.object({
  type: z.literal(RegistryCredentialType.AWS),
  aws_access_key_id: z.string(),
  aws_secret_access_key: z.string(),
  aws_region: z.string().optional(),
})

export const gcpRegistryCredentialsSchema = z.object({
  type: z.literal(RegistryCredentialType.GCP),
  gcp_service_account_json: z.string(),
})

export const azureRegistryCredentialsSchema = z.object({
  type: z.literal(RegistryCredentialType.AZURE),
  azure_client_id: z.string(),
  azure_client_secret: z.string(),
  azure_tenant_id: z.string(),
})

export const registryCredentialsSchema = z.discriminatedUnion("type", [
  basicRegistryCredentialsSchema,
  awsRegistryCredentialsSchema,
  gcpRegistryCredentialsSchema,
  azureRegistryCredentialsSchema,
])

export type BasicRegistryCredentials = z.infer<typeof basicRegistryCredentialsSchema>
export type AwsRegistryCredentials = z.infer<typeof awsRegistryCredentialsSchema>
export type GcpRegistryCredentials = z.infer<typeof gcpRegistryCredentialsSchema>
export type AzureRegistryCredentials = z.infer<typeof azureRegistryCredentialsSchema>
export type RegistryCredentials = z.infer<typeof registryCredentialsSchema>

export const createTemplateParamsSchema = z.object({
  name: z.string(),
  uri: z.string(),
  credentials: registryCredentialsSchema.optional(),
})
export type CreateTemplateParams = z.infer<typeof createTemplateParamsSchema>

export const renameTemplateParamsSchema = z.object({
  name: z.string(),
})
export type RenameTemplateParams = z.infer<typeof renameTemplateParamsSchema>
