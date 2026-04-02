import { Leap0Error } from "@/core/errors.js"

export function asRecord(value: unknown): Record<string, unknown> {
  if ((typeof value === "object" && value !== null) || typeof value === "function") {
    return value as Record<string, unknown>
  }

  return {}
}

export async function withErrorPrefix<T>(prefix: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof Leap0Error) {
      throw new Leap0Error(`${prefix}${error.message}`, {
        statusCode: error.statusCode,
        headers: error.headers,
        body: error.body,
        retryable: error.retryable,
        cause: error,
      })
    }
    throw error
  }
}
