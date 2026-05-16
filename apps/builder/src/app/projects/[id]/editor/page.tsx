"use client";

import dynamic from "next/dynamic";

const PdfMeStudio = dynamic(
  () => import("../../../../components/pdf-studio/pdf-me-studio").then((module) => module.PdfMeStudio),
  {
    ssr: false,
    loading: () => (
      <main className="pdf-builder" dir="rtl">
        <div className="designer-loading">تحميل استوديو PDF...</div>
      </main>
    )
  }
);

export default function ProjectEditorPage() {
  return <PdfMeStudio />;
}
