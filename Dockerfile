FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

COPY --from=builder /app/.output ./.output

EXPOSE 80

CMD ["node", ".output/server/index.mjs"]

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=80
ENV HOST=0.0.0.0
ENV PORT=80

COPY --from=builder /app/.output ./.output

EXPOSE 80

CMD ["node", ".output/server/index.mjs"]
