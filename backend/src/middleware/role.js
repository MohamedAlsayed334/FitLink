export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      return next(err);
    }
    if (!roles.includes(req.user.role)) {
      const err = new Error(
        `Access denied: requires role ${roles.join(" or ")}`,
      );
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
};

export default requireRole;
