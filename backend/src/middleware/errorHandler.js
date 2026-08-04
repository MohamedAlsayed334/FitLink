import config from "../config/env.js";

export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = "Server Error";
  let errors;

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err.statusCode && err.statusCode >= 400 && err.statusCode < 600) {
    statusCode = err.statusCode;
    message = err.message || message;
  } else if (err.message) {
    message = err.message;
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  res.status(statusCode).json(response);
}

export default errorHandler;
