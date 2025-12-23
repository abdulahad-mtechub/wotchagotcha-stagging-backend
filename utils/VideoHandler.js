import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { getVideoDurationInSeconds } from "get-video-duration";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const upload = (folderName) => {
  console.log(folderName);

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, `../uploads/${folderName}/`);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
    },
  });

  const videoFilter = function (req, file, cb) {
    // const allowedExtensions = /\.(mp4|avi|mkv|mov)$/i;
    // if (!file.originalname.match(allowedExtensions)) {
    //   req.fileValidationError =
    //     "Only video files (MP4, AVI, MKV, MOV) are allowed!";
    //   return cb(null, false);
    // }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter: videoFilter,
  });
};

export const uploadVideoWithLengthCheck = (folderName) => {
  console.log("sdshydgjsh");
  const uploadMiddleware = upload(folderName).single("video");

  return (req, res, next) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      if(!req.file){
        return next();
      }
      try {
        const videoPath = req.file.path;
        console.log(req.file);
        console.log(videoPath);
        getVideoDurationInSeconds(videoPath)
          .then((duration) => {
            console.log(duration);
            if (duration > 194) {
              // Video duration is too long
              fs.unlinkSync(videoPath); // Remove the uploaded video
              return res.status(400).json({
                message:
                  "Video length is greater than 3 minutes and 14 seconds",
              });
            } else {
              next();
            }
          })
          .catch((err) => {
            console.log(err);
            return res
              .status(500)
              .json({ err, message: "Video duration check failed" });
          });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ message: "Video upload and check failed" });
      }
    });
  };
};
