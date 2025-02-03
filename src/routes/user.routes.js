import express from "express";
import {
  registerUser,
  uploadAvatar,
  login,
  logout,
  getMyProfile,
  searchUser,
  
} from "../controllers/user/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyTokens} from "../middlewares/verifyTokens.js"
const router = express.Router();

router.post("/register", registerUser);
router.post("/login",login);
router.post("/upload-avatar",verifyTokens,upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }
]),uploadAvatar);
router.post("/logout",verifyTokens,logout);
router.get("/my-profile",verifyTokens,getMyProfile);
router.get("/search",verifyTokens,searchUser);




export default router;
