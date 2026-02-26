import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [todayUsers, weekUsers, weekMatches, weekAccepted, weekThreads, recentAudit] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.match.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.match.count({ where: { status: "ACCEPTED", updatedAt: { gte: weekAgo } } }),
    prisma.chatThread.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { id: true, action: true, targetType: true, createdAt: true } }),
  ]);

  const daily = await prisma.$queryRaw<Array<{ day: Date; signups: bigint; matches: bigint }>>`
    SELECT date_trunc('day', d.day) as day,
      COALESCE(u.cnt,0) as signups,
      COALESCE(m.cnt,0) as matches
    FROM generate_series(${weekAgo}::timestamp, ${today}::timestamp, interval '1 day') AS d(day)
    LEFT JOIN (SELECT date_trunc('day', "createdAt") AS day, count(*) AS cnt FROM "User" WHERE "createdAt" >= ${weekAgo} GROUP BY 1) u ON u.day = date_trunc('day', d.day)
    LEFT JOIN (SELECT date_trunc('day', "createdAt") AS day, count(*) AS cnt FROM "Match" WHERE "createdAt" >= ${weekAgo} GROUP BY 1) m ON m.day = date_trunc('day', d.day)
    ORDER BY day ASC
  `;

  return { todayUsers, weekUsers, weekMatches, weekAccepted, weekThreads, recentAudit, daily };
}

export default async function AdminDashboardPage() {
  const data = await getStats();
  const maxY = Math.max(...data.daily.map((d) => Number(d.signups)), 1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["오늘 신규가입", data.todayUsers],
          ["7일 신규가입", data.weekUsers],
          ["7일 관심 전송", data.weekMatches],
          ["7일 수락", data.weekAccepted],
          ["7일 채팅 생성", data.weekThreads],
        ].map(([label, value]) => (
          <Card key={label as string}><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{label as string}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{value as number}</p></CardContent></Card>
        ))}
      </section>

      <Card>
        <CardHeader><CardTitle>일별 가입 추이 (최근 7일)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-52 items-end gap-4">
            {data.daily.map((d) => {
              const h = (Number(d.signups) / maxY) * 180;
              return (
                <div key={String(d.day)} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-xl bg-primary/80" style={{ height: `${Math.max(h, 6)}px` }} />
                  <p className="text-xs text-muted-foreground">{new Date(d.day).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>최근 활동 (Audit Log)</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.recentAudit.map((a) => (
              <li key={a.id} className="rounded-xl border p-3 text-sm">{a.action} · {a.targetType} · {new Date(a.createdAt).toLocaleString("ko-KR")}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
