import jwt from "jsonwebtoken";
const SECRET_KEY = "jknfcisc32879bnda87213n1328723g43576dvu28632ugi";

function Authorization(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({
      message: "No Authorization Header",
    });
  }
  try {
    const token = authorization.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Invalid Token Format",
      });
    }
    const decode = jwt.verify(token, SECRET_KEY);
    req.userId = decode;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Session Expired",
        error: error.message,
      });
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof TokenError) {
      return res.status(401).json({
        message: "Invalid Token",
        error: error.message,
      });
    }
    res.status(500).json({
      message: "Internal server Error",
      error: error.message,
      stack: error.stack,
    });
  }
}

export default Authorization;
