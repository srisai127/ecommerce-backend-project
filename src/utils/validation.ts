import { ApiError } from "./errors";

export function requireString(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${field} is required and must be a string.`);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new ApiError(400, `${field} must be ${maxLength} characters or fewer.`);
  }
  return result;
}

export function requirePositiveInteger(value: unknown, field: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
    throw new ApiError(400, `${field} must be a positive integer.`);
  }
  return numberValue;
}

export function requireNonNegativeInteger(value: unknown, field: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    throw new ApiError(400, `${field} must be a non-negative integer.`);
  }
  return numberValue;
}

export function optionalString(value: unknown, field: string, maxLength = 1000): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new ApiError(400, `${field} must be a string of ${maxLength} characters or fewer.`);
  }
  return value.trim();
}

export function parseId(value: string, field = "id"): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${field} must be a positive integer.`);
  }
  return parsed;
}
