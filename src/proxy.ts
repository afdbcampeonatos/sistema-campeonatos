import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Verificar se há token de sessão nas cookies
  // NextAuth 5 beta pode usar diferentes nomes de cookie dependendo da configuração
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  // Rotas públicas (não precisam de autenticação)
  // - /campeonatos (página pública para listar campeonatos)
  // - /campeonatos/[slug] (página de inscrição pública)
  const isPublicPath =
    pathname === "/campeonatos" ||
    (pathname.startsWith("/campeonatos/") && pathname !== "/campeonatos");

  // Se for rota pública, permitir acesso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Rotas que precisam de autenticação
  // - /admin/* (todo o sistema administrativo, incluindo match-runner)
  const isProtectedPath = pathname.startsWith("/admin");

  // Se a rota é protegida e não há token de sessão, redirecionar para login
  if (isProtectedPath && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/campeonatos/:path*", "/login"],
};
