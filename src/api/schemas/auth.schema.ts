import { t } from "elysia";

/**
 * Successful authentication response with JWT token
 */
export const AuthSuccessSchema = t.Object({
  success: t.Boolean(),
  message: t.String(), // JWT token
});

/**
 * Authentication error response
 */
export const AuthErrorSchema = t.Object({
  success: t.Boolean(),
  message: t.String(), // Error message
});
