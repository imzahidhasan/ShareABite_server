const express = require('express');
const app = express()
const cors = require('cors');
require("dotenv").config();
const port = process.env.PORT || 5000
//middlewares
app.use(
  cors({
    origin: ["http://localhost:5000"],
    credentials: true,
  })
);

//API

app.get('/', (req, res) => {
    res.send('this is a response form server')
})









app.listen(port, () => {
    console.log(`server is running at port ${port}`);
})