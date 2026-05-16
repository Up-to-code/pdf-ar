import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { app } from "../apps/builder/src/server/api";
import { sampleProperty, templates } from "../apps/builder/src/data/catalog";

test("GET /api/health returns Hono health metadata", async () => {
  const response = await app.request("/api/health");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "pdf-ar-next-hono");
});

test("GET /api/templates returns built-in templates", async () => {
  const response = await app.request("/api/templates");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.templates.length >= 3);
});

test("GET /api/projects returns local SaaS projects", async () => {
  const response = await app.request("/api/projects");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.projects.length >= 1);
});

test("POST /api/pdf/export returns a readable PDF", async () => {
  const response = await app.request("/api/pdf/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ property: sampleProperty, template: templates[0] })
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /application\/pdf/);

  const pdfBytes = new Uint8Array(await response.arrayBuffer());
  assert.ok(pdfBytes.length > 1000);

  const doc = await PDFDocument.load(pdfBytes);
  assert.ok(doc.getPageCount() >= 1);
});

test("POST /api/pdf/preview returns the same readable PDF surface inline", async () => {
  const response = await app.request("/api/pdf/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ property: sampleProperty, template: templates[0] })
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /application\/pdf/);
  assert.match(response.headers.get("content-disposition") || "", /inline/);

  const pdfBytes = new Uint8Array(await response.arrayBuffer());
  const doc = await PDFDocument.load(pdfBytes);
  assert.ok(doc.getPageCount() >= 1);
});

test("POST /api/property/validate returns useful errors for invalid imports", async () => {
  const response = await app.request("/api/property/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price: -1 })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Invalid property data");
  assert.ok(body.details);
});
