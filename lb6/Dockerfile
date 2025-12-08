FROM node:22-alpine

# Backend
WORKDIR /app/server

COPY server/package*.json ./

RUN npm ci

COPY server/ .

RUN npm run build

# Frontend
WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client/ .

RUN npm run build

# Final
WORKDIR /app

EXPOSE 8000

CMD ["node", "server/dist/main.js"]
