const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Welcome to SecureCI! now using webhooks");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.get('/eval', (req, res) => {
    const input = req.query.input;
    const result = eval(input);
    res.send(result.toString());
});