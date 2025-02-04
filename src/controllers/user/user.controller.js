import User from "../../models/user/user.model.js";
import Account from "../../models/user/account.model.js";
import Chat from "../../models/chat/chat.model.js";
import FriendRequest from "../../models/request/friendRequest.model.js"
import bcrypt from "bcrypt";
import crypto from "crypto"
import mongoose from "mongoose";
import { 
  generateAccessTokensAndSaveInCookies,
  generateUniqueUsername,
  generateVerificationToken,

  
 } from "../../utils/commonFunction.js";
import {UploadFileOnCloudinary} from "../../utils/cloudinary.js"
import {
  sendVerificationEmail,
   sendWelcomeEmail,
   sendResetPasswordRequestEmail,
   sendResetPasswordSuccessEmail
  } from "../../nodeMailer/email.js"


const registerUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fName, lName, gender, phone, username, email, password, Bio } = req.body;

   
    if (!fName || !lName || !username || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: false,
        message: "Please fill all the required fields",
      });
    }


    
    const findUser = await Account.findOne({ email }).session(session);
    if (findUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: false,
        message: "Email already exists",
      });
    }

    const uniqueUsername = await generateUniqueUsername(username, session);
   
    const user = new User({
      fName,
      lName,
      gender,
      phone: phone || "", 
    });

    await user.save({ session });

   
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken=generateVerificationToken()
 
    const account = new Account({
      username:uniqueUsername,
      email,
      password: hashedPassword,
      Bio: Bio || "", 
      status: "Active",
      user: user._id,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    await account.save({ session });

   
    await session.commitTransaction();
    session.endSession();

   
    const token = await generateAccessTokensAndSaveInCookies(res, account._id);
    await sendVerificationEmail(account?.email,verificationToken)
    return res.status(201).json({
      status: true,
      message: "User account created successfully",
      data: {
        ...account.toObject(),
        password: undefined,
      },
      token,
    });
  } catch (error) {
   
    await session.abortTransaction();
    session.endSession();

    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const verifyEmail=async(req,res)=>{
 try {
  const {code}=req.body;
  
      const account= await Account.findOne({
        verificationToken:code,
        verificationTokenExpiresAt:{$gt:Date.now()}
    }).populate({
      path:"user",
      select:"fName lName"
    });

    if(!account){
      return res.status(404).json({
        success:false,
        message:"Invalid or expired verification code."
      })
    }

   account.isVerified=true;
   account.verificationToken=undefined
   account.verificationTokenExpiresAt=undefined
   account.save()
   
   const name=account?.user?.fName+" "+account?.user?.lName;
   await sendWelcomeEmail(account.email,name);

   return res.status(200).json({
    success:true,
    message:"Email Verified Successfully"
   })


 } catch (error) {
  console.log(`Error in verifying Email:${error}`);
  return res.status(500).json({
    success:false,
    message:"Internal Server Error"
  })
 }
}

const uploadAvatar = async (req, res) => {
  try {
    // Find the user by ID
    console.log("AccountId:",req.userId)
    const account = await Account.findById(req.userId);

    if (!account) {
      return res.status(404).json({
        status: false,
        message: "User account not found",
      });
    }

    console.log("UserId:",account.user)
    const user=await User.findById(account.user);
    
    if (!user){
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Set default avatar based on gender
    const defaultAvatar = user.gender === "male" 
      ? "https://avatar.iran.liara.run/public/boy" 
      : "https://avatar.iran.liara.run/public/girl";

    let avatarUrl = defaultAvatar; // Default value
    let avatar_Id;
    // If a file is uploaded, handle the Cloudinary upload
    const fileLocalPath = req.files?.avatar?.[0]?.path;
    console.log("FilePath:",fileLocalPath)
    if (fileLocalPath) {
      const upload = await UploadFileOnCloudinary(fileLocalPath);
      avatarUrl = upload?.url || defaultAvatar;
      avatar_Id=upload?.public_id|| ""
    }

    // Update the user's avatar
    user.avatar.url = avatarUrl;
    user.avatar.public_id=avatar_Id

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: avatarUrl, 
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while uploading the avatar",
      error: error.message,
    });
  }
};

const login=async(req,res)=>{
 try {
  const { email, password } = req.body;

  console.log("Entered Password:",password)
  const account=await Account.findOne({email});


  if(!account){
    return res.status(404).json({
      status: false,
      message: "User account not found",
    })
  }

  console.log("Account Details:",account)
  console.log("Stored Password:",account.password)
  const isPasswordValid=await bcrypt.compare(password,account.password);

  if(!isPasswordValid){
    return res.status(401).json({
      status: false,
      message: "Invalid password",
    })
  }

  const token= await generateAccessTokensAndSaveInCookies(res,account._id)
  return res.status(200).json({
    status:true,
    message: "Logged in successfully",
    data:{
      ...account._doc,
      password:undefined

    },
    token:token
  })
 } catch (error) {
  console.log("User login error:", error);
  return res.status(500).json({
    status: false,
    message: "An error occurred while logging in",
  })
 }
}

const logout=async(req,res)=>{
   try {
    res.clearCookie("token");
    return res.status(200).json({message:"User logged out successfully"})
    
   } catch (error) {
    console.log("Logout Error:",error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while logging out",
    })
   }
}


