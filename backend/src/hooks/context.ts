import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isNil } from "lodash";

export async function userContextHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const userId = request.headers["x-user-id"] as string;
  this.log.debug({ msg: "user context", userId });
  if (!isNil(userId)) {
    const user = await this.services.user.findById(userId);
    if (!isNil(user)) {
      request.context.user = user;
    }
  }
}
