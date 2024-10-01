import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isNil } from "lodash";
import { getStytchClient } from "../services/auth-service";
import { ClientError } from "stytch";

export async function authHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (request.url === "/" || request.url === "/health") {
    return;
  }

  request.log.debug({
    msg: "request received",
    params: request.params,
    query: request.query,
    body: request.body,
  });
  if (
    isNil(request.headers.authorization) ||
    !request.headers.authorization.startsWith("Bearer ")
  ) {
    return reply.status(401).send({
      message: "Please provide an authorization header with Bearer {token}",
    });
  }
  const accessToken = request.headers.authorization.split(" ")[1];
  try {
    const resp = await getStytchClient().m2m.authenticateToken({
      access_token: accessToken,
    });
    request.context.tokenResponse = resp;
    request.log.debug({
      msg: "authenticated user",
      resp,
    });
  } catch (err) {
    if (err instanceof ClientError) {
      return reply.status(401).send({ message: "Unauthorized" });
    }
    throw err;
  }
}
