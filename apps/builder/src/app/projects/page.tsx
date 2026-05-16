import Link from "next/link";
import { Clock, FileText, FolderOpen } from "lucide-react";

import { AppShell } from "../../components/app-shell";
import { PageHeader } from "../../components/page-header";
import { projects } from "../../data/catalog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

export default function ProjectsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="المشاريع"
        title="عروض العقارات"
        description="مشاريع محفوظة محلياً في نسخة MVP، مع قابلية نقلها لاحقاً إلى قاعدة بيانات."
        actions={
          <Link className={cn(buttonVariants({ variant: "outline" }), "gap-2")} href="/templates">
            <FolderOpen size={17} />
            اختر قالباً
          </Link>
        }
      />

      <Card className="border-surface-border-soft bg-white shadow-sm">
        <CardHeader className="border-b border-surface-border-soft">
          <div>
            <CardTitle className="text-xl font-black">قائمة المشاريع</CardTitle>
            <CardDescription>افتح أي مشروع لمتابعة تحرير قالب PDF الخاص به.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم العرض</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead className="text-end">الاستوديو</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-lg bg-brand-accent-soft text-brand-accent">
                        <FileText size={17} />
                      </div>
                      <span className="font-bold">{project.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Clock size={14} />
                      {project.updatedAt}
                    </span>
                  </TableCell>
                  <TableCell className="text-end">
                    <Link className={buttonVariants({ size: "sm" })} href={`/projects/${project.id}/editor`}>
                      فتح الاستوديو
                    </Link>
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
