import * as stytch from "stytch";
import { Inject, Service } from "typedi";

@Service()
export default class AuthService {
  constructor(@Inject("stytch") private stytch: stytch.Client) {}

  async authenticateMagicLink(token: string) {
    return this.stytch.magicLinks.authenticate({ token });
  }

  async authenticateOAuth(token: string) {
    return this.stytch.oauth.authenticate({ token });
  }
}
