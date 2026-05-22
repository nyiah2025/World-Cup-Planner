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
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function tryPaths(candidates, res) {
  const [first, ...rest] = candidates;
  if (!first) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }
  fs.access(first, fs.constants.F_OK, (err) => {
    if (err) {
      tryPaths(rest, res);
    } else {
      serveFile(res, first);
    }
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  const candidates = [];

  const direct = path.join(SITE_DIR, urlPath);
  candidates.push(direct);

  if (!path.extname(urlPath)) {
    candidates.push(path.join(SITE_DIR, urlPath, "index.html"));
    candidates.push(path.join(SITE_DIR, urlPath.replace(/\/$/, ""), "index.html"));
  }

  if (urlPath === "/" || urlPath === "") {
    candidates.unshift(path.join(SITE_DIR, "index.html"));
  }

  tryPaths(candidates, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`myteamkickoff.com preview server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving files from: ${SITE_DIR}`);
});
