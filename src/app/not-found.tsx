import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell pageShell">
      <div className="emptyState">
        <p className="eyebrow">未找到内容</p>
        <h1>这个页面不存在。</h1>
        <p className="muted">它可能已经失效、被撤销，或者当前浏览器没有访问权限。</p>
        <Link className="secondaryButton" href="/en" prefetch={false}>
          English
        </Link>
        <Link className="primaryButton" href="/" prefetch={false}>
          返回首页
        </Link>
      </div>
    </main>
  );
}
