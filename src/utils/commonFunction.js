
import jwt from "jsonwebtoken"
import Account from "../models/user/account.model.js"
export const generateAccessTokensAndSaveInCookies=(res,userId)=>{
   
    try {
        const token= jwt.sign(
            {
            userId:userId
            },
            process.env.ACCESS_TOKENS_SECRET_KEY,
            {
                expiresIn: "48h"
            }
           )
    
           res.cookie(
            "token",token,
            {
                httpOnly:true,
                secure:process.env.NODE_ENV=="Production",
                samesite:"strict",
                maxAge:2*24*60*60*1000
            }
        )
      return token;     
    } catch (error) {
        console.log("Tokens Error:",error)
    }

}

export const generateVerificationToken=()=>{
    return Math.floor(100000+Math.random()*900000).toString();
}
export const generateUniqueUsername = async (baseUsername, session) => {
    let uniqueUsername = baseUsername.toLowerCase(); // Convert to lowercase
    let isUnique = false;
    let attempt = 0;
  
    while (!isUnique) {
      // Check if the username already exists (case insensitive)
      const existingAccount = await Account.findOne({
        username: { $regex: new RegExp(`^${uniqueUsername}$`, "i") },
      }).session(session);
  
      if (!existingAccount) {
        isUnique = true; // Username is unique
      } else {
        // Append a random number to the username
        attempt++;
        uniqueUsername = `${baseUsername.toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      }
  
      // Prevent infinite loops
      if (attempt > 10) {
        throw new Error("Failed to generate a unique username after multiple attempts");
      }
    }
  
    return uniqueUsername;
  };

export const emitEvent=(req,event,users,data)=>{
 console.log("Emitting event:",event);
}

