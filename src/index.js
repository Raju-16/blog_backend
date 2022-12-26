const express = require("express");
const connect = require("./Configs/db");
const blogRouter = require("./Controllers/blog.controller");
const {
  userRouter,
  register,
  login,
} = require("./Controllers/user.controller");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors());
app.use("/signup", register);
app.use("/login", login);
app.use("/user", userRouter);
app.use("/blog", blogRouter);

app.listen(process.env.PORT || 8080, async () => {
  try {
    await connect();
    console.log("Connected to Database");
  } catch (error) {
    console.log(error);
  }
});


