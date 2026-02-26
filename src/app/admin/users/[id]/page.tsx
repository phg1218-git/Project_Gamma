import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminDangerAction } from "@/components/admin/admin-danger-action";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      sentMatches: { take: 10, orderBy: { createdAt: "desc" } },
      reportsReceived: { take: 10, orderBy: { createdAt: "desc" } },
      blocksReceived: { take: 10, orderBy: { createdAt: "desc" }, include: { blocker: { select: { email: true } } } },
    },
  });
  if (!user) return notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>유저 요약</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm"><p>이메일: {user.email ?? "-"}</p><p>닉네임: {user.profile?.nickname ?? "-"}</p><p>가입일: {user.createdAt.toLocaleString("ko-KR")}</p><StatusBadge status={user.status} /></div>
          <div className="flex flex-wrap gap-2">
            {user.status !== "SUSPENDED" && <AdminDangerAction label="계정 정지" description="해당 계정을 정지합니다." endpoint={`/api/admin/users/${id}`} body={{ action: "suspend" }} />}
            {user.status === "SUSPENDED" && <AdminDangerAction label="계정 정지 해제" description="정지를 해제합니다." endpoint={`/api/admin/users/${id}`} body={{ action: "unsuspend" }} />}
            <AdminDangerAction label="소프트 삭제" description="해당 계정을 삭제 상태로 전환합니다." endpoint={`/api/admin/users/${id}`} body={{ action: "soft_delete" }} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="matches">Matches</TabsTrigger><TabsTrigger value="reports">Reports</TabsTrigger><TabsTrigger value="blocks">Blocks</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger></TabsList>
        <TabsContent value="overview"><Card><CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm"><p>role: {user.role}</p><p>status: {user.status}</p><p>lastLogin: {user.lastLoginAt?.toLocaleString("ko-KR") ?? "-"}</p><p>suspendedAt: {user.suspendedAt?.toLocaleString("ko-KR") ?? "-"}</p></CardContent></Card></TabsContent>
        <TabsContent value="matches"><Card><CardContent className="space-y-2 pt-6 text-sm">{user.sentMatches.map((m) => <p key={m.id}>{m.id.slice(0, 8)} · {m.status} · {m.createdAt.toLocaleDateString("ko-KR")}</p>)}</CardContent></Card></TabsContent>
        <TabsContent value="reports"><Card><CardContent className="space-y-2 pt-6 text-sm">{user.reportsReceived.map((r) => <p key={r.id}>{r.reason} · {r.status}</p>)}</CardContent></Card></TabsContent>
        <TabsContent value="blocks"><Card><CardContent className="space-y-2 pt-6 text-sm">{user.blocksReceived.map((b) => <p key={b.id}>{b.blocker.email ?? "unknown"} · {b.createdAt.toLocaleDateString("ko-KR")}</p>)}</CardContent></Card></TabsContent>
        <TabsContent value="notes"><Card><CardContent className="pt-6 text-sm text-muted-foreground">MVP에서는 별도 노트 저장 없이 Audit Log를 참고합니다.</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
