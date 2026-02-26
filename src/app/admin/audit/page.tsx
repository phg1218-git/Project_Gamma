import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const action = params.action;
  const logs = await prisma.auditLog.findMany({ where: action ? { action } : {}, take: 100, orderBy: { createdAt: "desc" }, include: { adminUser: { select: { email: true } } } });
  return <Card><CardHeader><CardTitle>감사 로그 (최근 100개)</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{logs.map((l)=><div key={l.id} className="rounded-xl border p-3"><p>{l.action} · {l.targetType}/{l.targetId}</p><p className="text-muted-foreground">{l.adminUser.email} · {l.createdAt.toLocaleString("ko-KR")}</p></div>)}</CardContent></Card>;
}
