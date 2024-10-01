import * as stytch from "stytch";
import { getEnv } from "../environment";
import { FastifyInstance } from "fastify";

let stytchClient: stytch.Client | null = null;

export const getStytchClient: () => stytch.Client = () => {
  if (!stytchClient) {
    stytchClient = new stytch.Client({
      project_id: getEnv("STYTCH_PROJECT_ID"),
      secret: getEnv("STYTCH_SECRET"),
      //   env: getEnv("AWELL_ENVIRONMENT").match(new RegExp("{sandbox|production}"))
      //     ? "live"
      //     : "test",
    });
  }
  return stytchClient;
};

export default class AuthService {
  fastify: FastifyInstance;
  private logger: FastifyInstance["log"];
  private stytch: FastifyInstance["stytch"];

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.logger = fastify["log"];
    this.stytch = getStytchClient();
  }

  async authenticateMagicLink(token: string) {
    return this.stytch.magicLinks.authenticate({ token });
  }

  async authenticateOAuth(token: string) {
    return this.stytch.oauth.authenticate({ token });
  }
}
