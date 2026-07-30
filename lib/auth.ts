import { SignJWT, jwtVerify } from "jose"

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

export interface JwtPayload {
  userId: number
  email: string
  role: "ADMIN" | "USER"
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyToken(
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
