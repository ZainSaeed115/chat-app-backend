import express from "express"
import {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getMyNotifications,
    getMyFriends
} from "../controllers/friendRequest/friend.controller.js"
import {verifyTokens} from "../middlewares/verifyTokens.js"

const router=express.Router();

router.post("/send-friend-request",verifyTokens,sendFriendRequest);
router.post("/accept-friend-request/:requestId",verifyTokens,acceptFriendRequest);
router.post("/decline-friend-request/:requestId",verifyTokens,declineFriendRequest)
router.get("/get-my-notifications",verifyTokens,getMyNotifications);
router.get("/get-my-friends",verifyTokens,getMyFriends);

export default router;