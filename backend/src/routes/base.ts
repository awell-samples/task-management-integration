import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function (fastify: FastifyInstance) {
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info({
      msg: "request received",
      params: request.params,
      body: request.body,
    });
    return { message: "Hello, world!" };
  });

  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info({
      msg: "request received",
      params: request.params,
      body: request.body,
    });
    return { message: "Hello, world!" };
  });
}
