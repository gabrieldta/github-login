# github-login

This project is a api to :

- sign in on github for get user and cookies
- transform json on xml

###route /status GET
Simple health check, always return 200

###route /json-to-xml POST
You need to send a json on payload, so this api will return your json in xml format

###route /github-user-fetcher POST
This route will sign in on github and returns the username and cookies from home page
You need to send a json on payload in this format:

```javascript
{
"login": "foo@mail.com",
"password": "123pass"
}
```
