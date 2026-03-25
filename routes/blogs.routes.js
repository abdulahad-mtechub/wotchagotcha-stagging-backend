import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { upload } from '../utils/ImageHandler.js'
import { createBlog, deleteAllBlog, deleteBlog, getAllBlogs, getSpecificBlog, searchBlogs, updateBlog } from '../Controllers/blogController.js';
const blogRoute = Router();

blogRoute.post('/createBlog', upload("blogImages").single("image"), createBlog);
blogRoute.delete('/deleteBlog/:id', deleteBlog);
blogRoute.put('/updateBlog', upload("blogImages").single("image"), updateBlog);
blogRoute.get("/getAllBlogs", getAllBlogs)
blogRoute.get("/getSpecificBlog/:id", getSpecificBlog)
blogRoute.delete("/deleteAllBlogs", deleteAllBlog)
blogRoute.get("/searchBlogs", searchBlogs)
export default blogRoute;
