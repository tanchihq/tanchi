import type { Context } from "hono";

const HTTP_STATUS_TEXTS: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
  202: "Accepted",
};

export type ErrorResponse = {
  statusCode: number;
  error: string;
  message: string;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly error: string;

  constructor(statusCode: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.error = HTTP_STATUS_TEXTS[statusCode] ?? "Unknown Error";
  }

  toJSON(): ErrorResponse {
    return {
      statusCode: this.statusCode,
      error: this.error,
      message: this.message,
    };
  }
}

export type HttpErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500;

export const sendError = (
  c: Context,
  statusCode: HttpErrorStatus,
  message: string
) => c.json(new AppError(statusCode, message).toJSON(), statusCode);
