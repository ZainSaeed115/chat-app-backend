import mongoose from "mongoose";


const messageSchema= new mongoose.Schema({
    content:String,
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:true
    },
    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat",
        required:true
    },
    attachments:[{
        public_id:{
            type:String,
            required:true,
          },
          url:{
            type:String,
            required:true
          }
    }]

},
{
    timestamps:true
}
);

const Message = mongoose.model("Message", messageSchema);
export default Message;