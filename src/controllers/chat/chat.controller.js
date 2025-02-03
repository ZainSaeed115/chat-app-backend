import Chat from "../../models/chat/chat.model.js"
import Account from "../../models/user/account.model.js"
import Message from "../../models/message/message.model.js"
import {emitEvent} from "../../utils/commonFunction.js"
import {
  ALERT,REFETCH_CHATS,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT
} from "../../constants/constants.js"
import { getOtherMember } from "../../lib/helper.js";
const newGroupChat=async (req,res)=>{
    try {
        const {name,members}=req.body;

        if(members.length<2){
          return res.status(400).json({
            success:false,
            message:"Group chat must have at least 3 members",
          })
        }

        const allMembers=[...members,req.userId];
        const chat= new Chat({
            name,
            members:allMembers,
            groupChat:true,
            creator:req.userId
        });
        await chat.save();

      emitEvent(req,ALERT,allMembers,`Welcome to ${name}`);
      emitEvent(req,REFETCH_CHATS,members);

      return res.status(200).json({
        success:true,
        message:"Group chat created successfully",
      })

    } catch (error) {
        console.log("Error:",error);
        return res.status(500).json({ message: "Internal Server Error" });
    }

}

const getMyChats=async(req,res)=>{
  try {
    
    const chats= await Chat.find({members:{$in:[req.userId]}}).populate({
      path:"members",
      populate:{
        path:"user",
        select:"fName lName avatar.url"
      }
    })

    

      if(!chats){
        return res.status(404).json({
          success:false,
          message:"No chats found",
        })
      }

     
      const transformedChat= chats.map(({_id,name,members,groupChat})=>{
        const otherMembers=getOtherMember(members,req.userId)
       return  {
          _id,
          groupChat,
          avatar:groupChat? members.slice(0,3).map(({user})=>(
             user?.avatar?.url
          )):otherMembers?.user?.avatar?.url,
          name:groupChat? name:members[0]?.username,
          members:members.reduce((prev,curr)=>{
           
           if(curr._id.toString()!==req.userId.toString()){
             prev.push(curr._id);
           }

           return prev;
          },[]),
        
        }
  })

     return res.status(200).json({
      success:true,
      message:"Chats fetched successfully",
      data:transformedChat,
     
     }) 
    
  } catch (error) {
    console.log("Error:",error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

const getMyGroups=async(req,res)=>{
  try {
    const chats= await Chat.find(
      {
        members:req.userId,
        groupChat:true,
        creator:req.userId

      }
    ).populate({
      path:"members",
      populate:{
        path:"user",
        select:"fName lName avatar.url"
      }
    })

    if(!chats){
      return res.status(404).json({
        success:false,
        message:"No chats found",
      })
    }
    const group= chats.map(({_id,name,members,groupChat})=>{
      return {
        _id,
        name,
        groupChat,
        avatar:members.slice(0,3).map(({user})=>user?.avatar?.url)
      }
    });

    return res.status(200).json({
      success:true,
      message:"Groups fetched successfully",
      data:group
    })
  } catch (error) {
    console.log("Error:",error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

const addMembers =async(req,res)=>{
  try {
    const {chatId,members}=req.body;
    const chat=await Chat.findById(chatId);

    if(!chat){
      return res.status(404).json({
        success:false,
        message:"Chat not found",
      })
    }

    if(chat.creator.toString() !==req.userId.toString()){
      return res.status(403).json({
        success:false,
        message:"You are not allowed to add Member",
      })
    }
    
    if(!chat.groupChat){
     return res.status(400).json({
      success:false,
      message:"This is not a group chat",
     })
    }

    if (!members || members.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one member",
      });
    }
    
    const allNewMembersPromise = members.map((_id) => Account.findById(_id, "username"));
    const allNewMembers = await Promise.all(allNewMembersPromise);
   
    const uniqueMembers = allNewMembers.filter(i => !chat.members.includes(i._id.toString()));
    chat.members.push(...uniqueMembers);    

    if(chat.members.length>100){
      return res.status(400).json({
        success:false,
        message:"Group members limit reached",
      })
    }
    await chat.save();

    const allUsersName=allNewMembers.map((i)=>i.username).join(",")
    emitEvent(
      req,
      ALERT,
      chat.members,
      `${allUsersName} has been added to the group  ${chat.name}`
    )
    emitEvent(
      req,
      REFETCH_CHATS,
      chat.members
    )
    return res.status(200).json({
      success:true,
      message:"Member added successfully",
      
    })
  

  } catch (error) {
    console.log("Error:",error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

const removeMember=async(req,res)=>{
try {
  const {chatId,memberId}=req.body;

 const [chat,userThatWillBeRemoved]= await Promise.all([
  Chat.findById(chatId),
  Account.findById(memberId,"username")
 ])
  if(!chat) {
    return res.status(404).json({
      success:false,
      message:"Chat not found",
    })
  }
  if(!userThatWillBeRemoved){
    return res.status(404).json({
      success:false,
      message:"User not found",
    })
  }
  if(chat.creator.toString()==memberId.toString()){
    return res.status(403).json({
      success:false,
      message:"You cannot remove the admin of this group",
    })
  }
  if(chat.members.length<=3){
    return res.status(403).json({
      success:false,
      message:"Group must have at least 3 members",
    })

  }
  chat.members=chat.members.filter((i)=>i.toString()!=memberId.toString())
  await chat.save()

  emitEvent(
    req,
    ALERT,
    chat.members,
    `${userThatWillBeRemoved.username} has been removed from the group`
  )
  emitEvent(
    req,
    REFETCH_CHATS,
    chat.members
  )
  return res.status(200).json({
    success:true,
    message:"Member removed successfully",
  })


} catch (error) {
  console.log("Error:",error);
  return res.status(500).json({ message: "Internal Server Error" });
}
}

const leaveGroup=async(req,res)=>{
  try {
    const chatId=req.params.chatId;
    const chat= await Chat.findById(req.params.chatId);

    if(!chat){
      return res.status(404).json({
        success:false,
        message:"Chat not found",
      })
    }

    const remainingMembers=chat.members.filter((i)=>i.toString()!=req.userId.toString())
    if(remainingMembers.length<3){
      return res.status(403).json({
        success:false,
        message:"Group must have at least 3 members",
      })
    }
   if(chat.creator.toString()===req.userId){
      const randomMember=Math.floor(Math.random()*remainingMembers.length)
      const newCreator=remainingMembers[randomMember]
      chat.creator=newCreator
   }
    
    chat.members=remainingMembers
    const [user]= await Promise.all([
      Account.findById(req.userId,"username"),
      chat.save()
    ])
    
    emitEvent(
      req,
      ALERT,
      chat.members,
      `${user.username} has left the group`
    )

    return res.status(200).json({
      success:true,
      message:`${user.username} has left the group`,
    })
   


  } catch (error) {
    console.log("Error:",error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

const sendAttachments=async(req,res)=>{
  try {
    const {chatId}=req.body;
    
    const [chat,account]= await Promise.all([
      Chat.findById(chatId),
      Account.findById(req.userId).populate({
        path:"user",
        select:"fName,lName, avatar"
      })

    ]);


    if(!chat){
      return res.status(404).json({
        success:false,
        message:"Chat not found",
      })
    }

    if(!account){
      return res.status(404).json({
        success:false,
        message:"Account not found",
      })
    }

    const files=req.files || [];
    if(files.length<1){
      return res.status(400).json({
        success:false,
        message:"No files provided",
      })
    }
   
    const attachments=[];
    
    const messageForDatabase={
      content:"",
      attachments,
      sender:account._id,
      chat:chatId
    }

    const messageForRealTime={
      ...messageForDatabase,
      sender:{
          _id:account._id,
          username:account.username
      },
     
    }
    const message= await Message.create(messageForDatabase);
    emitEvent(
      req,
      NEW_ATTACHMENT,
      chat.members,
      messageForRealTime
    )
    emitEvent(
      req,
      NEW_MESSAGE_ALERT,
      chat.members,
      {
        chatId
      }
    )

    return res.status(201).json({
      success:true,
      message:"Attachment added successfully",
      data:message
    })
  } catch (error) {
    console.log("Error:",error)
  }
}

  const getChatDetails = async (req, res) => {
    try {
       if(req.query.populate==="true"){
        const chat = await Chat.findById(req.params.chatId)
        .populate({
          path: 'members', 
          select: 'username',  // You can select username as well
          populate: {
            path: 'user',
            select: 'fName lName avatar.url',
          }
        }).lean();
  
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }
  
      // Process members to include only relevant fields
       chat.members=chat.members.map(({_id,user})=>{
          return {
            _id,
            username:user?.fName+" "+user?.lName,
            avatar:user?.avatar?.url
          }
       })
  
      return res.status(200).json({
        success: true,
        data: chat,
      });
       }
       else{
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
          return res.status(404).json({
            success: false,
            message: "Chat not found",
          })

        }

        return res.status(200).json({
          success: true,
          data: chat,
        });
       }
    } catch (error) {
      console.log("Chat Details Error", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const renameGroup=async(req,res)=>{
    try {
      const {groupName}=req.body;
      const chat=await Chat.findById(req.params.chatId);
      if(!chat){
        return res.status(404).json({
          success:false,
          message:"Chat not found"
        })
      }
      if(!chat.groupChat){
        return res.status(400).json({
          success:false,
          message:"This is not a group chat"
        })
      }

      if(chat.creator.toString()!==req.userId){
        return res.status(400).json({
          success:false,
          message:"You are not the creator of this group"
        })
      }
      chat.name=groupName;
      chat.save();
      emitEvent(
        req,
        REFETCH_CHATS,
        chat.members
      )
      return res.status(200).json({
        success:true,
        data:chat
      })
    } catch (error) {
      console.log("Chat Group ReName Error:",error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      })
    }
  }

  const deleteChat=async(req,res)=>{
   try {
    const chat=await Chat.findById(req.params.chatId);
    if(!chat){
      return res.status(404).json({
        success:false,
        message:"Chat not found"
      })
    }
    const members=chat.members;
    if(chat.groupChat&&chat.creator.toString()!==req.userId.toString()){
      return res.status(400).json({
        success:false,
        message:"You are not the creator of this chat"
      })
    }

    if(!chat.groupChat&&!chat.members.includes(req.userId)){
      return res.status(400).json({
        success:false,
        message:"You are not the creator of this chat"
      })
    }
   
    const messagesWithAttachment=await Message.find({
      chatId:req.params.chatId,
      attachments:{$exists:true,$ne:[]}

    })

    const public_ids=[];
    messagesWithAttachment.forEach(({attachments})=>{
      attachments.forEach(({public_id})=>{
      public_ids.push(public_id)
      })
     })
     
     await Promise.all([
      // delete files from cloudinary
      chat.deleteOne({_id:req.params.chatId}),
      Message.deleteMany({chat:req.params.chatId})
     ])

     emitEvent(req,REFETCH_CHATS,members)
    

    return res.status(200).json({
      success:true,
      message:"Chat deleted successfully",
     
    })
   } catch (error) {
     console.log("CHAT DELETE ERROR:",error);
     return res.status(500).json({
      success: false,
      message: "Internal Server Error",
     })
   }
  }

  const getMessages=async(req,res)=>{
   try {
    
    const chatId=req.params.chatId;
    const {page=1}=req.query;
    const limit=20
    const skip=(page-1)*limit;
    const [messages,totalMessageCount]=await Promise.all([
    Message.find({chat:chatId})
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
    .populate({
      path:"sender",
      select:"username",
      populate:{
        path:"user",
        select:"avatar.url"
      }
    }),
    Message.countDocuments({chat:chatId})
    ])
    const updatedMessages = messages.map(message => ({
      ...message.toObject(),  // Convert Mongoose document to plain object
      sender: {
        _id: message.sender._id,
        username: message.sender.username,
        avatar: message.sender.user?.avatar?.url || null
      }
    }));
    const totalPages=Math.ceil(totalMessageCount/limit);
    return res.status(200).json({
      success:true,
      updatedMessages,
      totalPages
    })
   } catch (error) {
    console.log("Error:",error)
    return res.status(500).json({
      success:false,
      message:"Internal Server Error"
    })
   }
  }
  
  
export {
    newGroupChat,
    getMyChats,
    getMyGroups,
    addMembers,
    removeMember,
    leaveGroup,
    sendAttachments,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages
}