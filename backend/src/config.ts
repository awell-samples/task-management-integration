import { Static, Type } from "@sinclair/typebox";

export const schema = {
  type: "object",
  required: ["PORT", "DATABASE_URL", "AWELL_ENVIRONMENT", "AWELL_API_KEY"],
  properties: {
    PORT: {
      type: "string",
      default: "3000",
    },
    DATABASE_URL: {
      type: "string",
    },
    AWELL_ENVIRONMENT: {
      type: "string",
      default: "sandbox",
    },
    AWELL_API_KEY: {
      type: "string",
    },
  },
};

export const configSchema = Type.Object({
  PORT: Type.String(),
  DATABASE_URL: Type.String(),
  AWELL_ENVIRONMENT: Type.String(),
  AWELL_API_KEY: Type.String(),
});

export type ConfigSchema = Static<typeof configSchema>;

declare module "fastify" {
  interface FastifyInstance {
    config: ConfigSchema;
  }
}
