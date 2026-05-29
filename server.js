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
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// Matches fingerprinted filenames: basename.8hexchars.ext
const FINGERPRINTED_RE = /^.+\.[0-9a-f]{8}\.(css|js)$/;

function getCacheControl(ext, basename) {
  // Fingerprinted assets have content-based hashes in their filename, so they
  // are safe to cache forever — the URL changes whenever the content changes.
  if (FINGERPRINTED_RE.test(basename)) {
    return "public, max-age=31536000, immutable";
  }
  if ([".png", ".webp", ".jpg", ".woff", ".woff2", ".js"].includes(ext)) {
    return "public, max-age=31536000, immutable";
  }
  if (ext === ".css") {
    return "public, max-age=86400";
  }
  if (ext === ".html") {
    return "no-cache";
  }
  return "public, max-age=3600";
}

function serveFile(req, res, filePath) {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.stat(filePath, (statErr, stat) => {
    if (statErr) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const mtime = stat.mtime;
    const etag = `"${mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;
    const lastModified = mtime.toUTCString();

    const ifNoneMatch = req.headers["if-none-match"];
    const ifModifiedSince = req.headers["if-modified-since"];

    if (ifNoneMatch && ifNoneMatch === etag) {
      res.writeHead(304);
      res.end();
      return;
    }

    if (!ifNoneMatch && ifModifiedSince) {
      const since = new Date(ifModifiedSince);
      if (!isNaN(since) && mtime <= since) {
        res.writeHead(304);
        res.end();
        return;
      }
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": getCacheControl(ext, basename),
        "ETag": etag,
        "Last-Modified": lastModified,
      });
      res.end(data);
    });
  });
}

function resolve(req, res, urlPath) {
  const target = path.join(SITE_DIR, urlPath);

  fs.stat(target, (err, stat) => {
    if (!err && stat.isFile()) {
      return serveFile(req, res, target);
    }

    if (!err && stat.isDirectory()) {
      const indexPath = path.join(target, "index.html");
      return fs.access(indexPath, fs.constants.F_OK, (err2) => {
        if (!err2) {
          serveFile(req, res, indexPath);
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
          serveFile(req, res, indexPath);
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
  resolve(req, res, urlPath);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`myteamkickoff.com preview server running on http://0.0.0.0:${PORT}`);
  console.log(`Serving files from: ${SITE_DIR}`);
});
