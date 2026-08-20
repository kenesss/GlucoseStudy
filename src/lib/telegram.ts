export async function sendTelegramMessage(
  chatId: string | number,
  text: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export function getTelegramBotUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME || "GlucoseStudyBot";
}

export function buildTelegramDeepLink(code: string): string {
  const username = getTelegramBotUsername().replace(/^@/, "");
  return `https://t.me/${username}?start=${code}`;
}
