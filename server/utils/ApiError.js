export class ApiError extends Error {
  constructor(statusCode, message, error = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.error = error;
    Error.captureStackTrace(this, this.constructor);
  }
}
