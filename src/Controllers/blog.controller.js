const express = require("express");
const mongoose = require("mongoose");
const BlogModel = require("../Models/blog.model");
const UserModel = require("../Models/user.model");
const upload = require("../MiddleWare/fileUpload");
require("../Middleware/cloudinary");
const cloudinary = require("cloudinary");

const blogRouter = express.Router();

blogRouter.get("/", async (req, res) => {
  let obj = {};
  let limit;
  let sort;
  let page;

  if (req.query.category) {
    obj.category = { $in: req.query.category };
  }

  if (req.query.limit) {
    limit = req.query.limit;
  } else {
    limit = 0;
  }
  if (req.query.page) {
    page = Number(req.query.page - 1 - limit);
  } else {
    page = 0;
  }
  if (req.query.sort === "") {
    sort = "";
  } else {
    sort = req.query.sort;
  }

  let blogs;
  try {
    blogs = await BlogModel.find(obj)
      .limit(limit)
      .skip(page)
      .sort(sort)
      .lean()
      .exec();
  } catch (error) {
    return res.send({ error: error.message });
  }
  if (!blogs) {
    return res.send("Blog not found");
  }
  return res.status(200).send({ blogs });
});

blogRouter.post("", upload.single("image"), async (req, res, next) => {
  // const { title, description, minRead, category, author, userID } = req.body;

  const result = await cloudinary.v2.uploader.upload(req.file.path);

  let existingUser;
  try {
    existingUser = await UserModel.findById(req.body.userID);
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
  if (!existingUser) {
    return res.status(400).send({ message: "Unable to find user by this ID" });
  }

  let newBlog = new BlogModel({
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    minRead: req.body.minRead,
    author: req.body.author,
    image: result.secure_url,
    userID: req.body.userID,
    // here userID mean the id of the user who register and want to write a blog on this app.
  });

  try {
    // await newBlog.save();
    const session = await mongoose.startSession();
    session.startTransaction();
    await newBlog.save({ session });
    existingUser.allBlogs.push(newBlog);
    // here allBlogs is the array that is in user collection there every user have blog array.
    await existingUser.save({ session });
    await session.commitTransaction();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
  return res.status(201).json(newBlog);
});

blogRouter.patch("/:id", upload.single("image"), async (req, res, next) => {
  // const { title, category, description, minRead, author, image } = req.body;

  const result = await cloudinary.v2.uploader.upload(req.file.path);

  const blogId = req.params.id;
  let blog;
  try {
    blog = await BlogModel.findByIdAndUpdate(
      blogId,
      {
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        minRead: req.body.minRead,
        author: req.body.author,
        image: result.secure_url,
        userID: req.body.userID,
      },
      { new: true }
    );
    console.log(blog, "We want the result");
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
  if (!blog) {
    return res.status(500).send("Unable to update the blog");
  }
  return res.status(200).send({ blog });
});

// with this route and method you can get any perticular blog details with the help of blog id.
blogRouter.get("/:id", async (req, res, next) => {
  const blogId = req.params.id;
  let blog;
  try {
    blog = await BlogModel.findById(blogId).lean().exec();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
  if (!blog) {
    return res.status(500).send("Blog not found");
  }
  return res.status(200).send({ blog });
});

// With this route and method you can delete any perticular blog that is in any particular user. here you have to provide the user's blog id.
blogRouter.delete("/:id", async (req, res, next) => {
  const blogId = req.params.id;
  let result;
  try {
    result = await BlogModel.findByIdAndRemove(blogId).populate("userID");
    await result.userID.allBlogs.pull(result);
    await result.userID.save();
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
  if (!result) {
    return res.status(500).send({ message: "Blog not found" });
  }
  return res.status(200).send({ result });
});

module.exports = blogRouter;
