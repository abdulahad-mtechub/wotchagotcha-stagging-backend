import express from "express";
import pkg from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import dbConfig from "./db.config/index.js";
import { fileURLToPath } from "url";
import setCorsHeaders from "./Middleware/corsMiddleware.js";
import userRoute from "./routes/user.routes.js";
import appCategory from "./routes/appCategory.routes.js";
import videoCategoryRoute from "./routes/videoCategory.routes.js";
import picCategoryRoute from "./routes/picCategory.routes.js";
import itemCategoryRoute from "./routes/itemCategory.routes.js";
import itemSubCategoryRoute from "./routes/itemSubCategory.routes.js";
import discCategoryRoute from "./routes/discCategory.routes.js";
import discSubCategoryRoute from "./routes/discSubCategory.routes.js";
import blogRoute from "./routes/blogs.routes.js";
import xpiRoute from "./routes/xpiVideo.routes.js";
import picTourRoute from "./routes/picToursCategory.routes.js";
import qafiRoute from "./routes/qafiController.routes.js";
import gebcRoute from "./routes/GEBC.routes.js";
import newsRoute from "./routes/news.routes.js";
import searchRoute from "./routes/search.routes.js";
import topRoute from "./routes/top.routes.js";
import signatureRoute from "./routes/signature.routes.js";
import postLetterRoute from "./routes/postLetter.routes.js";
import itemRoute from "./routes/item.routes.js";
import mondonMarketRoute from "./routes/mondonMarket.routes.js";
import bannerConfigRoute from "./routes/bannerConfiguration.routes.js";
import bannerRoute from "./routes/banner.routes.js";
import rateAppRoute from "./routes/rateApp.routes.js";
import shareAppRoute from "./routes/shareApp.routes.js";
import contactUsRoute from "./routes/contactus.routes.js";
import pagesRoute from "./routes/pages.routes.js";
import termsRoute from "./routes/terms.routes.js";
import policyRoute from "./routes/policy.routes.js";
import massAppRoute from "./routes/massApp.routes.js";
import paymentRoute from "./routes/payment.routes.js";
import notificationType from "./routes/notificationType.routes.js";
import notification from "./routes/notification.routes.js";
import regionRoute from "./routes/region.routes.js";
// ***** cinematics *******
import cinematicsCategoryRoute from "./routes/cinematics/category.js";
import cinematicsSubCategoryRoute from "./routes/cinematics/sub_category.js";
import cinematicsRoute from "./routes/cinematics/cinematics.js";
// ***** cinematics *******
// ***** fan star *******
import fanStarCategoryRoute from "./routes/fan_star/category.js";
import fanStarSubCategoryRoute from "./routes/fan_star/sub_category.js";
import fanStarRoute from "./routes/fan_star/fan_star.js";
// ***** fan star *******
// ***** tv progmax *******
import tvProgmaxCategoryRoute from "./routes/tv_progmax/category.js";
import tvProgmaxSubCategoryRoute from "./routes/tv_progmax/sub_category.js";
import tvProgmaxRoute from "./routes/tv_progmax/tv_progmax.js";
// ***** tv progmax *******
// ***** kid vids *******
import kidVidsCategoryRoute from "./routes/kid_vids/category.js";
import kidVidsSubCategoryRoute from "./routes/kid_vids/sub_category.js";
import kidVidsRoute from "./routes/kid_vids/kid_vids.js";
// ***** kid vids *******
// ***** learning and hobbies *******
import learningHobbiesCategoryRoute from "./routes/learning_hobbies/category.js";
import learningHobbiesSubCategoryRoute from "./routes/learning_hobbies/sub_category.js";
import learningHobbiesRoute from "./routes/learning_hobbies/learning_hobbies.js";
import { updateBannerStatus } from "./utils/corn.util.js";
// ***** learning and hobbies *******
import paymentsRoute from "./routes/payments/payments.js";

// ***** cinematics *******
import sportsCategoryRoute from "./routes/sports/category.js";
import sportsSubCategoryRoute from "./routes/sports/subCategory.js";
import sportRoute from "./routes/sports/sports.js";

// ***** video subcategory *******
import videoSubCategoryRoute from "./routes/videoSubCategoryRoutes.js";

// ***** pic subcategory *******
import picSubCategoryRoute from "./routes/picSubCategoryRoutes.js";

// ***** qafi category *******
import qafiCategoryRoute from "./routes/qafiCategoryRoutes.js";

// ***** qafi subcategory *******
import qafiSubCategoryRoute from "./routes/qafiSubCategory.js";

import gebcCategoryRoute from "./routes/gebcCategory.js";

