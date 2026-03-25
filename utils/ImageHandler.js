import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from 'fs'
export const upload = (folderName,condition) => {
  console.log(condition);
  let imageCount = 0;
  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, `../uploads/${folderName}/`);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
      }
    }),
    limits: { fileSize: 20000000 },
    fileFilter: function (req, file, cb) {
      imageCount++;
      // if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
      //   req.fileValidationError = 'Only image files are allowed!';
      //   return cb(null, false);
      // }
        if(condition==='item'){
          if (imageCount >= 10) {
            req.fileValidationError = 'You can upload a maximum of 10 images.';
            return  cb(null, false);
          } 
        }
     
      cb(null, true);
    }
  });
};

export const postLetterMedia = (folderName) => {
  console.log(folderName);
  let imageCount = 0; // Track the number of images
  let videoCount = 0; // Track the number of videos

  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, `../uploads/${folderName}/`);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
      }
    }),
    // limits: { fileSize: 200000000 },
    fileFilter: function (req, file, cb) {
      if (file.mimetype.startsWith('image/')) {
        imageCount++;
        if (imageCount <= 5) {
          cb(null, true);
        } 
        
        else {
          req.fileValidationError = 'You can upload a maximum of 5 images.';
          cb(null, false);
        }
      } else if (file.mimetype.startsWith('video/')) {
        videoCount++;
        
        cb(null, true);
      } else {
        req.fileValidationError = 'You can upload only one video.';
        cb(null, false);
      }
    }
  });
};
export const genericUploadFile = (folderName) => {
  console.log(folderName);
  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, `../uploads/${folderName}/`);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
      }
    }),
    fileFilter: function (req, file, cb) {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else if (file.mimetype.startsWith('video/')) {
        
        cb(null, true);
      } else {
        cb(null, true);
      }
    }
  });
};
// export const postLetterMedia = (folderName) => {
//   console.log(folderName);
//   return multer({
//     storage: multer.diskStorage({
//       destination: function (req, file, cb) {
//         const uploadPath = path.join(__dirname, `../uploads/${folderName}/`);
//         fs.mkdirSync(uploadPath, { recursive: true });
//         cb(null, uploadPath);
//       },
//       filename: function (req, file, cb) {
//         cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
//       }
//     }),
//     limits: { fileSize: 20000000 },
//     fileFilter: function (req, file, cb) {
//       // Check if the file is an image or video
//       if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
//         cb(null, true);
//       } else {
//         req.fileValidationError = 'Only image or video files are allowed!';
//         cb(null, false);
//       }
//     }
//   });
// };
