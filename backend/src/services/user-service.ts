import { isNil } from "lodash";
import { BadRequestError, NotFoundError } from "../error";
import { User } from "../types";
import { FastifyBaseLogger } from "fastify";
import { Inject, Service } from "typedi";
import { PrismaClient } from "@prisma/client";

@Service()
export default class UserService {
  constructor(
    @Inject("prisma") private prisma: PrismaClient,
    @Inject("logger") private logger: FastifyBaseLogger,
  ) {}

  async create(user: User) {
    this.logger.debug({ msg: "Creating user", data: { user } });
    const resp = await this.prisma.user.create({
      data: user,
    });
    this.logger.debug({ msg: "Created user", data: { user: resp } });
    return resp;
  }

  async findAll() {
    const resp = await this.prisma.user.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
    this.logger.debug({
      msg: "find all",
      data: {
        users: resp,
      },
    });
    return resp;
  }

  async findById(id: string) {
    const resp = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    this.logger.debug({
      msg: "find by id",
      data: {
        id,
        user: resp,
      },
    });
    if (isNil(resp)) {
      throw new NotFoundError("User not found", { id });
    }
    return resp;
  }

  async findByEmail(email: string) {
    this.logger.debug({ msg: "Finding user", data: { email } });
    if (!email) {
      throw new BadRequestError("Email is required", { email });
    }
    const resp = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (isNil(resp)) {
      throw new NotFoundError("User not found", { email });
    }
    this.logger.debug({
      msg: "Found user",
      data: {
        email,
        user: resp,
      },
    });
    return resp;
  }

  async update(user: Partial<User>) {
    const currentUser = await this.findById(user.id!);
    if (!currentUser) {
      throw new NotFoundError("User not found", { id: user.id });
    }
    const resp = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: user,
    });
    this.logger.debug({ msg: "Updated user", data: { user: resp } });
    return resp;
  }

  async delete(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError("User not found", { id });
    }
    await this.prisma.user.delete({
      where: {
        id,
      },
    });
    this.logger.debug({ msg: "Deleted user", data: { id } });
  }

  async getUsersByEmailDomain(domain: string) {
    if (!domain) {
      throw new BadRequestError("Domain is required", { domain });
    }
    this.logger.debug({ msg: "Finding users", data: { domain } });
    const users = await this.prisma.user.findMany({
      where: {
        email: {
          endsWith: `@${domain}`,
        },
      },
    });
    this.logger.debug({
      msg: "Returning users",
      data: { count: users.length },
    });
    return users;
  }
}
