import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://basil59mutuku_db_user:VihQecKQPc47QuFW@shinestar.pdolmw4.mongodb.net/inventory?appName=shinestar";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] connected -> ${uri}`);
}
