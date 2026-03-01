const express = require("express");
const compression = require("compression");
const next = require("next");

const port = parseInt(process.env.PORT || "80", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(compression({ level: 6, threshold: 1024 }));

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
