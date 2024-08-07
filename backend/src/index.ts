import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import routes from "./routes";

const server = Fastify({
  logger: true,
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

interface ErrorResponse {
  message: string;
  statusCode: number;
  data?: any;
  stack?: string;
}

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
      data: (error as any).data,
    };
    if (process.env.NODE_ENV !== "production") {
      response.stack = error.stack;
    }
    reply.status(response.statusCode).send(response);
  }
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
