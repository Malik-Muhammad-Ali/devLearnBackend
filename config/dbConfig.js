const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

const connect = async () => {
  try {
    const conn = await mongoose.connect(uri, clientOptions);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connect;