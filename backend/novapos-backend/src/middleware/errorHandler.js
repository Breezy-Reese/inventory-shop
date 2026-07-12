export function notFoundHandler(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors)[0]?.message ?? "Invalid data" });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? { field: 1 })[0];
    return res.status(409).json({ message: `That ${field} is already in use` });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id" });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Something went wrong" });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
