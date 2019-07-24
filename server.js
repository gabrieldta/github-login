const express = require("express"),
  compression = require("compression"),
  app = express();

const port = 3000;

app.use(compression());

app.listen(port, function() {
  console.log("Server is running in port " + port);
});

app.get("/status", function(req, res) {
  res.set("Connection", "closed");
  res.sendStatus(200);
});

app.get("/doc", function(req, res) {
  res.redirect(
    "https://github.com/gabrieldta/crawler-vagas/blob/master/README.md"
  );
});

app.post("/", function(req, res) {
  res.set("Accept-Encoding", "gzip");
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache");

  var body = req.body;

  var required = true;
  var missRequiredsMessage = [];

  if (body && !body.hasOwnProperty("username")) {
    missRequiredsMessage.push('"username"');
    required = false;
  }

  if (body && !body.hasOwnProperty("password")) {
    missRequiredsMessage.push('"password"');
    required = false;
  }

  if (required) {
    let response = {};

    console.log("Required parameters OK. Initiate process.");
  } else {
    let response = {
      msg: "Required parameters are not sended.",
      missing_parameters: missRequiredsMessage
    };

    console.log("Send response ...");

    res.set("Connection", "closed");
    res.sendStatus(422);
    res.send(response);
  }
});
