import connectDB from "./databse.mjs";

const connectWithRetry = async () => {
  let retries = 5;

  while (retries) {
    try {
      await connectDB();
      break;
    } catch (err) {
      console.log(`🔁 Retry MongoDB connection... (${retries})`);
      retries -= 1;
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};

export default connectWithRetry;
