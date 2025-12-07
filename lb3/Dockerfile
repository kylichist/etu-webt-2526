FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npm run build:gulp
RUN npm run build:webpack

EXPOSE 3000

CMD ["node", "server/index.js"]
