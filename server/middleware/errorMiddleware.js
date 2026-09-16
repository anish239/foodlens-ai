export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails = err.error || null;

  // Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id of ${err.value}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = Object.values(err.errors).map((val) => val.message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
    errorDetails = err.keyValue;
  }

  const response = {
    success: false,
    message,
    ...(errorDetails && { error: errorDetails }),
    ...(req.id && { requestId: req.id }),
    ...(process.env.NODE_ENV === 'development' && !errorDetails && {
      error: err.stack,
    }),
  };

  res.status(statusCode).json(response);
};
