import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getServerUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, name: true, image: true },
  });
}

export async function requireAdminPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/admin/forbidden");
  return user;
}

export async function requireAdminApi() {
  const user = await getServerUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export async function syncAdminRoleForEmail(userId: string, email?: string | null) {
  if (!email) return;
  if (!getAdminEmails().includes(email.toLowerCase())) return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN", status: "ACTIVE", suspendedAt: null },
  });
}

export async function writeAuditLog(params: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      adminUserId: params.adminUserId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
