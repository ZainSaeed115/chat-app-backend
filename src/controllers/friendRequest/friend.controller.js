import mongoose from "mongoose"
import FriendRequest from "../../models/request/friendRequest.model.js"
import Chat from "../../models/chat/chat.model.js"
import {REFETCH_CHATS,NEW_REQUEST} from "../../constants/constants.js"
import {getOtherMember} from "../../lib/helper.js"
import { emitEvent } from "../../utils/commonFunction.js"



const sendFriendRequest = async (req, res) => {
    try {
      const { friendId } = req.body;
  
     
      if (req.userId === friendId) {
        return res.status(400).json({
          status: false,
          message: "You cannot send a friend request to yourself.",
        });
      }
  
      // Check if a friend request already exists between the two users
      const findFriendRequest = await FriendRequest.find({
        $or: [
          { sender: req.userId, receiver: friendId },
          { sender: friendId, receiver: req.userId },
        ],
      });
     
      if (findFriendRequest.length > 0) {
        return res.status(400).json({
          status: false,
          message: "A friend request already exists between you and this user.",
        });
      }
  
      // Create a new friend request
      const newFriendRequest = new FriendRequest({
        sender: req.userId,
        receiver: friendId,
      });
  
      await newFriendRequest.save();
  
      // Emit an event to notify the receiver (ensure emitEvent is defined)
      emitEvent(req, NEW_REQUEST, [friendId]);
  
      return res.status(201).json({
        status: true,
        message: "Friend request sent successfully.",
        data: newFriendRequest, // Optionally include the created request in the response
      });
    } catch (error) {
      console.error("Error in sendFriendRequest:", error);
      return res.status(500).json({
        status: false,
        message: "Internal server error. Please try again later.",
      });
    }
  };
 
  
  const acceptFriendRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const requestId = req.params.requestId;
      const friendRequest = await FriendRequest.findById(requestId).session(session)
        .populate({
          path: "sender",
          select: "username",
          populate: {
            path: "user",
            select: "avatar.url"
          }
        })
        .populate({
          path: "receiver",
          select: "username",
          populate: {
            path: "user",
            select: "avatar.url"
          }
        });
  
      if (!friendRequest) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Friend request not found.",
        });
      }
    
      if (friendRequest.receiver._id.toString() !== req.userId.toString()) {
        await session.abortTransaction();
        return res.status(403).json({
          success: false,
          message: "You are not the intended receiver of this request.",
        });
      }
  
      if (friendRequest.status !== "pending") {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Friend request has already been ${friendRequest.status}.`,
        });
      }
  
      friendRequest.status = "accepted";
      await friendRequest.save({ session });
  
      const members = [friendRequest.sender._id, friendRequest.receiver._id];
  
      const existingChat = await Chat.findOne({
        members: { $all: members }
      }).session(session);
      
      if (existingChat) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Chat between users already exists.",
        });
      }
     
      const chat = await Chat.create([{
        members: members,
        name: `${friendRequest.sender.username}-${friendRequest.receiver.username}`
      }], { session });
  
      if (!chat) {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          message: "Failed to create chat.",
        });
      }
  
      emitEvent(req, REFETCH_CHATS, members);
  
      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Friend request accepted successfully.",
        senderId: friendRequest.sender._id,
        chat:chat
      });
    } catch (error) {
      console.error("Error in acceptFriendRequest:", error);
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    } finally {
      session.endSession(); 
    }
  };
  
 
  
  const declineFriendRequest = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const requestId = req.params.requestId;
      const friendRequest = await FriendRequest.findById(requestId).session(session);
  
      if (!friendRequest) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Friend request not found.",
        });
      }
  
      if(friendRequest.status!="pending"){
        return res.status(400).json({
          success:false,
          message:"You cant decline the friend request"
        })
      }
    
      friendRequest.status = "rejected";
      await friendRequest.save({ session });
  
      const deletedFriendRequest = await FriendRequest.findByIdAndDelete(requestId).session(session);
  
      if (!deletedFriendRequest) {
        await session.abortTransaction();
        return res.status(500).json({
          success: false,
          message: "Failed to delete friend request.",
        });
      }
  
      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Friend request declined successfully.",
      });
    } catch (error) {
      console.error("Error in declineFriendRequest:", error);
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    } finally {
      session.endSession();  
    }
  };
  
  
 
  const getMyNotifications=async(req,res)=>{
   try {
    const request= await FriendRequest.find({receiver:req.userId}).populate({
      path: 'sender',
      select: 'username',
      populate:{
        path:'user',
        select:'fName lName avatar.url'
      }
    });
    if(!request){
      return res.status(404).json({
        success:false,
        message:"No notifications found"
      })
    }
    console.log("Request:",request)
    const allRequest=request.map((request)=>(
      {
        _id:request?._id,
         sender:{
          senderId:request?.sender?._id,
          senderName:request?.sender?.user?.fName+" "+request?.sender?.user?.lName,
          senderAvatar:request?.sender?.user?.avatar?.url,
         }
      }
    ))
    return res.status(200).json({
      success:true,
      message:"Notifications retrieved successfully",
      notifications:allRequest
    })
   } catch (error) {
    console.log("Error in getAllNotifications:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    })
   }
  }
  

  
  const getMyFriends=async(req,res)=>{
    try {
      const chatId=req.query.chatId;
      const chat=await Chat.find({
        members:req.userId,
        groupChat:false
      })
      .populate({
        path:'members',
        select:'username',
        populate:{
          path:'user',
          select:'fName lName avatar.url'
        }
      })
      
      const myFriends=chat.map(({members})=>{
        const otherMembers=getOtherMember(members,req.userId)
        return{
         _id:otherMembers._id,
         name:otherMembers?.user?.fName+" "+otherMembers?.user?.lName,
         avatar:otherMembers?.user?.avatar?.url
        }
      })
      if(chatId){
        const chat= await Chat.findById(chatId);
        if(!chat){
          return res.status(404).json({
            success:false,
            message:"Chat not found"
          });
        }
        const availableFriends=myFriends.filter(
          (friend)=>!chat.members.includes(friend._id)
          )
          return res.status(200).json({
            success:true,
            message:"Friends available in the chat",
            data:availableFriends
          })
      }else{
        return res.status(200).json({
          success:true,
          message:"Friends retrieved successfully",
          friends:myFriends
        })
      }
    } catch (error) {
      console.log("Error in getMyFriends:", error);
      return res.status(500).json({
        success:false,
        message:"Internal server error"
      })
    }
  }
  
  
  
 export {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getMyNotifications,
    getMyFriends
 }