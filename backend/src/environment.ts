export type EnvironmentVariables = {
  PORT: string;
  DATABASE_URL: string;
  AWELL_API_KEY: string;
  AWELL_ENVIRONMENT: string;
  STYTCH_PROJECT_ID: string;
  STYTCH_SECRET: string;
  SESSION_SECRET: string;
  LOG_LEVEL: string;
  PRETTY_LOGS: string;
};

export function getEnv<T extends keyof EnvironmentVariables>(
  key: T,
  defaultValue?: string,
): EnvironmentVariables[T] {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue ?? "";
  }
  return value as EnvironmentVariables[T];
}
