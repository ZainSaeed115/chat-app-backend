import mongoose from "mongoose";
import { DB_NAME } from "../constants/constants.js";

const dbConnect = async () => {
  try {
    
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URL}/${DB_NAME}`
    );
    console.log(
      `Database Successfully connected at Host:${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Database Connection Error:", error);
    process.exit(1);
  }
};

export default dbConnect;