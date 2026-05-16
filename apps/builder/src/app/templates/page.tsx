import Link from "next/link";
import { ArrowUpLeft, LayoutTemplate } from "lucide-react";

import { AppShell } from "../../components/app-shell";
import { PageHeader } from "../../components/page-header";
import { templates } from "../../data/catalog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getTemplatePageCount(template: (typeof templates)[number]) {
  return 1 + template.content.filter((block) => block.type === "PageBreak").length;
}

export default function TemplatesPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="القوالب"
        title="مكتبة قوالب العروض"
        description="اختر قالباً كبداية، ثم افتحه كنسخة قابلة للتعديل داخل الاستوديو."
      />

      <section className="grid grid-cols-3 gap-5 max-xl:grid-cols-2 max-md:grid-cols-1">
        {templates.map((template) => (
          <Card key={template.id} className="border-surface-border-soft bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-1">
                  <Badge variant="secondary" className="w-fit gap-1">
                    <LayoutTemplate size={12} />
                    قالب PDF
                  </Badge>
                  <CardTitle className="text-xl font-black">{template.name}</CardTitle>
                </div>
                <span className="rounded-full bg-brand-accent-soft px-2 py-1 text-[11px] font-black text-brand-accent">
                  {template.style?.density || "balanced"}
                </span>
              </div>
              <CardDescription className="leading-7">{template.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className={`template-preview template-preview--${template.id}`}>
                {template.content.slice(0, 6).map((block, index) => (
                  <span key={`${template.id}-${block.type}-${index}`} />
                ))}
              </div>
            </CardContent>

            <CardFooter className="justify-between gap-2 bg-muted/30">
              <div className="text-xs font-semibold text-muted-foreground">
                {getTemplatePageCount(template)} صفحة · {template.content.length} أقسام
              </div>
              <Link href={`/templates/${template.id}`} className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
                عرض القالب
                <ArrowUpLeft size={15} />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
