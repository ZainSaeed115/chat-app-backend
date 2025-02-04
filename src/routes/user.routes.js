import express from "express";
import {
  registerUser,
  uploadAvatar,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMyProfile,
  searchUser,
  verifyEmail,
  deleteAccount
  
} from "../controllers/user/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyTokens} from "../middlewares/verifyTokens.js"
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify",verifyEmail)
router.post("/login",login);
router.post("/upload-avatar",verifyTokens,upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }
]),uploadAvatar);
router.post("/logout",verifyTokens,logout);
router.post("/forgot-password",forgotPassword);
router.post("/reset-password/:token",resetPassword);
router.get("/my-profile",verifyTokens,getMyProfile);
router.get("/search",verifyTokens,searchUser);
router.delete("/delete-account",verifyTokens,deleteAccount);




export default router;
