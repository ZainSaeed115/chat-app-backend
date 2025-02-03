import mongoose from "mongoose";

const userSchema= new mongoose.Schema({
   
    fName:{
        type:String,
        required:true
    },
    lName:{
        type:String,
        required:true
    },
    avatar:{
      public_id:{
        type:String,
      
      },
      url:{
        type:String,
      
      }
    },
    gender:{
        type:String,
        enum:["male","female","other"],
    },
    phone:{
        type:String
    }

},
{
 timestamps:true
});
const User=mongoose.model("User",userSchema);

export default User;
