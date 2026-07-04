import Link from "next/link";

export default function EnglishNotFound() {
  return (
    <main className="shell pageShell">
      <div className="emptyState">
        <p className="eyebrow">Not Found</p>
        <h1>This page does not exist.</h1>
        <p className="muted">It may have expired, been revoked, or this browser may not have permission to access it.</p>
        <Link className="secondaryButton" href="/" prefetch={false}>
          中文
        </Link>
        <Link className="primaryButton" href="/en" prefetch={false}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
