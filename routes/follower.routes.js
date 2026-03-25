import { Router } from "express";
import {
    toggleFollow,
    getFollowers,
    getFollowing,
    checkFollowStatus,
} from "../Controllers/followerController.js";

const router = Router();

// Toggle following a user (body: { follower_id, following_id })
router.post("/toggle", toggleFollow);

// Get specific user followers
router.get("/followers/:id", getFollowers);

// Get users that a specific user is following
router.get("/following/:id", getFollowing);

// Check if a specific user is following another
router.get("/status/:follower/:following", checkFollowStatus);

export default router;
