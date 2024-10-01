import { PrismaClient } from "@prisma/client";
import { Client, AuthenticateTokenResponse } from "stytch";
import { User } from "./user";
import { Services } from "../services";
declare module "fastify" {
  interface FastifyInstance {
    stytch: Client;
    prisma: PrismaClient;
    services: Services;
  }
  interface FastifyRequestContext {
    tokenResponse: AuthenticateTokenResponse;
    user: User;
  }
}
