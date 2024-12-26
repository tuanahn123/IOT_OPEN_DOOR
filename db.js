"use strict";
const mongoose = require("mongoose");
require("dotenv").config(); // Thêm dòng này để sử dụng dotenv

const connectString = process.env.MONGODB_URI; // Lấy chuỗi kết nối từ biến môi trường

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    if (!true) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }
    mongoose
      .connect(connectString)
      .then((_) => {
        console.log("Mongodb Connected");
      })
      .catch((err) => console.log("Error:: " + err));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
