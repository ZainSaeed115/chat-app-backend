import mongoose from "mongoose";

const chatSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    groupChat:{
        type:Boolean,
        default:false,
    },
    creator:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
    },
    members:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Account",
        }
    ]
},{
    timestamps:true
});

const Chat=mongoose.model("Chat",chatSchema);

export default Chat;