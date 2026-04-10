const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message;

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
