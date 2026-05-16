import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { generatePropertyPDF, validateProperty, type PdfTemplate } from "@pdf-ar/pdf-engine";
import { getTemplate, projects, sampleProperty, templates } from "../data/catalog";

const exportPayloadSchema = z.object({
  property: z.unknown(),
  template: z.custom<PdfTemplate>().optional()
});

export const app = new Hono().basePath("/api");

app.use("*", cors());

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "pdf-ar-next-hono",
    runtime: "nodejs"
  })
);

app.get("/sample-property", (c) => c.json(sampleProperty));

app.get("/assets/fonts/cairo", async () => {
  const fontUrl = new URL("../../../../packages/pdf-engine/fonts/Cairo-VariableFont_slnt,wght.ttf", import.meta.url);
  const fontBytes = await readFile(fontUrl);

  return new Response(fontBytes, {
    headers: {
      "Content-Type": "font/ttf",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
});

app.get("/templates", (c) => c.json({ templates }));

app.get("/templates/:id", (c) => {
  const template = getTemplate(c.req.param("id"));
  return c.json({ template });
});

app.get("/projects", (c) => c.json({ projects }));

app.get("/projects/:id", (c) => {
  const project = projects.find((item) => item.id === c.req.param("id")) || projects[0];
  return c.json({ project, template: getTemplate(project.templateId) });
});

app.post("/property/validate", async (c) => {
  const payload = await c.req.json().catch(() => null);

  try {
    const property = validateProperty(payload);
    return c.json({ property });
  } catch (error) {
    return c.json(
      {
        error: "Invalid property data",
        details: error instanceof Error ? error.message : "Unknown validation error"
      },
      400
    );
  }
});

app.post("/pdf/preview", async (c) => {
  const parsed = exportPayloadSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ error: "Invalid request body", details: parsed.error.flatten() }, 400);
  }

  try {
    const property = validateProperty(parsed.data.property);
    const pdfBytes = await generatePropertyPDF(property, {
      template: parsed.data.template || getTemplate("premium-listing")
    });

    return pdfResponse(pdfBytes, "preview.pdf", "inline");
  } catch (error) {
    return c.json(
      {
        error: "Failed to preview PDF",
        details: error instanceof Error ? error.message : "Unknown PDF error"
      },
      500
    );
  }
});

app.post("/pdf/export", async (c) => {
  const parsed = exportPayloadSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json({ error: "Invalid request body", details: parsed.error.flatten() }, 400);
  }

  try {
    const property = validateProperty(parsed.data.property);
    const pdfBytes = await generatePropertyPDF(property, {
      template: parsed.data.template || getTemplate("premium-listing")
    });
    const safeTitle = property.title.replace(/[^a-zA-Z0-9-_]/g, "") || "property";

    return pdfResponse(pdfBytes, `report-${safeTitle}-${Date.now()}.pdf`, "attachment");
  } catch (error) {
    return c.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown PDF error"
      },
      500
    );
  }
});

app.get("/pdf/sample", async () => {
  const pdfBytes = await generatePropertyPDF(sampleProperty, { template: getTemplate("premium-listing") });

  return pdfResponse(pdfBytes, "sample-property-report.pdf", "attachment");
});

function pdfResponse(pdfBytes: Uint8Array, filename: string, disposition: "inline" | "attachment") {
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}

export type AppType = typeof app;
