import { FastifyInstance } from "fastify";
import CommentService from "../services/comment-service";
import { Comment, Ephemeral } from "../types";

export default async function (fastify: FastifyInstance) {
  const commentService = new CommentService(fastify);
  fastify.post<{ Body: Comment; Params: { taskId: string } }>(
    "/tasks/:taskId/comments",
    async (request, reply) => {
      const commentToCreate: Ephemeral<Comment> = request.body;
      const taskId = request.params.taskId;
      const comment = await commentService.create(taskId, commentToCreate);
      return reply.send(comment);
    },
  );

  fastify.get<{ Params: { taskId: string } }>(
    "/tasks/:taskId/comments",
    async (request, reply) => {
      const taskId = request.params.taskId;
      const comments = await commentService.findByTaskId(taskId);
      return reply.send(comments);
    },
  );
}
