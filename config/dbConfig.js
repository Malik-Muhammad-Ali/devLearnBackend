const mongoose = require("mongoose");

const uri = "mongodb+srv://muhammadali:AliXGoku@cluster0.agnol.mongodb.net/devLearnDB?retryWrites=true&w=majority&appName=Cluster0";
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