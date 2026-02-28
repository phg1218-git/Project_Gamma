import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status;
  const reports = await prisma.report.findMany({ where: status ? { status: status as never } : {}, take: 50, orderBy: { createdAt: "desc" }, include: { reporter: { select: { email: true } }, reported: { select: { email: true } } } });
  const blocks = await prisma.block.findMany({ take: 20, orderBy: { createdAt: "desc" }, include: { blocker: { select: { email: true } }, blocked: { select: { email: true } } } });

  return <div className="space-y-6">
    <Card>
      <CardHeader className="sticky top-16 z-10 bg-card/95 backdrop-blur"><CardTitle>신고 관리</CardTitle><form className="flex flex-col gap-2 sm:flex-row"><Input name="status" defaultValue={status} placeholder="OPEN/IN_PROGRESS/RESOLVED" /><Button>필터</Button></form></CardHeader>
      <CardContent>
        <div className="space-y-3 md:hidden">
          {reports.map((r) => (
            <article key={r.id} className="rounded-xl border bg-background p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Link className="font-medium text-primary underline" href={`/admin/reports/${r.id}`}>{r.id.slice(0, 8)}</Link>
                <StatusBadge status={r.status} />
              </div>
              <p className="break-all text-xs text-muted-foreground">신고자: {r.reporter.email ?? "-"}</p>
              <p className="break-all text-xs text-muted-foreground">피신고자: {r.reported.email ?? "-"}</p>
              <p className="mt-2 text-xs">사유: {r.reason}</p>
              <p className="text-xs">일시: {r.createdAt.toLocaleDateString("ko-KR")}</p>
            </article>
          ))}
        </div>
        <div className="hidden overflow-auto rounded-xl border md:block"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Reporter</TableHead><TableHead>Reported</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader><TableBody>{reports.map((r)=><TableRow key={r.id}><TableCell><Link className="text-primary underline" href={`/admin/reports/${r.id}`}>{r.id.slice(0,8)}</Link></TableCell><TableCell className="max-w-[16rem] break-all">{r.reporter.email}</TableCell><TableCell className="max-w-[16rem] break-all">{r.reported.email}</TableCell><TableCell className="max-w-[18rem] break-words">{r.reason}</TableCell><TableCell><StatusBadge status={r.status} /></TableCell><TableCell>{r.createdAt.toLocaleDateString("ko-KR")}</TableCell></TableRow>)}</TableBody></Table></div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>차단 목록</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">{blocks.map((b)=><p key={b.id} className="break-all">{b.blocker.email} → {b.blocked.email} ({b.createdAt.toLocaleDateString("ko-KR")})</p>)}</CardContent>
    </Card>
  </div>;
}
