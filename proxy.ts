import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token =
    request.cookies.get("token")?.value ??
    request.headers.get("authorization")?.slice(7)

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as string

    if (pathname.startsWith("/cms") && role !== "ADMIN") {
      // Redirect to their proper dashboard if they try to access admin panel
      return NextResponse.redirect(new URL("/user", request.url))
    }

    if (pathname.startsWith("/user") && role !== "USER") {
      // Redirect to admin panel if they are admin but try to access user panel
      return NextResponse.redirect(new URL("/cms", request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/cms/:path*", "/user/:path*"],
}
