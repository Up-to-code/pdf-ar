import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  Clock,
  ExternalLink,
  FileText,
  Layout,
  Plus
} from "lucide-react";

import { AppShell } from "../../components/app-shell";
import { PageHeader } from "../../components/page-header";
import { projects, templates } from "../../data/catalog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const metrics = [
  { label: "القوالب المتاحة", value: templates.length, icon: Layout },
  { label: "إجمالي المشاريع", value: projects.length, icon: FileText },
  { label: "تم تصديره هذا الشهر", value: 12, icon: ArrowUpRight }
];

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="لوحة التحكم"
        title="أهلاً بك، أحمد"
        description="هنا يمكنك إدارة عروضك العقارية ومتابعة حالة المشاريع الحالية."
        actions={
          <Link className={cn(buttonVariants({ size: "lg" }), "gap-2")} href="/projects/demo-villa/editor">
            <Plus size={18} />
            إنشاء عرض جديد
          </Link>
        }
      />

      <section className="mb-6 grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label} className="border-surface-border-soft bg-white shadow-sm">
              <CardContent className="flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-lg bg-brand-accent-soft text-brand-accent">
                  <Icon size={22} />
                </div>
                <div className="grid gap-1">
                  <span className="text-sm font-semibold text-ink-muted">{metric.label}</span>
                  <strong className="text-3xl font-black text-brand-primary-dark">{metric.value}</strong>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-surface-border-soft bg-white shadow-sm">
        <CardHeader className="border-b border-surface-border-soft">
          <div>
            <CardTitle className="text-xl font-black">آخر المشاريع</CardTitle>
            <CardDescription>تعديل ومتابعة آخر العروض التي قمت بإنشائها</CardDescription>
          </div>
          <Link href="/projects" className={cn(buttonVariants({ variant: "outline" }), "gap-1")}>
            عرض كل المشاريع
            <ChevronLeft size={16} />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المشروع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-bold">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Clock size={14} />
                      {project.updatedAt}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`/projects/${project.id}/editor`}>
                        تعديل
                      </Link>
                      <Button variant="ghost" size="icon-sm" aria-label="فتح">
                        <ExternalLink size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
