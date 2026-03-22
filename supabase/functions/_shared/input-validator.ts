/**
 * Input validation & sanitization utilities for edge functions.
 * Schema-based validation with type checks, length limits, and field rejection.
 */

export type FieldSchema = {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
};

export type SchemaDefinition = Record<string, FieldSchema>;

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  sanitized: Record<string, unknown>;
};

/**
 * Validates and sanitizes input against a schema.
 * - Rejects unexpected fields
 * - Enforces type checks
 * - Applies length limits
 * - Trims strings
 */
export function validateInput(
  input: unknown,
  schema: SchemaDefinition
): ValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, errors: ["Request body must be a JSON object"], sanitized: {} };
  }

  const body = input as Record<string, unknown>;

  // Reject unexpected fields
  const allowedKeys = new Set(Object.keys(schema));
  for (const key of Object.keys(body)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Unexpected field: "${key}"`);
    }
  }

  // Validate each defined field
  for (const [key, rule] of Object.entries(schema)) {
    const value = body[key];

    if (value === undefined || value === null) {
      if (rule.required) {
        errors.push(`"${key}" is required`);
      }
      continue;
    }

    // Type check
    if (rule.type === "string") {
      if (typeof value !== "string") {
        errors.push(`"${key}" must be a string`);
        continue;
      }
      let trimmed = value.trim();
      if (rule.minLength && trimmed.length < rule.minLength) {
        errors.push(`"${key}" must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && trimmed.length > rule.maxLength) {
        trimmed = trimmed.slice(0, rule.maxLength);
      }
      if (rule.pattern && !rule.pattern.test(trimmed)) {
        errors.push(`"${key}" has an invalid format`);
      }
      sanitized[key] = trimmed;
    } else if (rule.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors.push(`"${key}" must be a finite number`);
        continue;
      }
      if (rule.min !== undefined && value < rule.min) errors.push(`"${key}" must be >= ${rule.min}`);
      if (rule.max !== undefined && value > rule.max) errors.push(`"${key}" must be <= ${rule.max}`);
      sanitized[key] = value;
    } else if (rule.type === "boolean") {
      if (typeof value !== "boolean") {
        errors.push(`"${key}" must be a boolean`);
        continue;
      }
      sanitized[key] = value;
    } else if (rule.type === "array") {
      if (!Array.isArray(value)) {
        errors.push(`"${key}" must be an array`);
        continue;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`"${key}" exceeds max length of ${rule.maxLength}`);
        continue;
      }
      sanitized[key] = value;
    } else if (rule.type === "object") {
      if (typeof value !== "object" || Array.isArray(value)) {
        errors.push(`"${key}" must be an object`);
        continue;
      }
      sanitized[key] = value;
    }
  }

  return { valid: errors.length === 0, errors, sanitized };
}

export function validationErrorResponse(
  errors: string[],
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: "Validation failed", details: errors }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
