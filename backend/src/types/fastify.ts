import { AuthenticateTokenResponse } from "stytch";
import { User } from "./user";
import { Services } from "../services";
declare module "fastify" {
  interface FastifyInstance {
    services: Services;
  }
  interface FastifyRequestContext {
    tokenResponse: AuthenticateTokenResponse;
    user: User;
  }
}
