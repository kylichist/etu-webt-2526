# Multi-stage build for Stock Exchange application

# Stage 1: Build server
FROM node:20-alpine AS server-build

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/tsconfig.json server/nest-cli.json ./
COPY server/src ./src

RUN npm run build

# Stage 2: Build client
FROM node:20-alpine AS client-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/tsconfig.json client/tsconfig.node.json client/vite.config.ts client/index.html ./
COPY client/src ./src
COPY client/public ./public

RUN npm run build

# Stage 3: Production
FROM node:20-alpine

WORKDIR /app

# Install server production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

WORKDIR /app

# Copy built server
COPY --from=server-build /app/server/dist ./server/dist
COPY server/src ./server/src

# Copy built client
COPY --from=client-build /app/client/dist ./client/dist

# Copy data directory
COPY data ./data

# Expose ports
EXPOSE 3000

# Start server
CMD ["node", "server/dist/main"]
