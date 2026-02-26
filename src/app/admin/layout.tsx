import { requireAdminPage } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return <AdminShell title="Admin Console" userName={user.name}>{children}</AdminShell>;
}
