import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isNil } from "lodash";
import { ClientError, Client } from "stytch";
import Container from "typedi";

export async function authHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (
    request.url === "/" ||
    request.url === "/health" ||
    request.url.startsWith("/awell")
  ) {
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
  const stytchClient = Container.get<Client>("stytch");
  try {
    const resp = await stytchClient.m2m.authenticateToken({
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
