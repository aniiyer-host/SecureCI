const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Welcome to SecureCI! now using webhooks");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
