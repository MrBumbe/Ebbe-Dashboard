FROM node:22-alpine AS builder

WORKDIR /app
# Native build deps needed to compile better-sqlite3
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Copy migration SQL files — tsc only compiles .ts, not .sql
RUN cp -r src/db/migrations dist/db/

# --- Production image ---
FROM node:22-alpine

WORKDIR /app

# Native build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /data

EXPOSE 3000
CMD ["node", "dist/index.js"]
