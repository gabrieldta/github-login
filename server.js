const dataFetcher = require("./dataFetcher.js");
const bodyParser = require("body-parser");
const express = require("express"),
  compression = require("compression"),
  app = express();

const port = 5000;

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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

app.post("/github-user-fetcher", async function(req, res) {
  res.set("Accept-Encoding", "gzip");
  res.set("Content-Type", "application/json");
  res.set("Cache-Control", "no-cache");

  console.log("Receiving request on route /github-user-fetcher.");

  var body = req.body;

  var required = true;
  var missRequiredsMessage = [];

  if (body && !body.hasOwnProperty("login")) {
    missRequiredsMessage.push("login");
    required = false;
  }

  if (body && !body.hasOwnProperty("password")) {
    missRequiredsMessage.push("password");
    required = false;
  }

  if (required) {
    console.log("Required parameters OK. Initiate process.");

    let response = await new dataFetcher().loginOnGitHub(body);
    console.log("Sending response on route /github-user-fetcher.");
    res.send(response);
  } else {
    let response = {
      msg: "Required parameters are not sended.",
      missing_parameters: missRequiredsMessage
    };

    console.log("Sending response on route /github-user-fetcher.");

    res.set("Connection", "closed");
    res.status(422);
    res.send(response);
  }
});

app.post("/json-to-xml", async function(req, res) {
  res.set("Accept-Encoding", "gzip");
  res.set("Content-Type", "text/xml");
  res.set("Cache-Control", "no-cache");

  console.log("Receiving request on route /json-to-xml.");

  let xml = await json2xml(req.body);

  console.log("Sending response on route /json-to-xml.");

  res.send(xml);
});

async function json2xml(json) {
  let xml = '<?xml version="1.0" ?>';

  let parseObject = async function(node, xml, parentKey) {
    if (parentKey) {
      xml += "<" + parentKey + ">";
    }

    for (let key in node) {
      let value = node[key];

      if (Array.isArray(value)) {
        xml = await parseArray(value, key, xml);
      } else if (typeof value === "object") {
        xml = await parseObject(value, xml, key);
      } else {
        xml += "<" + key + ">";
        xml += value;
        xml += "</" + key + ">";
      }
    }

    if (parentKey) {
      xml += "</" + parentKey + ">";
    }

    return xml;
  };

  let parseArray = async function(array, key, xml) {
    for (var i = 0; i < array.length; i++) {
      if (Array.isArray(array[i])) {
        xml = await parseArray(array[i], key, xml);
      } else if (typeof array[i] === "object") {
        xml = await parseObject(array[i], xml, key);
      } else {
        xml += "<" + key + ">";
        xml += array[i];
        xml += "</" + key + ">";
      }
    }

    return xml;
  };

  let a = await parseObject(json, xml); // fire up the parser!
  console.log(a);
  return a;
}
