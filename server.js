const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT || "80", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(port, () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
