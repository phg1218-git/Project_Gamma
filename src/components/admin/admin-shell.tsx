import Link from "next/link";
import { LayoutDashboard, Users, HeartHandshake, ShieldAlert, ClipboardCheck, Settings, ScrollText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

const menu = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/matches", label: "Matches", icon: HeartHandshake },
  { href: "/admin/reports", label: "Reports", icon: ShieldAlert },
  { href: "/admin/review", label: "Review", icon: ClipboardCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
];

export function AdminShell({ title, userName, children }: { title: string; userName?: string | null; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 border-r bg-card p-4 lg:block">
        <h2 className="mb-6 text-xl font-semibold">Admin</h2>
        <nav className="space-y-1">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-muted">
              <m.icon className="h-4 w-4" />{m.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline">{userName ?? "관리자"}</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <form action={async () => {"use server"; await signOut({ redirectTo: "/login" });}}>
                <DropdownMenuItem asChild><button className="w-full text-left">로그아웃</button></DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-7xl p-6">{children}</main>
      </div>
    </div>
  );
}
