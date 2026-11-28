import http from "node:http";
import net from "node:net";
import type { Duplex } from "node:stream";
import {
  BlockedAddressError,
  isPublicAddress,
  resolveAllowed,
  type AddressPolicy,
} from "./addresses.ts";

// Every request Chromium makes goes through this proxy: the page, redirects, images, scripts,
// fetch, iframes, WebSockets (tunnelled with CONNECT). For each one the proxy resolves the
// host, checks the addresses and connects to the address it checked. Chromium never resolves
// names itself, so a redirect or a DNS answer that changes (rebinding) can't reach the
// internal network.
//
// page.route() is not enough: Playwright calls the handler only for the first URL of a
// redirect chain, so "public page → 302 → http://127.0.0.1" would pass.

/** Why the proxy refused a host. */
export type ProxyFailure = "BLOCKED_URL" | "NAME_NOT_RESOLVED";

export interface GuardProxy {
  /** Proxy address for Playwright's `proxy.server` option. */
  server: string;
  /** Why requests to the host and port of `url` were refused, if they were. */
  failureFor(url: string): ProxyFailure | undefined;
  close(): Promise<void>;
}

// Hop-by-hop headers describe one connection (browser → proxy), not the request: never forwarded.
const HOP_BY_HOP = [
  "connection",
  "proxy-connection",
  "keep-alive",
  "proxy-authorization",
  "proxy-authenticate",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

const DEFAULT_PORTS: Record<string, number> = { "http:": 80, "ws:": 80, "https:": 443, "wss:": 443 };

function hostKey(host: string, port: number) {
  return `${host.replace(/^\[(.*)\]$/, "$1").toLowerCase()}:${port}`;
}

function withoutHopByHop<T extends Record<string, unknown>>(headers: T): T {
  const copy = { ...headers };
  for (const name of HOP_BY_HOP) delete copy[name];
  return copy;
}

export async function startGuardProxy(
  isAllowed: AddressPolicy = isPublicAddress,
): Promise<GuardProxy> {
  const failures = new Map<string, ProxyFailure>();
  const tunnels = new Set<Duplex>();

  /** Resolves and checks a host; on failure records why and returns undefined. */
  async function connectTarget(host: string, port: number) {
    try {
      const [first] = await resolveAllowed(host, isAllowed);
      return first;
    } catch (error) {
      failures.set(
        hostKey(host, port),
        error instanceof BlockedAddressError ? "BLOCKED_URL" : "NAME_NOT_RESOLVED",
      );
      return undefined;
    }
  }

  // Plain HTTP: the browser sends the absolute URL ("GET http://host/path").
  const server = http.createServer(async (req, res) => {
    let target: URL;
    try {
      target = new URL(req.url ?? "");
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (target.protocol !== "http:") {
      res.writeHead(400).end();
      return;
    }

    const port = Number(target.port) || 80;
    const address = await connectTarget(target.hostname, port);
    if (!address) {
      res.writeHead(failures.get(hostKey(target.hostname, port)) === "BLOCKED_URL" ? 403 : 502);
      res.end();
      return;
    }

    const upstream = http.request({
      host: address.address,
      family: address.family,
      port,
      method: req.method,
      path: target.pathname + target.search,
      headers: withoutHopByHop(req.headers),
    });
    upstream.on("response", (response) => {
      res.writeHead(response.statusCode ?? 502, response.statusMessage, withoutHopByHop(response.headers));
      response.pipe(res);
    });
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  });

  // HTTPS and WebSockets: the browser asks for a TCP tunnel ("CONNECT host:443").
  server.on("connect", async (req: http.IncomingMessage, client: Duplex, head: Buffer) => {
    tunnels.add(client);
    client.on("close", () => tunnels.delete(client));
    client.on("error", () => client.destroy());

    const match = /^(.+):(\d+)$/.exec(req.url ?? "");
    if (!match) {
      client.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }
    const host = match[1];
    const port = Number(match[2]);

    const address = await connectTarget(host, port);
    if (!address) {
      const blocked = failures.get(hostKey(host, port)) === "BLOCKED_URL";
      client.end(blocked ? "HTTP/1.1 403 Forbidden\r\n\r\n" : "HTTP/1.1 502 Bad Gateway\r\n\r\n");
      return;
    }

    const upstream = net.connect({ host: address.address, family: address.family, port }, () => {
      client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      if (head.length > 0) upstream.write(head);
      upstream.pipe(client);
      client.pipe(upstream);
    });
    tunnels.add(upstream);
    upstream.on("close", () => {
      tunnels.delete(upstream);
      client.destroy();
    });
    upstream.on("error", () => upstream.destroy());
    client.on("close", () => upstream.destroy());
  });

  // Chromium tunnels WebSockets with CONNECT: an HTTP upgrade here is unexpected.
  server.on("upgrade", (_req, socket: Duplex) => socket.destroy());

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as net.AddressInfo;

  return {
    server: `http://127.0.0.1:${port}`,
    failureFor(url) {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return undefined;
      }
      const targetPort = Number(parsed.port) || DEFAULT_PORTS[parsed.protocol];
      if (!targetPort) return undefined;
      return failures.get(hostKey(parsed.hostname, targetPort));
    },
    async close() {
      for (const socket of tunnels) socket.destroy();
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
