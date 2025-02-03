import {v2 as Cloudinary} from "cloudinary"
import fs from "fs"
import "dotenv/config"
console.log("Name:",process.env.CLOUD_NAME)
console.log("Key:",process.env.CLOUD_API_KEY)
console.log("secret:",process.env.CLOUD_API_SECRET_KEY)
Cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET_KEY,
})

const UploadFileOnCloudinary=async(localFilePath)=>{
   try {
    if(!localFilePath) return null;

   const response = await Cloudinary.uploader.upload(localFilePath,{
    resource_type: "auto",
   });
   fs.unlinkSync(localFilePath)
    return response;
   } catch (error) {
    fs.unlinkSync(localFilePath)
    console.log(`Error in uploading file on Cloudinary:${error}`)
   }
}

export {UploadFileOnCloudinary}