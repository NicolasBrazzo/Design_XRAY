import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { analyzeUrl, AnalyzeError } from "../src/index.ts";
import type { AddressPolicy } from "../src/index.ts";
import { startGuardProxy } from "../src/network/guardProxy.ts";

// Two local servers: 127.0.0.1 plays the public site, 127.0.0.2 the internal network.
// The policy below blocks only 127.0.0.2, so the tests need no internet.

const INTERNAL_IP = "127.0.0.2";
const policy: AddressPolicy = (address) => address !== INTERNAL_IP;

let internalHits: string[] = [];
let internal: http.Server;
let site: http.Server;
let internalUrl: string;
let siteUrl: string;

function listen(server: http.Server, host: string) {
  return new Promise<string>((resolve) => {
    server.listen(0, host, () => {
      const { port } = server.address() as net.AddressInfo;
      resolve(`http://${host}:${port}`);
    });
  });
}

before(async () => {
  internal = http.createServer((req, res) => {
    internalHits.push(req.url ?? "");
    res.end("secret");
  });
  internalUrl = await listen(internal, INTERNAL_IP);

  site = http.createServer((req, res) => {
    if (req.url === "/redirect") {
      res.writeHead(302, { location: `${internalUrl}/secret` });
      return res.end();
    }
    res.setHeader("content-type", "text/html");
    if (req.url === "/image") {
      return res.end(`<body style="background: rgb(255, 0, 0)"><img src="${internalUrl}/image.png"></body>`);
    }
    res.end(`<body style="background: rgb(255, 0, 0)">ok</body>`);
  });
  siteUrl = await listen(site, "127.0.0.1");
});

after(() => {
  internal.close();
  site.close();
});

function rejectsWith(promise: Promise<unknown>, code: string) {
  return assert.rejects(promise, (error) => {
    assert.ok(error instanceof AnalyzeError);
    assert.equal(error.code, code);
    return true;
  });
}

test("an allowed page is analyzed through the proxy", async () => {
  const result = await analyzeUrl(`${siteUrl}/`, { isAllowedAddress: policy });
  assert.ok(result.backgrounds.some((entry) => entry.hex === "#ff0000"));
});

test("a page on a blocked address rejects with BLOCKED_URL", async () => {
  internalHits = [];
  await rejectsWith(analyzeUrl(`${internalUrl}/`, { isAllowedAddress: policy }), "BLOCKED_URL");
  assert.deepEqual(internalHits, []);
});

test("a redirect to a blocked address rejects with BLOCKED_URL", async () => {
  internalHits = [];
  await rejectsWith(analyzeUrl(`${siteUrl}/redirect`, { isAllowedAddress: policy }), "BLOCKED_URL");
  assert.deepEqual(internalHits, []);
});

test("a sub-resource on a blocked address is not loaded, the analysis goes on", async () => {
  internalHits = [];
  const result = await analyzeUrl(`${siteUrl}/image`, { isAllowedAddress: policy });
  assert.ok(result.backgrounds.some((entry) => entry.hex === "#ff0000"));
  assert.deepEqual(internalHits, []);
});

test("the default policy blocks localhost", async () => {
  await rejectsWith(analyzeUrl(`${siteUrl}/`), "BLOCKED_URL");
});

test("a CONNECT tunnel to a blocked address is refused with 403", async () => {
  const proxy = await startGuardProxy(policy);
  try {
    const { port } = new URL(proxy.server);
    const { port: internalPort } = new URL(internalUrl);
    const reply = await new Promise<string>((resolve, reject) => {
      const socket = net.connect(Number(port), "127.0.0.1", () => {
        socket.write(`CONNECT ${INTERNAL_IP}:${internalPort} HTTP/1.1\r\nHost: ${INTERNAL_IP}\r\n\r\n`);
      });
      socket.once("data", (data) => {
        resolve(data.toString());
        socket.destroy();
      });
      socket.once("error", reject);
    });
    assert.match(reply, /^HTTP\/1\.1 403/);
    assert.equal(proxy.failureFor(`https://${INTERNAL_IP}:${internalPort}/`), "BLOCKED_URL");
    assert.deepEqual(internalHits.length, 0);
  } finally {
    await proxy.close();
  }
});
