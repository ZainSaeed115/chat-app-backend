import jwt from "jsonwebtoken"

const verifyTokens=(req,res,next)=>{
  try {

    const token=req.cookies.token

    if(!token)
    return res.status(401).json({message:"No token, authorization denied"});

    const decoded=jwt.verify(token,process.env.ACCESS_TOKENS_SECRET_KEY);

    if(!decoded) return res.status(401).json({message:"Unauthorized - invalid token",success:false})
    req.userId=decoded.userId;
    next();
    
    
  } catch (error) {
    console.log("UnAuthenticated Tokens:",error)
    return res.status(500).json({message:"Internal Server Error",success:false})
  }
}

export{
    verifyTokens
}