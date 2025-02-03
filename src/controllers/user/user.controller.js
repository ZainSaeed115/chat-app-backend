import User from "../../models/user/user.model.js";
import Account from "../../models/user/account.model.js";
import Chat from "../../models/chat/chat.model.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { 
  generateAccessTokensAndSaveInCookies,
  generateUniqueUsername,
  
 } from "../../utils/commonFunction.js";
import {UploadFileOnCloudinary} from "../../utils/cloudinary.js"



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

 
    const account = new Account({
      username:uniqueUsername,
      email,
      password: hashedPassword,
      Bio: Bio || "", 
      status: "Active",
      user: user._id,
    });

    await account.save({ session });

   
    await session.commitTransaction();
    session.endSession();

   
    const token = await generateAccessTokensAndSaveInCookies(res, account._id);

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

  const {email,password} =req.body;
  
  const account=await Account.findOne({email})

  if(!account){
     return res.status(404).json({
      status: false,
      message: "Email not exist",
     })
  }

  const hashedPassword=await bcrypt.hash(password,10)
  account.password=hashedPassword
  await account.save()
  return res.status(200).json({
    status:true,
    message: "Password updated successfully",
  })




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



export {
   registerUser,
   uploadAvatar,
   login,
   logout,
   forgotPassword,
   getMyProfile,
   searchUser,
   
   };
