export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];

  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors.length > 0 ? errors : [message];
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
