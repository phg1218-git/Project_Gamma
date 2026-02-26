import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/status-badge";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const limit = 20;
  const q = params.q ?? "";
  const status = params.status;

  const where = {
    ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { profile: { nickname: { contains: q, mode: "insensitive" as const } } }] } : {}),
    ...(status ? { status: status as "ACTIVE" } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true, status: true, lastLoginAt: true, profile: { select: { nickname: true } }, _count: { select: { reportsReceived: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">유저 관리</CardTitle>
        <form className="grid gap-3 md:grid-cols-4">
          <Input name="q" defaultValue={q} placeholder="이메일/닉네임 검색" className="md:col-span-2" />
          <Input name="status" defaultValue={status} placeholder="ACTIVE/SUSPENDED/DELETED" />
          <Button type="submit">필터 적용</Button>
        </form>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-xl border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted">
              <TableRow>
                <TableHead>ID</TableHead><TableHead>이메일</TableHead><TableHead>닉네임</TableHead><TableHead>가입일</TableHead><TableHead>상태</TableHead><TableHead>신고수</TableHead><TableHead>최근 로그인</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell><Link className="text-primary underline" href={`/admin/users/${u.id}`}>{u.id.slice(0, 10)}</Link></TableCell>
                  <TableCell>{u.email ?? "-"}</TableCell>
                  <TableCell>{u.profile?.nickname ?? "-"}</TableCell>
                  <TableCell>{u.createdAt.toLocaleDateString("ko-KR")}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell>{u._count.reportsReceived}</TableCell>
                  <TableCell>{u.lastLoginAt ? u.lastLoginAt.toLocaleString("ko-KR") : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <p>총 {total}건 · {page}/{totalPages} 페이지</p>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href={`/admin/users?page=${Math.max(1, page - 1)}&q=${q}&status=${status ?? ""}`}>이전</Link></Button>
            <Button variant="outline" asChild><Link href={`/admin/users?page=${Math.min(totalPages, page + 1)}&q=${q}&status=${status ?? ""}`}>다음</Link></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
