import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDangerAction } from "@/components/admin/admin-danger-action";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id }, include: { reporter: { select: { id: true, email: true } }, reported: { select: { id: true, email: true } } } });
  if (!report) return notFound();

  return (
    <Card>
      <CardHeader><CardTitle>신고 상세</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>{report.reporter.email} → {report.reported.email}</p>
        <p>사유: {report.reason}</p>
        <p>상태: {report.status}</p>
        <pre className="rounded-xl bg-muted p-3 text-xs">{JSON.stringify(report.metadata ?? {}, null, 2)}</pre>
        <div className="flex flex-wrap gap-2">
          <AdminDangerAction label="진행중으로 변경" description="상태를 IN_PROGRESS로 변경" endpoint={`/api/admin/reports/${id}`} body={{ action: "mark_in_progress" }} />
          <AdminDangerAction label="해결 처리" description="상태를 RESOLVED로 변경" endpoint={`/api/admin/reports/${id}`} body={{ action: "resolve" }} />
          <AdminDangerAction label="피신고자 정지" description="피신고자 계정 정지" endpoint={`/api/admin/reports/${id}`} body={{ action: "suspend_reported" }} />
          <AdminDangerAction label="강제 차단 적용" description="신고자 기준 차단 적용" endpoint={`/api/admin/reports/${id}`} body={{ action: "force_block" }} />
        </div>
      </CardContent>
    </Card>
  );
}
