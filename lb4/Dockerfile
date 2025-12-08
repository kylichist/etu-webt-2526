# Stage 1: Build Angular приложения
FROM node:22-alpine AS angular-build

WORKDIR /app

# Копируем package files и устанавливаем зависимости
COPY package.json package-lock.json* ./
RUN npm ci

# Копируем исходные файлы Angular
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src ./src

# Собираем Angular приложение для production
RUN npm run build

# Stage 2: Production сервер
FROM node:22-alpine

WORKDIR /app

# Копируем package files и устанавливаем только production зависимости
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Копируем серверный код
COPY server ./server

# Копируем собранное Angular приложение из предыдущего stage
COPY --from=angular-build /app/dist/social-app/browser ./dist

# Создаем директорию для uploads
RUN mkdir -p uploads

# Открываем порты
EXPOSE 3001
EXPOSE 4200

# Запускаем backend сервер
CMD ["node", "server/index.js"]
