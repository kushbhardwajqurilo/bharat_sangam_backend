// global error handler
export const errorHandle = (err, req, res, next) => {
  // default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status ?? false;

  console.log("error", err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

// controller error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // true only for success codes (optional logic, you can tweak)
    this.status = statusCode === 200 || statusCode === 201;

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// async wrapper (avoid try-catch)
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// success response
export const sendSuccess = (
  res,
  message = "success",
  data = {},
  statusCode = 200,
  status = true,
) => {
  return res.status(statusCode).json({
    status,
    message,
    data,
  });
};
