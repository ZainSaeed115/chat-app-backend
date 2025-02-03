import mongoose from "mongoose";

const accountSchema= new mongoose.Schema({
   user:{
    type:mongoose.Schema.Types.ObjectId,
    required:true,
    ref:"User"
   },
   username:{
    type:String,
    required:true,
    unique:true,
   },
   email:{
    type:String,
    required:true
   },
   password:{
    type:String,
    required:true,
   
   },
   Bio:{
      type:String
   },
   status:{
    type:String,
    enum:["Active","InActive","suspended"],
    default:"InActive",
   },
   isAdmin:{
    type:Boolean,
    enum:[0,1],
    default:0
   },
   isVerified:{
      type:Boolean,
      default:false
   },
   verificationToken:String,
   verificationTokenExpiresAt:Date,
   resetPasswordToken:String,
   resetPasswordExpiresAt:Date,


   
},{
    timestamps:true
});
const Account=mongoose.model("Account",accountSchema);
export default Account;