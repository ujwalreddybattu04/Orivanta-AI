FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Development
FROM base AS dev
CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
# Accept the backend URL at build time so Next.js can bake it in
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Cloud Run injects PORT env var; Next.js defaults to 3000
ENV PORT=3000
EXPOSE ${PORT}

CMD ["npm", "start"]
