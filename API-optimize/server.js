
// includes
const express = require("express");
const PolycultureController = require("./lib/PolycultureController")

// define express
const app = express();
app.use("/polyculture", PolycultureController);

// helper
app.get("/", (req, res) => {
    res.send("The APIs are available at /polyculture");
});

// listen
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});
