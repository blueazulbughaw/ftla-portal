import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap narrow section">
      <div className="block">
        <h1 className="h2">We couldn&apos;t find that page</h1>
        <p>
          <Link href="/">Back to the home page</Link>
        </p>
      </div>
    </main>
  );
}
