# etu-webt-2526

Репозиторий с лабораторными работами по веб-технологиям.

## Проекты

### lb1
Первая лабораторная работа.

### lb2
Вторая лабораторная работа.

### lb3 - Админ-панель социальной сети
**Node.js + Express** веб-приложение для администрирования социальной сети.

**Технологии:**
- Node.js + Express
- Pug (шаблоны)
- Bootstrap + SCSS
- Gulp / Webpack
- JSON хранилище данных

**Запуск:**
```bash
cd lb3
npm install
npm start
```

Доступно на: http://localhost:3000

### lb4 - Пользовательское приложение социальной сети
**Angular 17+** полноценное пользовательское приложение с real-time обновлениями.

**Технологии:**
- Angular 17+ (Standalone components, Signals)
- Node.js + Express (Backend API)
- Socket.IO (WebSocket real-time)
- Bootstrap 5 + Bootstrap Icons
- TypeScript
- Jest (тестирование)

**Функциональность:**
- Регистрация пользователей
- Лента новостей с real-time обновлениями
- Создание постов
- Управление профилем и фото
- Управление друзьями
- WebSocket уведомления

**Запуск разработки:**
```bash
cd lb4
npm install
npm run dev  # Запускает backend + Angular dev server
```

**Запуск с Docker:**
```bash
# Из корня репозитория
docker-compose up --build
```

Приложения будут доступны:
- lb3 (админ): http://localhost:3000
- lb4 (пользовательское): http://localhost:3001

Подробнее см. [lb4/README_RU.md](lb4/README_RU.md)

## Docker Compose

Для запуска всей системы (lb3 + lb4) используйте docker-compose:

```bash
docker-compose up --build
```

Это поднимет оба контейнера с общим хранилищем данных.

## Структура

```
etu-webt-2526/
├── lb1/                    # Лабораторная работа 1
├── lb2/                    # Лабораторная работа 2
├── lb3/                    # Админ-панель (Node.js + Express + Pug)
├── lb4/                    # Пользовательское приложение (Angular 17+)
├── docker-compose.yml      # Docker Compose для lb3 + lb4
└── README.md              # Этот файл
```

## Лицензия

Учебный проект. Использование в образовательных целях.