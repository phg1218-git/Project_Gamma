import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDangerAction } from "@/components/admin/admin-danger-action";

export default async function ReviewPage() {
  const queue = await prisma.profileReview.findMany({ where: { status: "PENDING" }, take: 50, orderBy: { createdAt: "asc" }, include: { user: { select: { email: true } } } });
  if (!queue.length) {
    return <Card><CardContent className="p-10 text-center"><p className="text-lg font-semibold">검수 대기 항목이 없습니다</p><p className="text-sm text-muted-foreground">새로운 프로필/사진 검수 요청이 들어오면 이곳에 표시됩니다.</p></CardContent></Card>;
  }
  return <Card><CardHeader><CardTitle>검수 큐</CardTitle></CardHeader><CardContent className="space-y-3">{queue.map((q)=><div key={q.id} className="rounded-xl border p-3 text-sm"><p>{q.user.email} · {q.type}</p><div className="mt-2 flex gap-2"><AdminDangerAction label="승인" description="검수 승인" endpoint={`/api/admin/review/${q.id}`} body={{ action: "approve" }} /><AdminDangerAction label="반려" description="검수 반려" endpoint={`/api/admin/review/${q.id}`} body={{ action: "reject" }} /></div></div>)}</CardContent></Card>;
}
