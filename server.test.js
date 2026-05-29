/**
 * Automated tests for the HTTP caching behaviour in server.js.
 *
 * Covers:
 *  1. First request returns 200 with ETag and Last-Modified headers.
 *  2. Second request with If-None-Match returns 304 with no body.
 *  3. Second request with If-Modified-Since (no If-None-Match) returns 304 when unchanged.
 *  4. Modified file returns 200 with updated headers.
 *
 * Uses only Node built-ins — no extra dependencies required.
 */

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const assert = require("assert");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(port, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: "127.0.0.1",
      port,
      path: options.path || "/test-cache-file.html",
      method: "GET",
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function startServer(siteDir) {
  return new Promise((resolve, reject) => {
    // Point the server at a temp site directory by temporarily overriding the
    // module's SITE_DIR isn't possible without refactoring, so we stand up a
    // minimal inline server that reuses the same serveFile logic.
    const { serveFile } = require("./server.js");

    const srv = http.createServer((req, res) => {
      const urlPath = req.url.split("?")[0] || "/";
      const filePath = path.join(siteDir, urlPath);
      serveFile(req, res, filePath);
    });

    srv.listen(0, "127.0.0.1", () => {
      resolve({ srv, port: srv.address().port });
    });
    srv.on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

async function runSuite() {
  // Create a temporary directory to act as the site root for tests.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "server-test-"));
  const testFile = path.join(tmpDir, "test-cache-file.html");
  fs.writeFileSync(testFile, "<html><body>hello</body></html>");

  const { srv, port } = await startServer(tmpDir);

  console.log("\nserver.js caching tests\n");

  // ------------------------------------------------------------------
  // Test 1: First request → 200 with ETag and Last-Modified
  // ------------------------------------------------------------------
  await test("first request returns 200 with ETag and Last-Modified headers", async () => {
    const res = await makeRequest(port);
    assert.strictEqual(res.statusCode, 200, `expected 200 but got ${res.statusCode}`);
    assert.ok(res.headers["etag"], "ETag header should be present");
    assert.ok(res.headers["last-modified"], "Last-Modified header should be present");
    assert.ok(res.body.length > 0, "response body should not be empty");
  });

  // ------------------------------------------------------------------
  // Test 2: If-None-Match matches ETag → 304 with no body
  // ------------------------------------------------------------------
  await test("request with matching If-None-Match returns 304 with no body", async () => {
    const first = await makeRequest(port);
    const etag = first.headers["etag"];
    assert.ok(etag, "ETag must be present on first request");

    const second = await makeRequest(port, {
      headers: { "if-none-match": etag },
    });
    assert.strictEqual(second.statusCode, 304, `expected 304 but got ${second.statusCode}`);
    assert.strictEqual(second.body.length, 0, "304 response must have no body");
  });

  // ------------------------------------------------------------------
  // Test 3: If-Modified-Since (no If-None-Match) → 304 when unchanged
  // ------------------------------------------------------------------
  await test("request with If-Modified-Since (no If-None-Match) returns 304 when file is unchanged", async () => {
    const first = await makeRequest(port);
    const lastModified = first.headers["last-modified"];
    assert.ok(lastModified, "Last-Modified must be present on first request");

    // Use a date slightly in the future so mtime <= since is satisfied.
    const future = new Date(new Date(lastModified).getTime() + 1000).toUTCString();

    const second = await makeRequest(port, {
      headers: { "if-modified-since": future },
    });
    assert.strictEqual(second.statusCode, 304, `expected 304 but got ${second.statusCode}`);
    assert.strictEqual(second.body.length, 0, "304 response must have no body");
  });

  // ------------------------------------------------------------------
  // Test 4: Modified file → 200 with updated headers
  // ------------------------------------------------------------------
  await test("modified file returns 200 with updated ETag and Last-Modified", async () => {
    const first = await makeRequest(port);
    const originalEtag = first.headers["etag"];
    const originalLastModified = first.headers["last-modified"];

    // Wait 1 s so the mtime changes noticeably on filesystems with 1-s resolution.
    await sleep(1100);
    fs.writeFileSync(testFile, "<html><body>updated content</body></html>");

    const second = await makeRequest(port, {
      headers: { "if-none-match": originalEtag },
    });

    assert.strictEqual(second.statusCode, 200, `expected 200 after modification but got ${second.statusCode}`);
    assert.ok(second.headers["etag"], "ETag should be present after modification");
    assert.notStrictEqual(
      second.headers["etag"],
      originalEtag,
      "ETag should change after the file is modified"
    );
    assert.notStrictEqual(
      second.headers["last-modified"],
      originalLastModified,
      "Last-Modified should change after the file is modified"
    );
    assert.ok(second.body.length > 0, "response body should not be empty on 200");
  });

  // ------------------------------------------------------------------
  // Teardown
  // ------------------------------------------------------------------
  await new Promise((resolve) => srv.close(resolve));
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runSuite().catch((err) => {
  console.error("Unexpected error running tests:", err);
  process.exitCode = 1;
});
