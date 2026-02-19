import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => req.cookies.get(name)?.value } }
  );

  const { data } = await supabase.auth.getUser();

  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(data.user ? "/dashboard" : "/login");
  }

  if (!data.user && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect("/login");
  }

  return res;
}

export const config = { matcher: ["/", "/dashboard/:path*"] };
