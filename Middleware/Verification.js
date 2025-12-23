import jwt from "jsonwebtoken";
export const verification = async function (req, res, next) {
  const t = await req.headers["authorization"];
  let token = null;
  let bearer = null;
  if (t) {
    bearer = await t.split(" ");
    token = bearer[1];
  } else {
    return res.status(404).json({statusCode:404,message:"token not found"});
  }
  if (!token) {
    return res.status(404).json({statusCode:404,message:"token not found"});
  }
  try {
    const res = jwt.verify(token, "WATCHA_GOTCHA_AUTHENTICATION_KEY");
    req.user = res;
    next();
  } catch (err) {
    res.status(400).json({statusCode:400,message:"invalid token"});
  }
};
