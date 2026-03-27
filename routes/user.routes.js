import { Router } from "express";
import {
  ResetPasswordLinkValidate,
  accountDeletePermanently,
  blockUnblockUser,
  cancelSubsciptionEmail,
  cancelSubscription,
  changePassword,
  countUsersByMonth,
  createSubscription,
  deleteAllUsers,
  deleteUser,
  forgetPassword,
  getAdminDashboardStats,
  getAllDataOfDeletedUser,
  getAllDeleteUsers,
  getAllSubscribedUser,
  getAllUsers,
  getAllUsersByYears,
  getSpecificUser,
  getUserStats,
  getUserProfileSummary,
  login,
  register,
  resetPassword,
  restoreUser,
  searchUsers,
  sendSubsciptionEmail,
  sendWellcomeEmail,
  updateProfile,
  uploadImage,
  verifyOtp,
  likeUserProfile,
  getProfileLikesCount,
  getUsersWhoLikedProfile,
} from "../Controllers/userController.js";
import { upload } from "../utils/ImageHandler.js";
import { verification } from "../Middleware/Verification.js";
import { SubscriptionEmail } from "../utils/EmailTemplates.js";
const userRoute = Router();
// userRoute.get('/verifyToken', verifyToken);
userRoute.post("/login", login);
userRoute.post("/register", register);
userRoute.post("/uploadImage", uploadImage);

// userRoute.post('/uploadImage',upload("userImage").single("image"), uploadImage);
userRoute.post("/forgetPassword", forgetPassword);
userRoute.post("/verifyOtp", verifyOtp);
userRoute.post("/reset_password", resetPassword);
userRoute.post("/changePassword", changePassword);
userRoute.post("/validate_reset_password_link", ResetPasswordLinkValidate);
userRoute.post("/updateUserProfile", updateProfile);
userRoute.post("/likeUserProfile", likeUserProfile);
userRoute.get("/getProfileLikesCount/:user_id", getProfileLikesCount);
userRoute.get("/getProfileLikes/:id", getUsersWhoLikedProfile);
userRoute.get("/getUser/:id", getSpecificUser);
userRoute.get("/getAllUsers", getAllUsers);
userRoute.get("/getAllUsersByYear", countUsersByMonth);
userRoute.delete("/deleteUser/:id", deleteUser);
userRoute.delete("/deleteAllUser", deleteAllUsers);
userRoute.get("/searchUser", searchUsers);
userRoute.post("/blockUnblockUser", blockUnblockUser);
userRoute.get("/getAllDeletedUsers", getAllDeleteUsers);
userRoute.post("/restoreUser", restoreUser);
userRoute.post("/createSubscription", createSubscription);
userRoute.get("/getAllSubscribedUser", getAllSubscribedUser);
userRoute.get("/getDashboardStats", getAdminDashboardStats);
userRoute.get("/getUserStats/:user_id", getUserStats);
userRoute.get("/profile-summary/:userId", getUserProfileSummary);
userRoute.post("/sendWellcomeEmail", sendWellcomeEmail);
userRoute.get(
  "/getAllDataOfDeletedUser/:user_id",

  getAllDataOfDeletedUser
);
userRoute.post("/sendSubscriptionEmail", sendSubsciptionEmail);
userRoute.post("/cancelSubsciptionEmail", cancelSubsciptionEmail);
userRoute.post("/unsubscribeUser", cancelSubscription);
// ✅ New route for permanent deletion
userRoute.delete(
  "/deleteUserPermanently/:id",

  accountDeletePermanently
);
export default userRoute;
