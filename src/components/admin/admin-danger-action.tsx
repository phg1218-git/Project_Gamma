"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AdminDangerAction({
  label,
  description,
  endpoint,
  method = "PATCH",
  body,
}: {
  label: string;
  description: string;
  endpoint: string;
  method?: "PATCH" | "POST" | "DELETE";
  body?: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function onConfirm() {
    setLoading(true);
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, reason }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      window.location.reload();
      return;
    }
    alert("작업에 실패했습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label} 확인</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm">사유(선택)</p>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="운영 사유를 남겨주세요" />
          <Button variant="destructive" className="w-full" disabled={loading} onClick={onConfirm}>
            {loading ? "처리 중..." : "확인 후 실행"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
