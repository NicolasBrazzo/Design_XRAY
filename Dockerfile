# One service: Express serves both the API and the built client.
# The official Playwright image already has Chromium and the system libraries it needs.
# Its version must match the "playwright" package in engine/package.json, or the engine
# looks for a Chromium build that is not there (error BROWSER_MISSING).
FROM mcr.microsoft.com/playwright:v1.65.0-noble

WORKDIR /app

# Dependencies first: these layers are cached until a package.json changes.
COPY engine/package.json engine/package-lock.json engine/
RUN cd engine && npm ci --omit=dev

COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev

COPY client/package.json client/package-lock.json client/
RUN cd client && npm ci

COPY engine/ engine/
COPY server/ server/
COPY client/ client/

# The client is only needed as static files: build it, then drop its build tools.
RUN cd client && npm run build && rm -rf node_modules

ENV NODE_ENV=production
ENV PORT=3000
# Railway (and Render) put a proxy in front of the app: one hop to trust for the client IP.
ENV TRUST_PROXY=1

EXPOSE 3000

# Chromium does not need root: the image ships an unprivileged user for it.
USER pwuser

CMD ["node", "server/index.js"]
