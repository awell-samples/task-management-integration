import { BadRequestError, NotFoundError } from "../error";
import { User } from "../types";
import { FastifyInstance } from "fastify";

export default class UserService {
  private _pg: FastifyInstance["pg"];
  private logger: FastifyInstance["log"];

  constructor(fastify: FastifyInstance) {
    this._pg = fastify.pg;
    this.logger = fastify.log;
  }

  async create(user: User) {
    try {
      const { rows } = await this._pg.query(
        `INSERT INTO users (id, first_name, last_name, email, created_at, updated_at) 
         VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW()) 
         RETURNING *`,
        [user.first_name, user.last_name, user.email],
      );
      this.logger.debug("Created user", { user: rows[0] });
      return rows[0];
    } catch (err) {
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { user }, error.stack);
    }
  }

  async findAll() {
    const { rows } = await this._pg.query(
      "SELECT * FROM users ORDER BY created_at DESC",
    );
    this.logger.debug("Returning users", { count: rows.length });
    return rows;
  }

  async findById(id: string) {
    const { rows } = await this._pg.query(
      "SELECT * FROM users WHERE id = $1 LIMIT 1",
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundError("User not found", { id });
    }
    this.logger.debug("Returning user", { user: rows[0] });
    return rows[0];
  }

  async findByEmail(email: string) {
    const { rows } = await this._pg.query(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    if (rows.length === 0) {
      throw new NotFoundError("User not found", { email });
    }
    this.logger.debug("Returning user", { user: rows[0] });
    return rows[0];
  }

  async update(user: Partial<User>) {
    const currentUser = await this.findById(user.id!);
    if (!currentUser) {
      throw new NotFoundError("User not found", { id: user.id });
    }

    const { rows } = await this._pg.query(
      `UPDATE users SET 
        first_name = $1, last_name = $2, email = $3, updated_at = NOW() 
        WHERE id = $4 RETURNING *`,
      [user.first_name, user.last_name, user.email, user.id],
    );

    if (rows.length === 0) {
      throw new NotFoundError("User not found", { id: user.id });
    }
    this.logger.debug("Updated user", { user: rows[0] });
    return rows[0];
  }

  async delete(id: string) {
    const { rowCount } = await this._pg.query(
      "DELETE FROM users WHERE id = $1",
      [id],
    );
    if (rowCount === 0) {
      throw new NotFoundError("User not found", { id });
    }
    this.logger.debug("Deleted user", { id });
  }

  async getUsersByEmailDomain(domain: string) {
    try {
      const { rows } = await this._pg.query(
        `SELECT * FROM users WHERE email LIKE $1`,
        [`%@${domain}`],
      );
      this.logger.debug("Returning users", { count: rows.length });
      return rows;
    } catch (err) {
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { domain }, error.stack);
    }
  }
}
