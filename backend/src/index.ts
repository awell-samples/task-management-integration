import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyPostgres from "@fastify/postgres";
import fastifyEnv from "@fastify/env";
import routes from "./routes";
import { ErrorResponse } from "./error";
import { configSchema } from "./config";

const server = Fastify({
  logger: true,
});
server.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL,
});

void server.register(fastifyEnv, {
  confKey: "config",
  schema: configSchema,
  dotenv: true,
});

routes.forEach((route) => server.register(route));

server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
  console.log({
    msg: "request received",
    params: request.params,
    body: request.body,
  });
  return { message: "Hello, world!" };
});

server.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
  console.log({
    msg: "request received",
    params: request.params,
    body: request.body,
  });
  return { message: "Hello, world!" };
});

server.setErrorHandler((error, request, reply) => {
  server.log.error(error);
  if (error.validation) {
    const response: ErrorResponse = {
      message: "Validation error",
      statusCode: 400,
      data: error.validation,
    };
    reply.status(response.statusCode).send(response);
  } else {
    const response: ErrorResponse = {
      message: error.message,
      statusCode: error.statusCode || 500,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (error as any).data,
    };
    if (process.env.NODE_ENV !== "production") {
      response.stack = error.stack;
    }
    reply.status(response.statusCode).send(response);
  }
});

const start = async () => {
  const port = Number(process.env.PORT || 3000);
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
