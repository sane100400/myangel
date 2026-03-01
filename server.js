const { createServer } = require("http");
const { parse } = require("url");
const { createGzip } = require("zlib");
const next = require("next");

const port = parseInt(process.env.PORT || "80", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

const COMPRESSIBLE = /^(text\/|application\/javascript|application\/json|image\/svg)/;

app.prepare().then(() => {
  createServer((req, res) => {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    if (!acceptEncoding.includes("gzip")) {
      return handle(req, res, parse(req.url, true));
    }

    // Wrap response to intercept writes and compress
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);
    const origWriteHead = res.writeHead.bind(res);

    let compress = false;
    let headSent = false;
    let gzip = null;

    res.writeHead = function (statusCode, statusMessage, headers) {
      // Normalize arguments
      if (typeof statusMessage === "object") {
        headers = statusMessage;
        statusMessage = undefined;
      }

      const ct = res.getHeader("content-type") || (headers && (headers["content-type"] || headers["Content-Type"])) || "";
      if (COMPRESSIBLE.test(ct)) {
        compress = true;
        gzip = createGzip({ level: 6 });

        res.removeHeader("content-length");
        res.removeHeader("Content-Length");
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Transfer-Encoding", "chunked");

        // Remove content-length from headers arg too
        if (headers) {
          delete headers["content-length"];
          delete headers["Content-Length"];
        }

        gzip.on("data", (chunk) => origWrite(chunk));
        gzip.on("end", () => origEnd());
      }

      headSent = true;
      if (statusMessage !== undefined) {
        return origWriteHead(statusCode, statusMessage, headers);
      }
      return origWriteHead(statusCode, headers);
    };

    res.write = function (chunk, encoding, callback) {
      if (!headSent) {
        // Force writeHead if not yet called
        res.writeHead(res.statusCode);
      }
      if (compress && gzip) {
        return gzip.write(chunk, encoding, callback);
      }
      return origWrite(chunk, encoding, callback);
    };

    res.end = function (chunk, encoding, callback) {
      if (!headSent) {
        res.writeHead(res.statusCode);
      }
      if (compress && gzip) {
        if (chunk) gzip.write(chunk, encoding);
        return gzip.end(callback);
      }
      return origEnd(chunk, encoding, callback);
    };

    handle(req, res, parse(req.url, true));
  }).listen(port, () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
