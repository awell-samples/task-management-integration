import { Inject, Service } from "typedi";
import { Comment, Ephemeral, Valid } from "../types";
import { PrismaClient } from "@prisma/client";
import { FastifyBaseLogger } from "fastify";

@Service()
export default class CommentService {
  constructor(
    @Inject("prisma") private prisma: PrismaClient,
    @Inject("logger") private logger: FastifyBaseLogger,
  ) {}

  async create(taskId: string, comment: Ephemeral<Comment>) {
    const createdComment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          text: comment.text,
          ...(comment.parent_id && { parent_id: comment.parent_id }),
          ...(comment.status && { status: comment.status }),
          created_at: new Date(),
          updated_at: new Date(),
          created_by_user_id: comment.created_by_user_id,
          updated_by_user_id: comment.created_by_user_id,
        },
      });

      await tx.taskComment.create({
        data: {
          task_id: taskId,
          comment_id: created.id,
        },
      });

      return created;
    });
    return createdComment;
  }

  async findByTaskId(taskId: string) {
    const comments = await this.prisma.taskComment.findMany({
      where: {
        task_id: taskId,
      },
      include: {
        comment: true,
      },
    });
    return comments;
  }

  async findById(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
    });
    this.logger.debug({ msg: "Found comment", data: { id } });
    return comment;
  }

  async findRelatedComments(commentId: string) {
    const comments = await this.prisma.comment.findMany({
      where: {
        OR: [
          {
            id: commentId,
          },
          {
            parent_id: commentId,
          },
        ],
      },
    });
    this.logger.debug({
      msg: "Found related comments",
      data: { commentId, count: comments.length },
    });
    return comments;
  }

  async update(comment: Valid<Partial<Comment>>) {
    const updatedComment = await this.prisma.comment.update({
      where: {
        id: comment.id,
      },
      data: {
        text: comment.text,
        updated_at: new Date(),
        updated_by_user_id: comment.updated_by_user_id,
        status: comment.status || "active",
      },
    });
    this.logger.debug({
      msg: "Updated comment",
      data: { comment: updatedComment },
    });
    return updatedComment;
  }

  async delete(id: string, deleted_by_user_id: string) {
    await this.prisma.comment.update({
      where: {
        id,
      },
      data: {
        deleted_at: new Date(),
        deleted_by_user_id,
      },
    });
    this.logger.debug({ msg: "Deleted comment", data: { id } });
  }
}
