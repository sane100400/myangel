const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const compression = require("compression");

const port = parseInt(process.env.PORT || "80", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

const compress = compression({ level: 6, threshold: 1024 });

app.prepare().then(() => {
  createServer((req, res) => {
    compress(req, res, () => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });
  }).listen(port, () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
