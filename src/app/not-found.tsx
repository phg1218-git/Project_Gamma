import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card-romantic max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold text-gradient-pink mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-6">요청하신 페이지를 찾을 수 없습니다.</p>
        <Link href="/" className="btn-gradient inline-block">홈으로 이동</Link>
      </div>
    </main>
  );
}
