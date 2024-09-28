import { BadRequestError, NotFoundError } from "../error";
import { Comment, Ephemeral } from "../types";
import { FastifyInstance } from "fastify";
import { Prisma, PrismaClient } from "@prisma/client";

export default class CommentService {
  private _pg: FastifyInstance["pg"];
  private logger: FastifyInstance["log"];
  private prisma: FastifyInstance["prisma"];

  constructor(fastify: FastifyInstance) {
    this._pg = fastify.pg;
    this.logger = fastify.log;
    this.prisma = fastify.prisma;
  }

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
    const { rows } = await this._pg.query(
      "SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL LIMIT 1",
      [id],
    );
    this.logger.debug({ msg: "Found comment", data: { id } });
    if (rows.length === 0) {
      throw new NotFoundError("Comment not found", { id });
    }
    return rows[0];
  }

  async findByCommentId(commentId: string) {
    const { rows } = await this._pg.query(
      `SELECT c.*
       FROM comments c
       WHERE (c.id = $1 OR c.parent_id = $1) AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
      [commentId],
    );
    this.logger.debug({
      msg: "Returning comments for comment",
      data: { commentId, count: rows.length },
    });
    return rows;
  }

  async update(comment: Partial<Comment>) {
    const currentComment = await this.findById(comment.id!);
    if (!currentComment) {
      throw new NotFoundError("Comment not found", { id: comment.id });
    }

    const { rows } = await this._pg.query(
      `UPDATE comments SET 
        text = $1, updated_by_user_id = $2, updated_at = NOW(), status = $3
        WHERE id = $4 AND deleted_at IS NULL RETURNING *`,
      [
        comment.text,
        comment.updated_by_user_id,
        comment.status || "active",
        comment.id,
      ],
    );

    if (rows.length === 0) {
      throw new NotFoundError("Comment not found", { id: comment.id });
    }
    this.logger.debug({ msg: "Updated comment", data: { comment: rows[0] } });
    return rows[0];
  }

  async delete(id: string, deleted_by_user_id: string) {
    const { rowCount } = await this._pg.query(
      "UPDATE comments SET deleted_at = NOW(), deleted_by_user_id = $2 WHERE id = $1",
      [id, deleted_by_user_id],
    );
    if (rowCount === 0) {
      throw new NotFoundError("Comment not found", { id });
    }
    this.logger.debug({ msg: "Deleted comment", data: { id } });
  }

  async deleteByTaskId(taskId: string) {
    try {
      await this._pg.query("BEGIN");

      await this._pg.query("DELETE FROM tasks_comments WHERE task_id = $1", [
        taskId,
      ]);
      this.logger.debug({
        msg: "Deleted comments for task",
        data: { task_id: taskId },
      });

      const { rowCount } = await this._pg.query(
        "UPDATE comments SET deleted_at = NOW() WHERE id IN (SELECT comment_id FROM tasks_comments WHERE task_id = $1)",
        [taskId],
      );
      this.logger.debug({
        msg: "Deleted comments",
        data: { count: rowCount },
      });

      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
    } catch (err) {
      await this._pg.query("ROLLBACK");
      throw err;
    }
  }

  async associateTask(taskId: string, commentId: string) {
    try {
      await this._pg.query("BEGIN");

      await this._pg.query(
        `INSERT INTO tasks_comments (task_id, comment_id) VALUES ($1, $2)`,
        [taskId, commentId],
      );
      this.logger.debug({
        msg: "Associated task with comment",
        data: { taskId, commentId },
      });

      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
    } catch (err) {
      await this._pg.query("ROLLBACK");
      throw err;
    }
  }

  async disassociateTask(taskId: string, commentId: string) {
    try {
      await this._pg.query("BEGIN");

      const { rowCount } = await this._pg.query(
        `DELETE FROM tasks_comments WHERE task_id = $1 AND comment_id = $2`,
        [taskId, commentId],
      );
      this.logger.debug({
        msg: "Disassociated task from comment",
        data: { taskId, commentId },
      });

      if (rowCount === 0) {
        throw new NotFoundError("Association not found", {
          taskId,
          commentId,
        });
      }

      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
    } catch (err) {
      await this._pg.query("ROLLBACK");
      throw err;
    }
  }
}
