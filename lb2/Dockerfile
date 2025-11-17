FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm clean-install

COPY . .

RUN mkdir -p public/covers data

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "app.js"]
