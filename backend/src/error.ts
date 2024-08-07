export class BaseError extends Error {
  data: any = undefined;
  statusCode: number = 500;
  stack?: string;
  constructor(message: string, data?: any, stack?: string) {
    super(message);
    this.name = this.constructor.name;
    this.data = data;
    this.stack = stack;
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = BaseError.name;
  }
}

export class NotFoundError extends BaseError {
  statusCode = 404;
  constructor(message: string, data?: any, stack?: string) {
    super(message, data, stack);
    this.name = NotFoundError.name;
  }
}

export class BadRequestError extends BaseError {
  statusCode = 400;
  constructor(message: string, data?: any, stack?: string) {
    super(message, data, stack);
    this.name = BadRequestError.name;
  }
}
