import type { Schema, Template } from "@pdfme/common";
import type { PropertyData } from "@pdf-ar/pdf-engine";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sampleProperty } from "../data/catalog";
import {
  cloneTemplate,
  createStudioSchema,
  getDefaultPdfmeTemplate,
  hydrateTemplateWithProperty,
  type StudioElementType
} from "../lib/pdfme/templates";

interface PdfStudioState {
  template: Template;
  property: PropertyData;
  selectedName: string | null;
  currentPage: number;
  status: string;
  setTemplate: (template: Template) => void;
  setProperty: (property: PropertyData) => void;
  setSelectedName: (name: string | null) => void;
  setCurrentPage: (page: number) => void;
  setStatus: (status: string) => void;
  resetTemplate: () => void;
  addElement: (type: StudioElementType) => void;
  updateSelectedSchema: (patch: Partial<Schema> & Record<string, unknown>) => void;
  deleteSelectedSchema: () => void;
  addPage: () => void;
  removeCurrentPage: () => void;
  applyPropertyToTemplate: (property: PropertyData) => void;
}

export const usePdfStudioStore = create<PdfStudioState>()(
  persist(
    (set, get) => ({
      template: getDefaultPdfmeTemplate(sampleProperty),
      property: sampleProperty,
      selectedName: "propertyTitle",
      currentPage: 0,
      status: "جاهز للتحرير",
      setTemplate: (template) => set({ template }),
      setProperty: (property) => set({ property }),
      setSelectedName: (selectedName) => set({ selectedName }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setStatus: (status) => set({ status }),
      resetTemplate: () => {
        const property = get().property || sampleProperty;
        set({
          template: getDefaultPdfmeTemplate(property),
          selectedName: "propertyTitle",
          currentPage: 0,
          status: "تمت استعادة القالب الافتراضي"
        });
      },
      addElement: (type) => {
        const { currentPage, template } = get();
        const pageIndex = Math.min(currentPage, Math.max(template.schemas.length - 1, 0));
        const nextTemplate = cloneTemplate(template);
        const schema = createStudioSchema(type, pageIndex, nextTemplate);

        nextTemplate.schemas[pageIndex] = [...(nextTemplate.schemas[pageIndex] || []), schema];
        set({ template: nextTemplate, selectedName: schema.name, status: "تمت إضافة عنصر جديد" });
      },
      updateSelectedSchema: (patch) => {
        const { selectedName, template } = get();
        if (!selectedName) return;

        set({
          template: {
            ...template,
            schemas: template.schemas.map((page) =>
              page.map((schema) => (schema.name === selectedName ? { ...schema, ...patch } : schema))
            )
          },
          status: "تم تحديث خصائص العنصر"
        });
      },
      deleteSelectedSchema: () => {
        const { selectedName, template } = get();
        if (!selectedName) return;

        set({
          template: {
            ...template,
            schemas: template.schemas.map((page) => page.filter((schema) => schema.name !== selectedName))
          },
          selectedName: null,
          status: "تم حذف العنصر"
        });
      },
      addPage: () => {
        const { template } = get();
        const nextTemplate = { ...template, schemas: [...template.schemas, []] };
        set({ template: nextTemplate, currentPage: nextTemplate.schemas.length - 1, status: "تمت إضافة صفحة" });
      },
      removeCurrentPage: () => {
        const { currentPage, template } = get();
        if (template.schemas.length <= 1) {
          set({ status: "لا يمكن حذف الصفحة الوحيدة" });
          return;
        }

        const schemas = template.schemas.filter((_, index) => index !== currentPage);
        set({
          template: { ...template, schemas },
          currentPage: Math.max(0, currentPage - 1),
          selectedName: null,
          status: "تم حذف الصفحة"
        });
      },
      applyPropertyToTemplate: (property) => {
        const template = hydrateTemplateWithProperty(get().template, property);
        set({ property, template, status: "تم ربط بيانات العقار بالقالب" });
      }
    }),
    {
      name: "pdf-ar-pdfme-studio",
      partialize: (state) => ({
        template: state.template,
        property: state.property,
        selectedName: state.selectedName,
        currentPage: state.currentPage
      })
    }
  )
);
