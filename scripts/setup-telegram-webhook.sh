#!/usr/bin/env bash
# Register Telegram webhook for OTP bot
# Usage: ./scripts/setup-telegram-webhook.sh https://learn.glucoseonline.kz

set -euo pipefail

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

BASE_URL="${1:-${NEXT_PUBLIC_APP_URL:-http://localhost:3000}}"
WEBHOOK_URL="${BASE_URL%/}/api/telegram/webhook"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN is not set in .env"
  exit 1
fi

echo "Setting webhook to: $WEBHOOK_URL"

curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}" | python3 -m json.tool

echo ""
echo "Webhook info:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool
