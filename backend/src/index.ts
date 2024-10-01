import "./types/fastify";
import Fastify from "fastify";
import fastifyPostgres from "@fastify/postgres";
import fastifyEnv from "@fastify/env";
import routes from "./routes";
import { prismaPlugin, servicesPlugin } from "./plugins";
import { configSchema } from "./config";
import { errorHandler, authHandler, userContextHandler } from "./hooks";

const server = Fastify({
  logger: {
    level: "debug",
    transport: {
      target: "pino-pretty",
    },
  },
});

server.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL,
});
void server.register(fastifyEnv, {
  confKey: "config",
  schema: configSchema,
  dotenv: true,
});
void server.register(prismaPlugin);
void server.register(servicesPlugin);
server.setErrorHandler(errorHandler);
server.addHook("onRequest", userContextHandler);
server.addHook("onRequest", authHandler);

routes.forEach((route) => server.register(route));

const start = async () => {
  const port = Number(process.env.PORT || 3001);
  try {
    await server.listen({
      port,
      host: "0.0.0.0",
    });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
