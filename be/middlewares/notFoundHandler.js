export const notFoundHandler = (req, res, next) => {
  const error = new Error("Not Found Api");
  error.status = 404;
  next(error);
};

export const genericHandler = (error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    code: error.status || 500,
    data: [],
    message: error.message,
  });
}; 
