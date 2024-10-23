import { FastifyInstance } from "fastify";
import { User } from "../types";
import _ from "lodash";

export default async function userRoutes(fastify: FastifyInstance) {
  // Create a new user
  fastify.post<{ Body: User }>("/users", async (request, reply) => {
    const user = await fastify.services.user.create(request.body);
    reply.status(201).send(user);
  });

  // Get all users
  fastify.get("/users", async (request, reply) => {
    const users = await fastify.services.user.findAll();
    reply.send(users);
  });

  // Get all users
  fastify.get<{ Querystring: { email: string } }>(
    "/users/find",
    async (request, reply) => {
      const user = await fastify.services.user.findByEmail(request.query.email);
      return reply.send(user);
    },
  );

  fastify.get<{ Querystring: { domain?: string } }>(
    "/users/search",
    async (request, reply) => {
      switch (true) {
        case !_.isNil(request.query.domain): {
          const user = await fastify.services.user.getUsersByEmailDomain(
            request.query.domain,
          );
          return reply.send(user);
        }
        default: {
          throw new Error("Invalid query params. Please search by domain");
        }
      }
    },
  );

  // Get a user by ID
  fastify.get<{ Params: { id: string } }>(
    "/users/:id",
    async (request, reply) => {
      const user = await fastify.services.user.findById(request.params.id);
      reply.send(user);
    },
  );

  // Update a user by ID
  fastify.put<{ Params: { id: string }; Body: Partial<User> }>(
    "/users/:id",
    async (request, reply) => {
      const user = await fastify.services.user.update({
        id: request.params.id,
        ...request.body,
      });
      reply.send(user);
    },
  );

  // Delete a user by ID
  fastify.delete<{ Params: { id: string } }>(
    "/users/:id",
    async (request, reply) => {
      await fastify.services.user.delete(request.params.id);
      reply.status(204).send();
    },
  );
}
