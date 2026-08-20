export async function sendOtpEmail(
  to: string,
  code: string
): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;

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
      subject: "Код для входа — GlucoseOnline",
      html: `
        <p>Ваш код для входа на платформу обучения кураторов:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p style="color: #666;">Код действителен 5 минут.</p>
      `,
    });
    return true;
  } catch {
    return false;
  }
}
