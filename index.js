const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;
//middlewares
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://shareabite-db536.web.app",
      "https://shareabite-db536.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
const logger = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorize access" });
  }
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: "unauthorize access" });
      }
      req.user = decoded;
      next();
    });
  }
};

//API

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.ek5qasv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    };

    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "10h",
        });
        res.cookie("token", token, cookieOptions).send({ success: true });
      } catch (error) {
        console.error("Error generating token:", error);
        res
          .status(500)
          .send({ success: false, error: "Internal Server Error" });
      }
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    app.get("/available_food/highest_quantity", async (req, res) => {
      const data = await available_food_collection
        .find({ status: "available" })
        .sort({ quantity: -1 })
        .limit(6)
        .toArray();
      res.send(data);
    });
    app.post("/details/:id", logger, async (req, res) => {
      const id = req.params.id;
      const tokenEmail = req.user.email;
      const userEmail = req.body.email;
      if (tokenEmail !== userEmail) {
        return res.status(403).send({ message: "forbidden  access" });
      }
      const foodData = await available_food_collection.findOne({
        _id: new ObjectId(id),
      });
      res.send(foodData);
    });
    app.post("/add_food", logger, async (req, res) => {
      const tokenEmail = req.user.email;
      const userEmail = req.body.donatorEmail;
      if (tokenEmail !== userEmail) {
        return res.status(403).send({ message: "forbidden  access" });
      }
      const foodData = req.body;
      const result = await available_food_collection.insertOne(foodData);
      res.send(result);
    });
    app.post("/manage_post/:email", logger, async (req, res) => {
      const tokenEmail = req.user.email;
      const userEmail = req.body.email;
      if (tokenEmail !== userEmail) {
        return res.status(403).send({ message: "forbidden  access" });
      }
      const email = req.params.email;
      const data = await available_food_collection
        .find({ donatorEmail: email })
        .toArray();
      res.send(data);
    });
    app.get("/search_name/:foodName", async (req, res) => {
      const searchText = req.params.foodName;
      const data = await available_food_collection
        .find({
          foodName: { $regex: searchText, $options: "i" },
        })
        .toArray();
      res.send(data);
    });
    app.get("/sort_acceding", async (req, res) => {
      const data = await available_food_collection
        .find()
        .sort({ expiryDateTime: 1 })
        .toArray();
      res.send(data);
    });
    app.get("/sort_descending", async (req, res) => {
      const data = await available_food_collection
        .find()
        .sort({ expiryDateTime: -1 })
        .toArray();
      res.send(data);
    });

    app.delete("/delete/:id", logger, async (req, res) => {
      const id = req.params.id;
      const result = await available_food_collection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await available_food_collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });
    app.put("/update_request_data",logger, async (req, res) => {
      const data = req.body;
      const result = await available_food_collection.updateOne(
        { _id: new ObjectId(data.foodID) },
        { $set: data }
      );
      res.send(result);
    });
    app.get("/request_data/:email",logger, async (req, res) => {
      const email = req.params.email;
      const data = await available_food_collection
        .find({
          userEmail: email,
          status: "requested",
        })
        .toArray();
      res.send(data);
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
