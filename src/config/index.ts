import {
  DEFAULT_BASE_URL,
  DEFAULT_CLIENT_TIMEOUT,
  DEFAULT_SANDBOX_DOMAIN,
} from "@/config/constants.js";
import {
  apiKeyRequiredSchema,
  authHeaderSchema,
  leap0ConfigInputSchema,
  leap0ConfigResolvedSchema,
  timeoutSchema,
} from "@/models/config.js";
import type { Leap0ConfigInput, Leap0ConfigResolved } from "@/models/config.js";
import { trimSlash } from "@/core/utils.js";

function readEnv(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  return undefined;
}

function resolveSdkOtelFromEnv(envOtel: string | undefined): boolean {
  if (envOtel === "true") {
    return true;
  }
  if (envOtel === "false") {
    return false;
  }
  return Boolean(readEnv("OTEL_EXPORTER_OTLP_ENDPOINT"));
}

/**
 * Resolves SDK configuration from explicit input and environment variables.
 *
 * Args:
 *   input: Partial client configuration overrides.
 *
 * Returns:
 *   The validated runtime configuration used by the SDK.
 */
export function resolveConfig(input: Leap0ConfigInput = {}): Leap0ConfigResolved {
  leap0ConfigInputSchema.parse(input);

  const apiKey = apiKeyRequiredSchema.parse(input.apiKey ?? readEnv("LEAP0_API_KEY"));
  const baseUrl = trimSlash(
    (input.baseUrl ?? readEnv("LEAP0_BASE_URL") ?? DEFAULT_BASE_URL).trim(),
  );
  const sandboxDomain = trimSlash(
    (input.sandboxDomain ?? readEnv("LEAP0_SANDBOX_DOMAIN") ?? DEFAULT_SANDBOX_DOMAIN).trim(),
  );
  const timeout = timeoutSchema.parse(input.timeout ?? DEFAULT_CLIENT_TIMEOUT);
  const authHeader = authHeaderSchema.parse(input.authHeader ?? "authorization");
  const bearer = input.bearer ?? true;
  const envOtel = readEnv("LEAP0_SDK_OTEL_ENABLED");
  const sdkOtelEnabled = input.sdkOtelEnabled ?? resolveSdkOtelFromEnv(envOtel);

  return leap0ConfigResolvedSchema.parse({
    apiKey,
    baseUrl,
    sandboxDomain,
    timeout,
    authHeader,
    bearer,
    sdkOtelEnabled,
  });
}
