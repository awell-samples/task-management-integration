import {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { ErrorResponse } from "../error";

export function errorHandler(
  this: FastifyInstance,
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  this.log.error(error);
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
}
