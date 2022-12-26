const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // making your file name unique.
    callback(null, uniquePrefix + file.originalname);
  },
});

//   storage function need where to store and name of the file.
module.exports = multer({
  storage,
  limits: {
    // this size of file excepted by multer and
    fileSize: 1024 * 1024 * 5,
  },
});
