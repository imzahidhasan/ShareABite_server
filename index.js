const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
//middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

//API

const uri =
  `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.ek5qasv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const available_food_collection = client
      .db("ShareABite")
      .collection("available_food");
    
    app.get("/available_food", async (req, res) => {
      const data = await available_food_collection.find().toArray()
      res.send(data)

    });
    app.get("/available_food/highest_quantity", async (req, res) => {
      const data = await available_food_collection
        .find()
        .sort({ quantity: -1 })
        .limit(6)
        .toArray();
      res.send(data)

    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("this is a response form server");
});

app.listen(port, () => {
  console.log(`server is running at port ${port}`);
});
