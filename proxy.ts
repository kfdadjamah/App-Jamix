import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const urlConnexion = new URL("/connexion", req.nextUrl.origin);
    return NextResponse.redirect(urlConnexion);
  }
});

export const config = {
  matcher: ["/mon-bar/:path*", "/mes-annonces/:path*", "/mon-compte/:path*"],
};
