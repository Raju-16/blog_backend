const mongoose = require("mongoose");

const connect = () => {
  return mongoose.connect(
    "mongodb+srv://admin:Raju1234@cluster0.4af9bff.mongodb.net/BlogApp"
  );
};

module.exports = connect;
