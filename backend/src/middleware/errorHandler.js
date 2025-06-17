const errorHandler = (err, req, res, next) => {
    // Log error details for debugging
    console.error('Error:', err);
  
    // Set default error status and message
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';
  
    // Handle specific error types
    if (err.name === 'ValidationError') {
      status = 400;
      message = 'Validation Error';
    } else if (err.name === 'UnauthorizedError') {
      status = 401;
      message = 'Unauthorized';
    } else if (err.name === 'SequelizeValidationError') {
      status = 400;
      message = 'Database Validation Error';
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      status = 409;
      message = 'Duplicate Entry';
    }
  
    // Send error response
    res.status(status).json({
      error: {
        message,
        status,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    });
  };
  
  module.exports = { errorHandler };