import express from "express"
import {verifyTokens} from "../middlewares/verifyTokens.js"
import{
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
} from "../controllers/chat/chat.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
const router=express.Router();
router.post("/new",verifyTokens,newGroupChat);
router.get("/my",verifyTokens,getMyChats);
router.get("/mygroups",verifyTokens,getMyGroups);
router.put("/addmembers",verifyTokens,addMembers);
router.put("/remove",verifyTokens,removeMember);
router.delete("/leave/:chatId",verifyTokens,leaveGroup);
router.post("/message",verifyTokens,upload.array("files",5),sendAttachments);
router.route("/:chatId").get(verifyTokens,getChatDetails).put(verifyTokens,renameGroup).delete(verifyTokens,deleteChat);
router.get("/message/:chatId",getMessages)




export default router;

