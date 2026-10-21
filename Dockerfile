FROM oven/bun:1 AS builder

WORKDIR /app

ENV NITRO_PRESET=node-server

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=80
ENV HOST=0.0.0.0
ENV PORT=80

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 80

CMD ["bun", ".output/server/index.mjs"]
