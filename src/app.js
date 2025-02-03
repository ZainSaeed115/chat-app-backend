import express from "express";
import dbConnect from "./dbConfig/db.js";
import cookieParser from "cookie-parser"
import "dotenv/config";

import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js"
import {
  createUser,
  createGroupChat,
  createSingleChat,
  createMessage,
  createMessageInChat
} from "./seeders/user.js";
const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  return res.send("Hi!Welcome");
});

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/chat", chatRoutes);

dbConnect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port:${port}`);
    });
   
  })
  .catch((error) => {
    console.log(`Database Connection Faild:${error}`);
  });
