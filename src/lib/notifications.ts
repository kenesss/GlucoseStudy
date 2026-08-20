interface ApplicationData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  streamName: string;
  testScore?: number;
}

export async function sendTelegramNotification(data: ApplicationData) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const text = [
    "🎓 *Новая заявка на доступ куратора*",
    "",
    `👤 *Имя:* ${data.firstName} ${data.lastName}`,
    `📱 *Телефон:* ${data.phone}`,
    `📧 *Email:* ${data.email}`,
    `📚 *Поток:* ${data.streamName}`,
    data.testScore !== undefined ? `✅ *Результат теста:* ${data.testScore}%` : "",
    "",
    `_Заявка из learn.glucoseonline.kz_`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendEmailNotification(data: ApplicationData) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!host || !user || !pass || !to) return false;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user,
      to,
      subject: `Новая заявка куратора: ${data.firstName} ${data.lastName}`,
      html: `
        <h2>Новая заявка на доступ куратора</h2>
        <p><strong>Имя:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Поток:</strong> ${data.streamName}</p>
        ${data.testScore !== undefined ? `<p><strong>Результат теста:</strong> ${data.testScore}%</p>` : ""}
      `,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendEscalationNotification(
  question: string,
  contact?: { email?: string; phone?: string }
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const text = [
    "❓ *Вопрос от куратора (бот не смог ответить)*",
    "",
    question,
    "",
    contact?.email ? `📧 ${contact.email}` : "",
    contact?.phone ? `📱 ${contact.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyApplication(data: ApplicationData) {
  const results = await Promise.allSettled([
    sendTelegramNotification(data),
    sendEmailNotification(data),
  ]);
  return results.some(
    (r) => r.status === "fulfilled" && r.value === true
  );
}
