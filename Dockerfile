FROM node:20-bookworm-slim AS base

ENV NODE_ENV=production
WORKDIR /app

FROM base AS builder

ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci --include=dev
RUN npm install --no-save esbuild@0.27.7

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM base AS runner

ENV PORT=3000
ENV JSONHERO_STORAGE_DIR=/data/documents

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs jsonhero \
  && mkdir -p /data/documents \
  && chown -R jsonhero:nodejs /app /data

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./package.json
RUN npm install --omit=dev --no-save lodash@4.17.21

USER jsonhero

EXPOSE 3000
VOLUME ["/data"]

CMD ["node", "./server/self-hosted-server.mjs"]
