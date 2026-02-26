import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDangerAction } from "@/components/admin/admin-danger-action";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({ where: { id }, include: { sender: { select: { email: true } }, receiver: { select: { email: true } }, chatThread: { select: { id: true } } } });
  if (!match) return notFound();
  const retentionDate = new Date((match.endedAt ?? match.archivedAt ?? new Date()).getTime() + 1000 * 60 * 60 * 24 * 30);

  return (
    <Card>
      <CardHeader><CardTitle>매칭 상세</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>상태: {match.status}</p><p>{match.sender.email} ↔ {match.receiver.email}</p><p>threadId: {match.chatThread?.id ?? "-"}</p><p>종료 사유: {match.endedReason ?? "-"}</p><p>삭제 예정일: {retentionDate.toLocaleDateString("ko-KR")}</p>
        <div className="flex gap-2">
          <AdminDangerAction label="강제 종료" description="매칭과 채팅을 종료합니다." endpoint={`/api/admin/matches/${id}`} body={{ action: "force_end" }} />
          <AdminDangerAction label="아카이브" description="유저 화면에서 숨기고 보관합니다." endpoint={`/api/admin/matches/${id}`} body={{ action: "archive" }} />
        </div>
      </CardContent>
    </Card>
  );
}
