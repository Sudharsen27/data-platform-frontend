/** Shared client + middleware auth identifiers (no React imports). */
export const TOKEN_KEY = "mdm_auth_token";
/** Non-httpOnly flag so Edge middleware can gate routes; real auth is the JWT in localStorage. */
export const SESSION_PRESENCE_COOKIE = "mdm_auth_session";
export const SESSION_PRESENCE_MAX_AGE = 60 * 60; // seconds; align with default JWT lifetime