import gebcSubCategoryRoute from "./routes/gebcSubCategory.js";

import newsCategoryRoute from "./routes/newsCategory.js";
import newsSubCategoryRoute from "./routes/newsSubCategory.js";
import indexRoute from "./routes/index.routes.js";

import cron from "node-cron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3801;
const { json } = pkg;
dotenv.config();
app.use(express.json());
app.use(setCorsHeaders);
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "uploads")));
app.use(json());
// Handle invalid JSON errors from body parsers and return a clear message
app.use((err, req, res, next) => {
  if (!err) return next();
  // body-parser sets err.type === 'entity.parse.failed' for parse errors
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  next(err);
});
app.use("/user", userRoute);
app.use("/app", appCategory);
app.use("/videoCategory", videoCategoryRoute);
app.use("/picCategory", picCategoryRoute);
app.use("/itemCategory", itemCategoryRoute);
app.use("/itemSubCategory", itemSubCategoryRoute);
app.use("/discCategory", discCategoryRoute);
app.use("/discSubCategory", discSubCategoryRoute);
app.use("/blog", blogRoute);
app.use("/xpi", xpiRoute);
app.use("/picTour", picTourRoute);
app.use("/qafi", qafiRoute);
app.use("/gebc", gebcRoute);
app.use("/news", newsRoute);
app.use("/search", searchRoute);
app.use("/top", topRoute);
app.use("/signature", signatureRoute);
app.use("/letter", postLetterRoute);
app.use("/item", itemRoute);
app.use("/mondonMarket", mondonMarketRoute);
app.use("/bannerConfig", bannerConfigRoute);
app.use("/banner", bannerRoute);
app.use("/rateApp", rateAppRoute);
app.use("/shareApp", shareAppRoute);
app.use("/contact", contactUsRoute);
app.use("/pages", pagesRoute);
app.use("/terms", termsRoute);
app.use("/policy", policyRoute);
app.use("/massApp", massAppRoute);
app.use("/payment", paymentRoute);
app.use("/notification_type", notificationType);
app.use("/notification", notification);
app.use("/region", regionRoute);

// ****** cinematics ******
app.use("/cinematics/category", cinematicsCategoryRoute);
app.use("/cinematics/sub_category", cinematicsSubCategoryRoute);
app.use("/cinematics", cinematicsRoute);
// ****** cinematics ******

// ****** fanStar ******
app.use("/fanStar/category", fanStarCategoryRoute);
app.use("/fanStar/sub_category", fanStarSubCategoryRoute);
app.use("/fanStar", fanStarRoute);
// ****** fanStar ******

// ****** tvProgmax ******
app.use("/tvProgmax/category", tvProgmaxCategoryRoute);
app.use("/tvProgmax/sub_category", tvProgmaxSubCategoryRoute);
app.use("/tvProgmax", tvProgmaxRoute);
// ****** tvProgmax ******

// ****** kidVids ******
app.use("/kidVids/category", kidVidsCategoryRoute);
app.use("/kidVids/sub_category", kidVidsSubCategoryRoute);
app.use("/kidVids", kidVidsRoute);
// ****** kidVids ******

// ****** learningHobbies ******
app.use("/learningHobbies/category", learningHobbiesCategoryRoute);
app.use("/learningHobbies/sub_category", learningHobbiesSubCategoryRoute);
app.use("/learningHobbies", learningHobbiesRoute);
// ****** learningHobbies ******

// ****** payments ******
app.use("/payments", paymentsRoute);
// ****** payments ******

// ****** sports ******
app.use("/sports/category", sportsCategoryRoute);
app.use("/sports/sub_category", sportsSubCategoryRoute);
app.use("/sports", sportRoute);

// ****** video *****
app.use("/video/sub_category", videoSubCategoryRoute);

// ****** pic *****
app.use("/pic/sub_category", picSubCategoryRoute);

// ****** qafi *****
app.use("/qafi/category", qafiCategoryRoute);

// ****** qafi subcategory *****
app.use("/qafi/sub_category", qafiSubCategoryRoute);

app.use("/gebc/category", gebcCategoryRoute);
app.use("/gebc/sub_category", gebcSubCategoryRoute);

app.use("/news/category", newsCategoryRoute);
app.use("/news/sub_category", newsSubCategoryRoute);
app.use("/index", indexRoute);
app.use("/test", (req, res) => {
  res.send("hello");
});
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
  preflightContinue: false,
  optionsSuccessStatus: 204,

};
app.use(cors(corsOptions));

// Schedule the cron job to run daily at midnight
cron.schedule("0 0 * * *", () => {
  console.log("Running cron job to update banner statuses");
  updateBannerStatus();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
