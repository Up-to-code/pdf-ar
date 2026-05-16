import Link from "next/link";
import { ArrowRight, Copy, Sparkles } from "lucide-react";

import { AppShell } from "../../../components/app-shell";
import { getTemplate } from "../../../data/catalog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const blockLabels: Record<string, string> = {
  CoverImage: "صورة الغلاف",
  Title: "عنوان العقار",
  Price: "السعر",
  Location: "الموقع",
  DetailsGrid: "شبكة التفاصيل",
  Description: "الوصف",
  Features: "المميزات",
  ContactCard: "بيانات التواصل",
  Gallery: "معرض الصور",
  PageBreak: "صفحة جديدة"
};

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = getTemplate(id);
  const palette = template.style?.palette;
  const editorHref = `/projects/demo-villa/editor?template=${template.id}`;
  const pageCount = 1 + template.content.filter((block) => block.type === "PageBreak").length;

  return (
    <AppShell>
      <article className="grid gap-6">
        <section className="grid grid-cols-[minmax(0,1fr)_420px] gap-6 max-xl:grid-cols-1">
          <Card className="border-surface-border-soft bg-white shadow-sm">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">قالب جاهز للاستخدام</Badge>
              <CardTitle className="text-4xl font-black tracking-tight max-md:text-3xl">{template.name}</CardTitle>
              <CardDescription className="max-w-2xl text-base leading-8">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="flex flex-wrap gap-2">
                <Link className={cn(buttonVariants({ size: "lg" }), "gap-2")} href={`${editorHref}&mode=copy`}>
                  <Copy size={17} />
                  استخدام كنسخة
                </Link>
                <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")} href={`${editorHref}&mode=inspired`}>
                  <Sparkles size={17} />
                  افتح كإلهام
                </Link>
                <Link className={buttonVariants({ variant: "ghost", size: "lg" })} href="/templates">
                  كل القوالب
                </Link>
              </div>

              <Separator />

              <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2">
                {[
                  ["كثافة المحتوى", template.style?.density || "balanced"],
                  ["نمط الغلاف", template.style?.coverMode || "large"],
                  ["التفاصيل", template.style?.detailsStyle || "cards"],
                  ["الخط", template.style?.typography || "classic"],
                  ["عدد الصفحات", `${pageCount}`]
                ].map(([label, value]) => (
                  <Card key={label} className="bg-muted/35" size="sm">
                    <CardContent className="grid gap-1">
                      <span className="text-xs font-bold text-muted-foreground">{label}</span>
                      <strong className="text-sm text-brand-primary-dark">{value}</strong>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {palette ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(palette).map(([name, color]) => (
                    <span
                      key={name}
                      className="size-9 rounded-full border border-black/10"
                      title={`${name}: ${color}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-surface-border-soft bg-white shadow-sm">
            <CardContent>
              <div className="template-showcase rounded-xl">
                <div className={`template-preview template-preview--large template-preview--${template.id}`}>
                  {template.content.slice(0, 7).map((block, index) => (
                    <span key={`${template.id}-${block.type}-${index}`} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-surface-border-soft bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-black">README القالب</CardTitle>
            <CardDescription>
              هذا القالب مصمم لعروض العقار العربية الجاهزة للإرسال للعميل. افتحه كنسخة لتعديل النصوص والصور وQR داخل PDF Studio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {template.content.map((block, index) => (
              <div
                key={`${block.type}-${index}`}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-surface-border-soft bg-muted/25 p-3"
              >
                <span className="grid size-8 place-items-center rounded-md bg-brand-accent-soft text-sm font-black text-brand-accent">
                  {index + 1}
                </span>
                <strong>{blockLabels[block.type] || block.type}</strong>
                <Badge variant="outline" className="gap-1">
                  {block.type}
                  <ArrowRight size={12} />
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </article>
    </AppShell>
  );
}
