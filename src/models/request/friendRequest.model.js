import mongoose from "mongoose";

const friendRequestSchema= new mongoose.Schema({
    status:{
        type:String,
        default:"pending",
        enum:["pending","accepted","rejected"]
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:true
    },
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:true
    },
   

},
{
    timestamps:true
}
)

const FriendRequest=mongoose.model("FriendRequest",friendRequestSchema)
export default FriendRequest;