import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let ok = false;
  if (token && /^[\w-]{20,64}$/.test(token)) {
    try {
      const res = await db.update(subscribers).set({ status: "unsubscribed" }).where(eq(subscribers.token, token)).returning({ id: subscribers.id });
      ok = res.length > 0;
    } catch {
      ok = false;
    }
  }
  return (
    <section className="flex min-h-[80vh] items-center justify-center px-5 pt-32">
      <div className="bento-card max-w-md p-10 text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-silver-grad">{ok ? "You're unsubscribed" : "Link not valid"}</h1>
        <p className="mt-4 text-mute">{ok ? "We won't send you any more newsletters. Sorry to see you go!" : "This unsubscribe link is invalid or has already been used."}</p>
        <Link href="/" className="btn btn-primary mt-8">
          Back to home
        </Link>
      </div>
    </section>
  );
}
