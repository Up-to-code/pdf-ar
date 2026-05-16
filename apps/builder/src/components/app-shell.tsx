"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { 
  LayoutDashboard, 
  Files, 
  Layers, 
  Brush, 
  Settings,
  CircleCheckBig,
  UserCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/templates", label: "القوالب", icon: Layers },
  { href: "/projects", label: "المشاريع", icon: Files },
  { href: "/projects/demo-villa/editor", label: "الاستوديو", icon: Brush }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen grid-cols-[280px_minmax(0,1fr)] bg-[#f4f7f8] max-lg:grid-cols-1">
      <aside className="sticky top-0 flex h-screen flex-col gap-8 border-l border-white/10 bg-[#0a3d49] p-6 text-white max-lg:hidden">
        <Link href="/dashboard" className="grid gap-1">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#be6429]">PDF-AR</span>
          <strong className="text-xl font-black tracking-tight">استوديو العروض</strong>
        </Link>
        
        <nav className="grid gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/62 transition-colors hover:bg-white/8 hover:text-white",
                  isActive && "bg-white/12 text-white shadow-sm"
                )}
              >
                <Icon size={20} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Card className="mt-auto border-white/10 bg-white/8 text-white ring-white/10">
          <CardContent className="grid gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
              <CircleCheckBig size={16} className="text-emerald-400" />
              حالة النظام
            </div>
            <Badge className="w-fit bg-white text-[#0a3d49] hover:bg-white">جاهز للتصدير</Badge>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 border-t border-white/10 pt-5">
          <Avatar size="lg" className="bg-white/10">
            <AvatarFallback className="bg-white/10 text-white">
              <UserCircle size={22} />
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-sm font-bold text-white">أحمد منصور</strong>
            <span className="text-xs text-white/45">مسؤول النظام</span>
          </div>
          <Settings size={18} className="mr-auto text-white/40" />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-[1440px] px-8 py-9 max-md:px-4">{children}</main>
    </div>
  );
}
