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
      <CardHeader><CardTitle>신고 관리</CardTitle><form className="flex gap-2"><Input name="status" defaultValue={status} placeholder="OPEN/IN_PROGRESS/RESOLVED" /><Button>필터</Button></form></CardHeader>
      <CardContent><div className="overflow-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Reporter</TableHead><TableHead>Reported</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader><TableBody>{reports.map((r)=><TableRow key={r.id}><TableCell><Link className="text-primary underline" href={`/admin/reports/${r.id}`}>{r.id.slice(0,8)}</Link></TableCell><TableCell>{r.reporter.email}</TableCell><TableCell>{r.reported.email}</TableCell><TableCell>{r.reason}</TableCell><TableCell><StatusBadge status={r.status} /></TableCell><TableCell>{r.createdAt.toLocaleDateString("ko-KR")}</TableCell></TableRow>)}</TableBody></Table></div></CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>차단 목록</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">{blocks.map((b)=><p key={b.id}>{b.blocker.email} → {b.blocked.email} ({b.createdAt.toLocaleDateString("ko-KR")})</p>)}</CardContent>
    </Card>
  </div>;
}
