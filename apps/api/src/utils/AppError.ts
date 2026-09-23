export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  /** Optional structured payload (e.g. duplicate-check candidates) carried through to the error response's `data`. */
  public readonly data?: unknown;

  constructor(statusCode: number, message: string, errors: string[] = [], data?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors.length > 0 ? errors : [message];
    this.data = data;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
