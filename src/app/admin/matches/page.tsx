import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function AdminMatchesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const status = params.status;
  const where = status ? { status: status as never } : {};
  const matches = await prisma.match.findMany({ where, take: 50, orderBy: { createdAt: "desc" }, include: { sender: { select: { email: true } }, receiver: { select: { email: true } }, chatThread: { select: { id: true } } } });

  return (
    <Card>
      <CardHeader className="sticky top-16 z-10 bg-card/95 backdrop-blur">
        <CardTitle>매칭 관리</CardTitle>
        <form className="flex flex-col gap-2 sm:flex-row"><Input name="status" defaultValue={status} placeholder="PENDING/ACCEPTED/ENDED/ARCHIVED" /><Button type="submit">필터</Button></form>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3 md:hidden">
          {matches.map((m) => (
            <article key={m.id} className="rounded-xl border bg-background p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <Link className="font-medium text-primary underline" href={`/admin/matches/${m.id}`}>{m.id.slice(0, 10)}</Link>
                <StatusBadge status={m.status} />
              </div>
              <p className="break-all text-xs text-muted-foreground">보낸 사람: {m.sender.email ?? "-"}</p>
              <p className="break-all text-xs text-muted-foreground">받는 사람: {m.receiver.email ?? "-"}</p>
              <p className="mt-2 text-xs">생성일: {m.createdAt.toLocaleDateString("ko-KR")}</p>
              <p className="text-xs">{m.endedAt ? `종료 ${m.endedAt.toLocaleDateString("ko-KR")}` : m.archivedAt ? `보관 ${m.archivedAt.toLocaleDateString("ko-KR")}` : "-"}</p>
            </article>
          ))}
        </div>
        <div className="hidden overflow-auto rounded-xl border md:block">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Sender</TableHead><TableHead>Receiver</TableHead><TableHead>Status</TableHead><TableHead>생성일</TableHead><TableHead>종료/보관</TableHead></TableRow></TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell><Link className="text-primary underline" href={`/admin/matches/${m.id}`}>{m.id.slice(0, 10)}</Link></TableCell>
                  <TableCell className="max-w-[16rem] break-all">{m.sender.email}</TableCell><TableCell className="max-w-[16rem] break-all">{m.receiver.email}</TableCell>
                  <TableCell><StatusBadge status={m.status} /></TableCell>
                  <TableCell>{m.createdAt.toLocaleDateString("ko-KR")}</TableCell>
                  <TableCell>{m.endedAt ? `종료 ${m.endedAt.toLocaleDateString("ko-KR")}` : m.archivedAt ? `보관 ${m.archivedAt.toLocaleDateString("ko-KR")}` : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
