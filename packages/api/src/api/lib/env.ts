/**
 * Read a required environment variable, throwing if it's unset or empty.
 * Use at module-load or first-call sites to keep config failures loud.
 */
export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};
