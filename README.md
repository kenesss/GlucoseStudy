# GlucoseOnline — Платформа обучения кураторов

Сайт-тренажёр для автоматического обучения новых кураторов работе с admin.glucoseonline.kz.

## Возможности

### Для куратора
- Видео-уроки по разделам админки (YouTube/Vimeo/прямая ссылка)
- Тесты после уроков с настраиваемым проходным баллом
- FAQ с поиском и фильтрацией
- Чат-бот на базе Claude API (RAG из FAQ и материалов уроков)
- Форма заявки на доступ после успешного прохождения
- Отслеживание прогресса через email/телефон + OTP

### Для администратора (`/admin`)
- Управление уроками, темами, тестами, FAQ
- База знаний для чат-бота
- Журнал заявок с изменением статуса
- Настройки: порядок уроков, режим тестов, проходной балл

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env из примера
cp .env.example .env

# 3. Инициализировать БД и загрузить демо-данные
npm run db:setup

# 4. Запустить dev-сервер
npm run dev
```

Откройте http://localhost:3000 — публичная часть  
Админка: http://localhost:3000/admin/login

**Логин по умолчанию:** `admin` / `change-me-in-production`

## Вход через Telegram

Куратор входит по номеру телефона. OTP-код приходит в Telegram после привязки аккаунта.

### Настройка бота

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Добавьте в `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_BOT_USERNAME=YourBotUsername
   ```
3. Зарегистрируйте webhook (нужен HTTPS в production):
   ```bash
   chmod +x scripts/setup-telegram-webhook.sh
   ./scripts/setup-telegram-webhook.sh https://learn.glucoseonline.kz
   ```

### Как работает привязка

1. Куратор вводит телефон → «Получить код»
2. Если Telegram не привязан — открывается диплинк `t.me/Bot?start=<code>`
3. Куратор нажимает **Start** в боте → `chat_id` сохраняется
4. На сайте — «Я привязал — получить код» → OTP приходит в Telegram

**Fallback:** вход по email через SMTP (если настроен).

## Настройка уведомлений

В файле `.env`:

```env
# Telegram (рекомендуется)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app_password
NOTIFICATION_EMAIL=admin@glucoseonline.kz

# Чат-бот (Claude API)
ANTHROPIC_API_KEY=sk-ant-...
```

Без API-ключа Claude чат-бот работает в упрощённом режиме (поиск по FAQ).

## OTP в dev-режиме

В development-код OTP показывается прямо на экране после запроса — SMS/email не отправляются.

## Деплой

Подходит Vercel, Render или любой VPS с Node.js 18+.

```bash
npm run build
npm start
```

Для production рекомендуется PostgreSQL — измените `provider` в `prisma/schema.prisma` на `postgresql` и укажите `DATABASE_URL`.

Поддомен: `learn.glucoseonline.kz`

## Стек

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **БД:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **AI:** Anthropic Claude API
- **Уведомления:** Telegram Bot API, Nodemailer

## Структура

```
src/
├── app/                  # Страницы и API
│   ├── page.tsx          # Главная
│   ├── learn/            # Обучение
│   ├── test/             # Тесты
│   ├── faq/              # FAQ
│   ├── chat/             # Чат-бот
│   ├── apply/            # Заявка
│   ├── admin/            # Админ-панель
│   └── api/              # API routes
├── components/           # UI-компоненты
└── lib/                  # Утилиты, auth, notifications
```

## Цветовая палитра

- Основной: `#033726`
- Акцент: `#a3e635`
- Фон: `#f8faf9`
