import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (["active", "accepted", "matched", "open", "approved"].includes(s)) return <Badge variant="default">{status}</Badge>;
  if (["pending", "in_progress"].includes(s)) return <Badge variant="secondary">{status}</Badge>;
  if (["suspended", "deleted", "rejected", "ended", "archived", "resolved", "closed"].includes(s)) return <Badge variant="outline">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}
