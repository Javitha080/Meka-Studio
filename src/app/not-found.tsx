import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="label mb-4 !text-signal">Error 404 · Cut!</div>
      <h1 className="text-[clamp(60px,16vw,220px)] font-black uppercase leading-[0.85] tracking-[-0.05em] text-silver-grad">
        Lost frame
      </h1>
      <p className="mt-6 max-w-md text-mute">This scene didn&apos;t make the final edit.</p>
      <Link href="/" className="btn btn-primary mt-10">
        Back to the studio
      </Link>
    </main>
  );
}
