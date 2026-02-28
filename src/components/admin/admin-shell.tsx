import Link from "next/link";
import { LayoutDashboard, Users, HeartHandshake, ShieldAlert, ClipboardCheck, Settings, ScrollText, Menu } from "lucide-react";
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
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="관리자 메뉴">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {menu.map((m) => (
                  <DropdownMenuItem asChild key={m.href}>
                    <Link href={m.href} className="flex items-center gap-2">
                      <m.icon className="h-4 w-4" />
                      {m.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <h1 className="truncate text-lg font-semibold md:text-2xl">{title}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="max-w-[8rem] truncate">{userName ?? "관리자"}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <form action={async () => {"use server"; await signOut({ redirectTo: "/login" });}}>
                <DropdownMenuItem asChild><button className="w-full text-left">로그아웃</button></DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-7xl p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
