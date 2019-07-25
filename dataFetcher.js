const request = require("request");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
let iconv = require("iconv");
let charset = require("charset");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246",
  "Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
];

/**
 *
 * Identifies the charset and converts to utf8
 *
 * @param {*} response -> request response
 * @param {*} body -> request body
 * @returns encoded string
 */
function decodeResponseBody(response, body) {
  let finalBody = body;

  let c = charset(response.headers, body);

  if (!c) {
    let dom = new JSDOM(finalBody.toString("utf-8"));
    let metaCharset = dom.window.document.querySelector("meta[charset]");

    if (metaCharset && metaCharset.hasAttribute("charset")) {
      c = element.getAttribute("charset");
    } else {
      let metaContent = dom.window.document.querySelector(
        'head > meta[http-equiv="Content - Type"][content]'
      );

      if (metaContent && metaContent.hasAttribute("content")) {
        c = charset(
          {
            "Content-Type": metaContent.getAttribute("content")
          },
          body
        );
      }
    }
  }

  if (c) {
    try {
      finalBody = new iconv.Iconv(c, "utf-8").convert(body);
    } catch (e) {
      console.log(e);
    }
  }

  return finalBody.toString("utf-8");
}

module.exports = class DataFetcher {
  constructor() {
    this.cookies = "";
    this.userAgent = this.randUserAgent();
  }

  async loginOnGitHub(parameters) {
    let loginPageResponse = await this.fetchLoginPage();

    let sessionPage = await this.fetchValidateSessionPage(
      parameters,
      loginPageResponse
    );

    let homePage = await this.fetchHomePageLogged(sessionPage);
    let homePageCookies = this.getCookies(homePage.response);
    let user = this.scrapUser(homePage.body);

    return {
      user: user,
      cookies: homePageCookies
    };
  }

  async fetchLoginPage() {
    let options = this.computeOptions({
      method: "GET",
      url: "https://github.com/login"
    });

    return await this.fetchPage(options);
  }

  async fetchValidateSessionPage(parameters, loginPageResponse) {
    this.cookies = this.getCookies(loginPageResponse.response);
    let authToken = this.scrapToken(loginPageResponse.body);

    let headers = {
      "content-type": "application/x-www-form-urlencoded",
      cookie: this.cookies,
      host: "github.com",
      origin: "https://github.com",
      referer: "https://github.com/login"
    };

    let payload = "commit=Sign+in".concat(
      "&utf8=%E2%9C%93",
      "&authenticity_token=" + encodeURIComponent(authToken),
      "&login=" + encodeURIComponent(parameters.login),
      "&password=" + encodeURIComponent(parameters.password),
      "&webauthn-support=supported"
    );

    let options = this.computeOptions({
      request_parameters: {
        headers: headers,
        payload: payload,
        follow_redirect: false
      },
      method: "POST",
      url: "https://github.com/session"
    });

    return await this.fetchPage(options);
  }

  async fetchHomePageLogged(sessionPageResponse) {
    this.cookies += this.getCookies(sessionPageResponse.response);

    let headers = {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6",
      "Cache-Control": "max-age=0",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: this.cookies.replace("logged_in=no;", ""),
      Host: "github.com",
      Origin: "https://github.com",
      Referer: "https://github.com/login",
      "Upgrade-Insecure-Requests": "1"
    };

    let options = this.computeOptions({
      request_parameters: {
        headers: headers
      },
      method: "GET",
      url: "https://github.com/"
    });

    return await this.fetchPage(options);
  }

  getCookies(response) {
    let cookies = "";
    let headers = response.headers;
    for (let key in headers) {
      if (key == "set-cookie") {
        let cookiesHeaders = headers["set-cookie"];
        for (let i = 0; i < cookiesHeaders.length; i++) {
          let cookieHeader = cookiesHeaders[i];
          let cookieName = cookieHeader.split("=")[0].trim();

          let cookieValue;

          let x =
            cookieHeader.indexOf(cookieName + "=") + cookieName.length + 1;

          if (cookieHeader.includes(";")) {
            let y = cookieHeader.indexOf(";", x);

            cookieValue = cookieHeader.substring(x, y).trim();
          } else {
            cookieValue = cookieHeader.substring(x).trim();
          }

          cookies += cookieName + "=" + cookieValue + "; ";
        }
      }
    }

    return cookies;
  }

  scrapToken(body) {
    let token = null;
    let dom = new JSDOM(body.toString("utf-8"));
    let tokenElement = dom.window.document.querySelector(
      "input[name=authenticity_token]"
    );

    if (tokenElement && tokenElement.hasAttribute("value")) {
      token = tokenElement.getAttribute("value");
    }

    return token;
  }

  scrapUser(body) {
    let user = null;
    let dom = new JSDOM(body.toString("utf-8"));
    let userElement = dom.window.document.querySelector(
      "a.user-profile-link > strong"
    );

    if (userElement) {
      user = userElement.text;
    }

    return user;
  }

  async fetchPage(options) {
    return new Promise(function(resolve, reject) {
      console.log("Requesting " + options.url + " ...");
      request(options, function(err, response, body) {
        if (response) {
          console.log("STATUS " + response.statusCode);
        }

        if (err) {
          console.log("Error on access " + options.url);
          console.log(err.stack);
          reject(err);
        } else {
          console.log("Success on request " + options.url + " ...");
          resolve({
            response: response,
            body: decodeResponseBody(response, body)
          });
        }
      });
    });
  }

  /**
   * Compute all options of request, like headers, url and request type
   *
   * @param parameters -> all parameters sended of user
   */
  computeOptions(parameters) {
    let options = {
      timeout: 30000,
      headers: {},
      encoding: null,
      followAllRedirects: true,
      followRedirect: true,
      time: true
    };

    options.method = parameters.method;
    options.url = parameters.url;

    if (parameters.request_parameters) {
      let requestParameters = parameters.request_parameters;

      if (requestParameters.headers) {
        options.headers = JSON.parse(
          JSON.stringify(requestParameters.headers).toLowerCase()
        );
      }

      if (requestParameters.hasOwnProperty("follow_redirect")) {
        options.followRedirect = requestParameters.follow_redirect;
        options.followAllRedirects = requestParameters.follow_redirect;
      }

      if (requestParameters.payload) {
        options.body = requestParameters.payload;

        options.headers["content-length"] = Buffer.byteLength(
          requestParameters.payload
        );

        if (!options.headers["content-type"]) {
          console.log(
            "You need to send Content-Type in headers to identify the body content of this request."
          );
        }
      }
    }

    if (!options.headers.hasOwnProperty("accept")) {
      options.headers["accept"] = "*/*";
    } else if (options.headers["accept"] == "") {
      delete options.headers["accept"];
    }

    if (!options.headers.hasOwnProperty("user-agent")) {
      options.headers["user-agent"] = this.userAgent;
    } else if (options.headers["user-agent"] == "") {
      delete options.headers["user-agent"];
    }

    return options;
  }

  /**
   * Get rand user agent of array of user agents
   */
  randUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }
};
