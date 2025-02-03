import express from "express";
import dbConnect from "./dbConfig/db.js";
import cookieParser from "cookie-parser"
import "dotenv/config";

import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import friendRoutes from "./routes/friend.route.js"

const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  return res.send("Hi!Welcome");
});

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/friend",friendRoutes);

dbConnect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port:${port}`);
    });
   
  })
  .catch((error) => {
    console.log(`Database Connection Faild:${error}`);
  });
