const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const SITE_DIR = path.join(__dirname, "site");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function resolve(urlPath, res) {
  const target = path.join(SITE_DIR, urlPath);

  fs.stat(target, (err, stat) => {
    if (!err && stat.isFile()) {
      return serveFile(res, target);
    }

    if (!err && stat.isDirectory()) {
      const indexPath = path.join(target, "index.html");
      return fs.access(indexPath, fs.constants.F_OK, (err2) => {
        if (!err2) {
          serveFile(res, indexPath);
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        }
      });
    }

    if (path.extname(urlPath) === "") {
      const stripped = urlPath.replace(/\/+$/, "");
      const indexPath = path.join(SITE_DIR, stripped, "index.html");
      return fs.access(indexPath, fs.constants.F_OK, (err2) => {
        if (!err2) {
          serveFile(res, indexPath);
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        }
      });
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0] || "/";
  resolve(urlPath, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`myteamkickoff.com preview server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving files from: ${SITE_DIR}`);
});
