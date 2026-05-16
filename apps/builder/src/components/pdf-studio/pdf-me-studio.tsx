"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { Designer } from "@pdfme/ui";
import type { Font, Schema, Template } from "@pdfme/common";
import type { PropertyData } from "@pdf-ar/pdf-engine";
import {
  AlignRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  FileJson,
  FilePlus2,
  Image as ImageIcon,
  Layers,
  Loader2,
  Maximize2,
  Minus,
  ArrowLeft,
  QrCode,
  RectangleHorizontal,
  Save,
  Trash2,
  Type,
  Upload,
  ZoomIn,
  ZoomOut,
  MousePointer2,
  RefreshCw,
  PlusCircle,
  Undo2,
  Settings2,
  Database,
  Box,
  LayoutTemplate
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { sampleProperty } from "../../data/catalog";
import { buildPdfmeInputs, preparePdfmeTemplateForExport } from "../../lib/pdfme/export";
import { pdfmePlugins } from "../../lib/pdfme/plugins";
import {
  cloneTemplate,
  createPdfmeFont,
  createPdfmePresets,
  type StudioElementType,
  type StudioSchema
} from "../../lib/pdfme/templates";
import { usePdfStudioStore } from "../../store/pdf-studio-store";

const elementTools: Array<{ type: StudioElementType; label: string; icon: typeof Type }> = [
  { type: "text", label: "نص", icon: Type },
  { type: "image", label: "صورة", icon: ImageIcon },
  { type: "rectangle", label: "مستطيل", icon: RectangleHorizontal },
  { type: "ellipse", label: "دائرة", icon: Circle },
  { type: "line", label: "خط", icon: Minus },
  { type: "qrcode", label: "QR", icon: QrCode }
];

const minZoomLevel = 0.5;
const maxZoomLevel = 2;
const zoomStep = 0.1;
const fitWidthZoomLevel = 0.92;

export function PdfMeStudio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const designerRef = useRef<Designer | null>(null);
  const designerChangeRef = useRef(false);
  const fontRef = useRef<Font | null>(null);
  const appliedRouteTemplateRef = useRef<string | null>(null);
  const propertyFileRef = useRef<HTMLInputElement>(null);
  const templateFileRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [isDesignerReady, setIsDesignerReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(fitWidthZoomLevel);
  const {
    template,
    property,
    selectedName,
    currentPage,
    status,
    setTemplate,
    setProperty,
    setSelectedName,
    setCurrentPage,
    setStatus,
    resetTemplate,
    addElement,
    updateSelectedSchema,
    deleteSelectedSchema,
    addPage,
    removeCurrentPage,
    applyPropertyToTemplate
  } = usePdfStudioStore();

  const presets = useMemo(() => createPdfmePresets(property), [property]);
  const routeTemplateId = searchParams.get("template");
  const selectedSchema = useMemo(() => findSchema(template, selectedName), [template, selectedName]);
  const currentPageSchemas = template.schemas[currentPage] || [];
  const hasRenderableTemplate = useMemo(() => hasPageSchemas(template), [template]);

  useEffect(() => {
    if (!routeTemplateId || appliedRouteTemplateRef.current === routeTemplateId) return;
    const preset = presets.find((item) => item.id === routeTemplateId);
    if (!preset) return;

    appliedRouteTemplateRef.current = routeTemplateId;
    commitTemplate(cloneTemplate(preset.template), "تم فتح نسخة قابلة للتحرير من القالب");
    setSelectedName("propertyTitle");
    setCurrentPage(0);
    window.setTimeout(() => centerCanvas(), 140);
  }, [routeTemplateId, presets]);

  useEffect(() => {
    if (hasRenderableTemplate) return;
    resetTemplate();
  }, [hasRenderableTemplate, resetTemplate]);

  useEffect(() => {
    let mounted = true;

    async function mountDesigner() {
      if (!containerRef.current || designerRef.current) return;
      const [{ Designer: PdfDesigner }, font] = await Promise.all([import("@pdfme/ui"), loadStudioFont()]);
      if (!mounted || !containerRef.current) return;
      fontRef.current = font;

      const designer = new PdfDesigner({
        domContainer: containerRef.current,
        template,
        plugins: pdfmePlugins,
        options: {
          lang: "ar",
          font,
          sidebarOpen: false,
          zoomLevel: fitWidthZoomLevel,
          theme: {
            token: {
              colorPrimary: "#0f4f5f",
              colorPrimaryBg: "#e7f0f2",
              borderRadius: 8
            }
          }
        }
      });

      designer.onChangeTemplate((nextTemplate) => {
        designerChangeRef.current = true;
        setTemplate(nextTemplate);
        window.setTimeout(() => {
          designerChangeRef.current = false;
        }, 0);
      });

      designer.onPageChange(({ currentPage: nextPage }) => {
        setCurrentPage(Math.max(0, nextPage - 1));
      });

      designer.onSaveTemplate((nextTemplate) => {
        setTemplate(nextTemplate);
        setStatus("تم حفظ القالب داخل الاستوديو");
      });

      designerRef.current = designer;
      setZoomLevel(fitWidthZoomLevel);
      setIsDesignerReady(true);
      window.setTimeout(() => centerCanvas(), 120);
    }

    void mountDesigner();

    return () => {
      mounted = false;
      designerRef.current?.destroy();
      designerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!designerRef.current || designerChangeRef.current) return;
    designerRef.current.updateTemplate(template);
  }, [template]);

  function commitTemplate(nextTemplate: Template, nextStatus: string) {
    setTemplate(nextTemplate);
    setStatus(nextStatus);
  }

  function selectPreset(presetId: string) {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    commitTemplate(cloneTemplate(preset.template), "تم تطبيق نمط قالب جديد");
  }

  function updateZoom(nextZoom: number, nextStatus?: string) {
    const normalizedZoom = Math.min(maxZoomLevel, Math.max(minZoomLevel, Number(nextZoom.toFixed(2))));
    setZoomLevel(normalizedZoom);

    if (designerRef.current) {
      designerRef.current.updateOptions({
        ...designerRef.current.getOptions(),
        zoomLevel: normalizedZoom
      });
    }

    if (nextStatus) setStatus(nextStatus);
    window.setTimeout(() => centerCanvas(), 80);
  }

  function getCanvasScroller() {
    if (!containerRef.current) return null;
    const candidates = [
      containerRef.current,
      ...Array.from(containerRef.current.querySelectorAll<HTMLElement>("div"))
    ];

    return (
      candidates.find((element) => element.scrollWidth > element.clientWidth + 40) ||
      containerRef.current
    );
  }

  function centerCanvas() {
    const scroller = getCanvasScroller();
    if (!scroller) return;
    scroller.scrollLeft = Math.max(0, (scroller.scrollWidth - scroller.clientWidth) / 2);
  }

  function panCanvas(delta: number) {
    const scroller = getCanvasScroller();
    if (!scroller) return;
    scroller.scrollBy({ left: delta, behavior: "smooth" });
    setStatus(delta < 0 ? "تم تحريك اللوحة لليسار" : "تم تحريك اللوحة لليمين");
  }

  function getLiveTemplate() {
    const liveTemplate = designerRef.current?.getTemplate();
    return (liveTemplate ? liveTemplate : template) as Template;
  }

  async function exportPdf() {
    setIsExporting(true);
    setStatus("جاري تصدير PDF...");

    try {
      const { generate } = await import("@pdfme/generator");
      const font = fontRef.current || (await loadStudioFont());
      const liveTemplate = getLiveTemplate();
      const exportTemplate = await preparePdfmeTemplateForExport(liveTemplate);
      const inputs = buildPdfmeInputs(exportTemplate);
      fontRef.current = font;
      setTemplate(liveTemplate);
      const pdf = await generate({
        template: exportTemplate,
        inputs,
        plugins: pdfmePlugins,
        options: {
          font,
          lang: "ar",
          title: property.title,
          creator: "PDF-AR Studio"
        }
      });
      const blob = new Blob([pdf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeFileName(property.title)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("تم تصدير PDF بنجاح");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "فشل تصدير PDF");
    } finally {
      setIsExporting(false);
    }
  }

  function saveTemplateFile() {
    const liveTemplate = getLiveTemplate();
    setTemplate(liveTemplate);
    const blob = new Blob([JSON.stringify(liveTemplate, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(property.title)}-template.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("تم حفظ ملف القالب");
  }

  async function importPropertyFile(file?: File) {
    if (!file) return;
    const raw = await file.text();

    try {
      const parsed = JSON.parse(raw) as unknown;
      const response = await fetch("/api/property/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const body = (await response.json()) as { property?: PropertyData; details?: string; error?: string };

      if (!response.ok || !body.property) {
        throw new Error(body.details || body.error || "بيانات العقار غير صالحة");
      }

      applyPropertyToTemplate(body.property);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر استيراد بيانات العقار");
    }
  }

  async function importTemplateFile(file?: File) {
    if (!file) return;
    const raw = await file.text();

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isPdfmeTemplate(parsed)) throw new Error("ملف القالب غير صالح");
      commitTemplate(parsed, "تم استيراد القالب");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر استيراد القالب");
    }
  }

  function resetPropertyData() {
    setProperty(sampleProperty);
    applyPropertyToTemplate(sampleProperty);
  }

  return (
    <main className="pdf-builder" dir="rtl">
      <header className="pdf-builder__topbar">
        <div className="pdf-builder__identity">
          <Link href="/dashboard" className="icon-button" aria-label="العودة">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span>PDF-AR Studio</span>
            <strong>{property.title}</strong>
          </div>
        </div>

        <div className="page-controls">
          <Button variant="ghost" size="sm" className="h-9 gap-2 px-3" onClick={addPage}>
            <PlusCircle size={16} />
            <span>صفحة جديدة</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-9 gap-2 px-3 text-destructive hover:text-destructive" onClick={removeCurrentPage}>
            <Trash2 size={16} />
            <span>حذف الصفحة</span>
          </Button>
          <span className="status-pill">
            صفحة {currentPage + 1} / {template.schemas.length}
          </span>
          <div className="zoom-controls">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => panCanvas(-180)}>
              <ChevronLeft size={15} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateZoom(zoomLevel - zoomStep)}>
              <ZoomOut size={15} />
            </Button>
            <span className="zoom-chip">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateZoom(zoomLevel + zoomStep)}>
              <ZoomIn size={15} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateZoom(1)}>
              <Undo2 size={15} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateZoom(fitWidthZoomLevel)}>
              <Maximize2 size={15} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => centerCanvas()}>
              <ArrowLeftRight size={15} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => panCanvas(180)}>
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>

        <div className="studio-actions">
          <span className="status-pill">{isExporting ? "تصدير..." : status}</span>
          <Button variant="secondary" className="h-10 gap-2" onClick={saveTemplateFile}>
            <Save size={16} />
            حفظ القالب
          </Button>
          <Button className="h-10 gap-2" onClick={() => void exportPdf()} disabled={isExporting}>
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            تصدير PDF
          </Button>
        </div>
      </header>

      <section className="pdf-builder__workspace">
        <aside className="builder-panel builder-panel--left w-80">
          <Tabs defaultValue="elements" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-surface-alt h-14 p-1.5 gap-1">
              <TabsTrigger value="elements" className="gap-2 h-full text-xs">
                <Box size={14} />
                <span>عناصر</span>
              </TabsTrigger>
              <TabsTrigger value="presets" className="gap-2 h-full text-xs">
                <LayoutTemplate size={14} />
                <span>أنماط</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="gap-2 h-full text-xs">
                <Upload size={14} />
                <span>استيراد</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="elements" className="m-0 p-4">
                <div className="mb-4">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-subtle">إضافة عناصر</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {elementTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Button
                        key={tool.type}
                        variant="outline"
                        className="flex flex-col h-auto py-4 gap-2 border-surface-border-soft hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => addElement(tool.type)}
                      >
                        <Icon size={20} />
                        <span className="text-sm font-semibold">{tool.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="presets" className="m-0 p-4">
                <div className="mb-4">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-subtle">أنماط جاهزة</span>
                </div>
                <div className="flex flex-col gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      className="flex flex-col h-auto p-4 items-start gap-1 border-surface-border-soft text-right hover:border-primary"
                      onClick={() => selectPreset(preset.id)}
                    >
                      <strong className="text-sm text-primary">{preset.name}</strong>
                      <span className="text-xs text-ink-muted leading-normal">{preset.description}</span>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="import" className="m-0 p-4">
                <div className="mb-4">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-subtle">استيراد بيانات</span>
                </div>
                <div className="flex flex-col gap-3">
                  <input
                    ref={propertyFileRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(event) => void importPropertyFile(event.target.files?.[0])}
                  />
                  <input
                    ref={templateFileRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(event) => void importTemplateFile(event.target.files?.[0])}
                  />
                  <Button variant="outline" className="w-full h-11 gap-2 justify-start px-4" onClick={() => propertyFileRef.current?.click()}>
                    <Database size={16} />
                    <span>استيراد بيانات عقار</span>
                  </Button>
                  <Button variant="outline" className="w-full h-11 gap-2 justify-start px-4" onClick={() => templateFileRef.current?.click()}>
                    <FileJson size={16} />
                    <span>استيراد قالب</span>
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>

        <section className="designer-stage" dir="ltr">
          <div className="designer-stage__hint">
            <AlignRight size={16} />
            <span>اسحب العناصر، غيّر الحجم، وعدّل النص مباشرة.</span>
          </div>
          <div ref={containerRef} className="pdfme-designer-host">
            {!isDesignerReady ? (
              <div className="designer-loading">
                <Loader2 className="animate-spin" size={24} />
                <span>تحميل محرر PDFMe...</span>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="builder-panel builder-panel--right w-80">
          <Tabs defaultValue="properties" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-surface-alt h-14 p-1.5 gap-1">
              <TabsTrigger value="properties" className="gap-2 h-full text-xs">
                <Settings2 size={14} />
                <span>خصائص</span>
              </TabsTrigger>
              <TabsTrigger value="layers" className="gap-2 h-full text-xs">
                <Layers size={14} />
                <span>طبقات</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2 h-full text-xs">
                <Database size={14} />
                <span>بيانات</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="properties" className="m-0 p-4">
                <PropertiesPanel
                  schema={selectedSchema}
                  onChange={updateSelectedSchema}
                  onDelete={deleteSelectedSchema}
                />
              </TabsContent>

              <TabsContent value="layers" className="m-0 p-4">
                <div className="mb-4">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-subtle">طبقات الصفحة</span>
                </div>
                <div className="flex flex-col gap-2">
                  {currentPageSchemas.length ? (
                    currentPageSchemas.map((schema, index) => (
                      <Button
                        key={`${schema.name}-${index}`}
                        variant={schema.name === selectedName ? "default" : "outline"}
                        className={`w-full justify-start h-auto p-3 gap-3 ${schema.name === selectedName ? "" : "border-surface-border-soft"}`}
                        onClick={() => setSelectedName(schema.name)}
                      >
                        <Layers size={14} className={schema.name === selectedName ? "text-primary-foreground/80" : "text-ink-subtle"} />
                        <div className="flex flex-col items-start gap-1 flex-1">
                          <span className="text-sm font-semibold truncate w-full text-right">{schema.name}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${schema.name === selectedName ? "bg-white/20 text-white" : "bg-surface-alt text-ink-subtle"}`}>
                            {schema.type}
                          </span>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <div className="bg-surface-alt rounded-lg border border-dashed p-8 text-center flex flex-col gap-4">
                      <span className="text-sm text-ink-muted leading-relaxed">لا توجد عناصر في هذه الصفحة.</span>
                      <Button variant="outline" size="sm" onClick={resetTemplate}>
                        قالب افتراضي
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="data" className="m-0 p-4">
                <PropertyQuickPanel property={property} onApply={applyPropertyToTemplate} onReset={resetPropertyData} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>
      </section>
    </main>
  );
}

async function loadStudioFont() {
  const response = await fetch("/api/assets/fonts/cairo");
  if (!response.ok) throw new Error("تعذر تحميل الخط");
  return createPdfmeFont(await response.arrayBuffer());
}

function PropertiesPanel({
  schema,
  onChange,
  onDelete
}: {
  schema: StudioSchema | null;
  onChange: (patch: Partial<Schema> & Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  if (!schema) {
    return (
      <div className="bg-surface-alt rounded-lg border border-dashed p-10 text-center flex flex-col gap-2">
        <MousePointer2 size={24} className="mx-auto text-ink-subtle opacity-50" />
        <span className="text-sm text-ink-muted leading-relaxed">اختر عنصراً من الصفحة لتعديل خصائصه.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label htmlFor="schemaName" className="text-xs font-bold text-ink-muted pr-1">اسم الطبقة</Label>
        <Input
          id="schemaName"
          value={schema.name}
          onChange={(event) => onChange({ name: event.target.value })}
          className="h-10 border-surface-border-soft focus:border-primary transition-colors"
        />
      </div>

      {"content" in schema ? (
        <div className="grid gap-2">
          <Label htmlFor="schemaContent" className="text-xs font-bold text-ink-muted pr-1">المحتوى</Label>
          <Textarea
            id="schemaContent"
            rows={4}
            value={schema.content || ""}
            onChange={(event) => onChange({ content: event.target.value })}
            className="border-surface-border-soft focus:border-primary transition-colors resize-none"
          />
        </div>
      ) : null}

      <div className="space-y-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-subtle">الموضع والقياس</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-[11px] font-semibold text-ink-muted/80 pr-1">X</Label>
            <Input type="number" value={schema.position.x} onChange={(e) => onChange({ position: { ...schema.position, x: Number(e.target.value) } })} className="h-9 border-surface-border-soft" />
          </div>
          <div className="grid gap-2">
            <Label className="text-[11px] font-semibold text-ink-muted/80 pr-1">Y</Label>
            <Input type="number" value={schema.position.y} onChange={(e) => onChange({ position: { ...schema.position, y: Number(e.target.value) } })} className="h-9 border-surface-border-soft" />
          </div>
          <div className="grid gap-2">
            <Label className="text-[11px] font-semibold text-ink-muted/80 pr-1">العرض</Label>
            <Input type="number" value={schema.width} onChange={(e) => onChange({ width: Number(e.target.value) })} className="h-9 border-surface-border-soft" />
          </div>
          <div className="grid gap-2">
            <Label className="text-[11px] font-semibold text-ink-muted/80 pr-1">الارتفاع</Label>
            <Input type="number" value={schema.height} onChange={(e) => onChange({ height: Number(e.target.value) })} className="h-9 border-surface-border-soft" />
          </div>
        </div>
      </div>

      <Separator className="bg-surface-border-soft" />

      {schema.type === "text" ? (
        <div className="space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-subtle">تنسيق النص</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-[11px] font-semibold text-ink-muted/80 pr-1">حجم الخط</Label>
              <Input type="number" value={schema.fontSize || 13} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="h-9 border-surface-border-soft" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[11px] font-semibold text-ink-muted/80 pr-1">لون النص</Label>
              <div className="flex gap-2">
                <Input type="color" value={normalizeColor(schema.fontColor || "#17212b")} onChange={(e) => onChange({ fontColor: e.target.value })} className="h-9 w-12 p-1 border-surface-border-soft cursor-pointer" />
                <Input type="text" value={schema.fontColor || "#17212b"} onChange={(e) => onChange({ fontColor: e.target.value })} className="h-9 flex-1 text-[11px] border-surface-border-soft" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Button variant="destructive" className="w-full mt-4 h-11 gap-2" onClick={onDelete}>
        <Trash2 size={16} />
        <span>حذف العنصر</span>
      </Button>
    </div>
  );
}

function PropertyQuickPanel({
  property,
  onApply,
  onReset
}: {
  property: PropertyData;
  onApply: (property: PropertyData) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState(property);

  useEffect(() => {
    setDraft(property);
  }, [property]);

  function update<K extends keyof PropertyData>(key: K, value: PropertyData[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card className="border-surface-border-soft shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-primary">بيانات العقار</CardTitle>
        <CardDescription className="text-xs">تحرير البيانات التي تغذي القالب مباشرة.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label className="text-xs font-bold text-ink-muted">العنوان</Label>
          <Input value={draft.title} onChange={(e) => update("title", e.target.value)} className="h-10 border-surface-border-soft" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label className="text-xs font-bold text-ink-muted">السعر</Label>
            <Input type="number" value={draft.price} onChange={(e) => update("price", Number(e.target.value))} className="h-10 border-surface-border-soft" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-bold text-ink-muted">المساحة</Label>
            <Input type="number" value={draft.area} onChange={(e) => update("area", Number(e.target.value))} className="h-10 border-surface-border-soft" />
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-bold text-ink-muted">الموقع</Label>
          <Input value={draft.location} onChange={(e) => update("location", e.target.value)} className="h-10 border-surface-border-soft" />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-bold text-ink-muted">الوصف</Label>
          <Textarea rows={4} value={draft.description} onChange={(e) => update("description", e.target.value)} className="border-surface-border-soft resize-none" />
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button className="w-full h-11 gap-2" onClick={() => onApply(draft)}>
            <span>تطبيق التعديلات</span>
          </Button>
          <Button variant="outline" className="w-full h-11 gap-2 border-surface-border-soft" onClick={onReset}>
            <RefreshCw size={14} />
            <span>إعادة تعيين</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function findSchema(template: Template, name: string | null): StudioSchema | null {
  if (!name) return null;
  return (template.schemas.flat().find((schema) => schema.name === name) as StudioSchema | undefined) || null;
}

function hasPageSchemas(template: Template) {
  return Array.isArray(template.schemas) && template.schemas.some((page) => Array.isArray(page) && page.length > 0);
}

function isPdfmeTemplate(value: unknown): value is Template {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { schemas?: unknown; basePdf?: unknown };
  return Array.isArray(candidate.schemas) && Boolean(candidate.basePdf);
}

function normalizeColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff";
}

function safeFileName(value: string) {
  return value.replace(/[^\u0600-\u06FFa-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "pdf-studio";
}
    
