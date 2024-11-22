FROM node:22.11.0 as cache

WORKDIR /app/server

COPY server/package.json .
COPY server/package-lock.json .

RUN npm ci

WORKDIR /app/client

COPY client/package.json .
COPY client/package-lock.json .

RUN npm ci

FROM cache as compiler

WORKDIR /app/server

COPY --from=cache /app/server/node_modules ./node_modules

COPY ../server .

RUN npm run compile

WORKDIR /app/client

COPY --from=cache /app/client/node_modules ./node_modules

COPY ../client .

RUN npm run build

FROM compiler as deps
WORKDIR /app/server

COPY server/package.json .
COPY server/package-lock.json .

RUN npm install --only=production

WORKDIR /app/client

COPY client/package.json .
COPY client/package-lock.json .

RUN npm install --only=production

FROM compiler as runtime
WORKDIR /app/client
COPY --from=compiler /app/client/dist ./dist
COPY --from=deps /app/client/node_modules ./node_modules


WORKDIR /app/server
COPY --from=compiler /app/server .
COPY --from=deps /app/server/node_modules ./node_modules

EXPOSE 8443

CMD ["npm", "run", "start"]
