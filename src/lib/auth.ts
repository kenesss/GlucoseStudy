import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me"
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function createCuratorToken(curatorId: number): Promise<string> {
  return new SignJWT({ role: "curator", curatorId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { role: string; curatorId?: number };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (payload?.role !== "admin") return null;
  return payload;
}

export async function getCuratorSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("curator_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (payload?.role !== "curator" || !payload.curatorId) return null;
  return payload;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