const forgotPassword=async(req,res)=>{
  try {
    const {email} =req.body;
  
    const account=await Account.findOne({email})
  
    if(!account){
       return res.status(404).json({
        status: false,
        message: "Email not exist",
       })
    }
  
    const resetToken=crypto.randomBytes(20).toString("hex");
    const resetTokenExpiryDate=Date.now()+1*60*60*1000;
  
    account.resetPasswordToken=resetToken;
    account.resetPasswordExpiresAt=resetTokenExpiryDate;
    await account.save();
  
    const url=`${process.env.CLIENT_URL}/reset-password/${resetToken}`
    await sendResetPasswordRequestEmail(account?.email,url);
  
    return res.status(200).json({
      status:true,
      message: "Reset password link sent to your email",
    })
  
  } catch (error) {
    console.log("Error in forgot password:",error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

const resetPassword=async(req,res)=>{
  try {
      const {password}=req.body;
      const token=req.params.token;
      console.log("Token:",token)

      const account=await Account.findOne({
        resetPasswordToken:token,
        resetPasswordExpiresAt:{$gt:Date.now()}
      })
      console.log("accountToken:",account.resetPasswordToken);

      if(!account){
        return res.status(404).json({
          status: false,
          message: "Invalid reset token or expired",
        })
      }

      const hashedPassword=await bcrypt.hash(password,10);
      account.password=hashedPassword;
      account.resetPasswordToken=undefined;
      account.resetPasswordExpiresAt=undefined;
      await account.save();
      await sendResetPasswordSuccessEmail(account?.email);
      return res.status(200).json({
        status:true,
        message: "Password reset successfully",
      })

  } catch (error) {
    console.log(`Error in reset password: ${error}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    })
  }
}

const getMyProfile=async(req,res)=>{
  try {
    const account= await Account.findById(req.userId);
    const user=await User.findById({_id:account.user}).select("-password")

    if(!user)
    {
      return res.status(404).json({
        status:false,
        message:"User not found",
      });
    }

    return res.status(200).json({
      status:true,
      message:"User profile retrieved successfully",
      data:user,
    })
  } catch (error) {
    console.log("Error in getMyProfile:",error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching user profile",
    })
  }
}

const searchUser = async (req, res) => {
  try {
    const { username } = req.query;


    const myChats = await Chat.find({ groupChat: false, members: req.userId });
    const allUserFromMyChats = myChats.flatMap((chat) => chat.members);
    
    
    const allUsersExceptMeAndFriends = await Account.find({
      _id: { $nin: [req.userId, ...allUserFromMyChats] }, 
      username: { $regex: username, $options: "i" }, 
    }).populate("user", "fName lName avatar"); 

    
    if (allUsersExceptMeAndFriends.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No users found",
      });
    }

   
    const users = allUsersExceptMeAndFriends.map((account) => ({
      _id: account._id,
      username: account?.username, 
      avatar: account.user?.avatar?.url, 
    }));

    return res.json({
      status: true,
      message: "Users found",
      data: users,
    });
  } catch (error) {
    console.error("Error in searchUser:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;

  
    const account = await Account.findById(userId).session(session);
    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        status: false,
        message: "Account not found",
      });
    }

   
    await Account.findByIdAndDelete(userId, { session });

   
    await User.findByIdAndDelete(account.user._id, { session });

   
    await Chat.deleteMany({ members: userId }, { session });

   
    await FriendRequest.deleteMany(
      { $or: [{ sender: userId }, { receiver: userId }] },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      status: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();

    console.error(`Error in deleteAccount: ${error}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export {
   registerUser,
   uploadAvatar,
   login,
   logout,
   forgotPassword,
   resetPassword,
   getMyProfile,
   searchUser,
   verifyEmail,
   deleteAccount

   
   };
