json2xml({
  opa: "value",
  krl: "deu certo",
  obj: {
    sera: "sim",
    ou: "nao"
  },
  agora: [
    {
      quero: "ver"
    },
    [
      "rapaz",
      {
        eu: "nao sei"
      }
    ],
    "hehe"
  ]
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
