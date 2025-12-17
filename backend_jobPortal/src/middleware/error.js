
export const notFound = (req, res, _next) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Centralized error handler
export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Internal Server Error',
  };

  // Include stack only in dev
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};
