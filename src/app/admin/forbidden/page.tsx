import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <ShieldX className="h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-semibold">403 접근 권한 없음</h1>
          <p className="text-sm text-muted-foreground">관리자 권한이 필요한 페이지입니다.</p>
          <Button asChild><Link href="/">홈으로 이동</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
