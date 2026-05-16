# PDF-AR PDF Studio

Arabic real-estate PDF SaaS studio built as a single Next.js app with a Hono TypeScript backend, a reusable `pdf-lib` engine package, and a production PDFMe visual builder.

## Install

```bash
npm install
npm install --legacy-peer-deps -w @pdf-ar/builder next@16.2.6 react@19.2.3 react-dom@19.2.3 @pdfme/ui@6.1.2 @pdfme/generator@6.1.2 @pdfme/common@6.1.2 @pdfme/schemas@6.1.2 zustand@5.0.9 lucide-react@0.555.0 @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2 tailwindcss@4.1.17 class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@3.4.0
```

## Workspace

- `apps/builder`: Next.js SaaS app, dashboard, templates, projects, PDFMe studio editor, and Hono API routes.
- `packages/pdf-engine`: TypeScript Arabic/RTL PDF engine powered by `pdf-lib`.
- `apps/builder/src/components/pdf-studio`: full-screen PDF builder UI.
- `apps/builder/src/lib/pdfme`: PDFMe plugins, fonts, and template presets.
- `apps/builder/src/store`: Zustand editor state.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful routes:

- `/dashboard`
- `/templates`
- `/projects`
- `/projects/demo-villa/editor`
- `/api/health`

## PDF Studio

The editor route is a real WYSIWYG builder powered by `@pdfme/ui`:

- add text, image, rectangle, ellipse, line, and QR code elements
- move, resize, rotate, and edit elements directly on the PDF page
- manage multiple pages
- use custom left palette, right properties panel, and layers list
- import property JSON or PDFMe template JSON
- export with `@pdfme/generator`, using the same template as the canvas
- load the Cairo font through `/api/assets/fonts/cairo` for Arabic PDF output

## API

The Hono backend is mounted inside Next at `/api`.

- `GET /api/health`
- `GET /api/sample-property`
- `GET /api/templates`
- `GET /api/projects`
- `GET /api/assets/fonts/cairo`
- `POST /api/pdf/export`

`POST /api/pdf/export` accepts:

```json
{
  "property": {
    "title": "فيلا فاخرة",
    "description": "وصف العرض",
    "price": 1200000,
    "currency": "ريال",
    "type": "فيلا",
    "status": "AVAILABLE",
    "bedrooms": 5,
    "bathrooms": 6,
    "area": 350,
    "location": "النرجس",
    "city": "الرياض",
    "country": "السعودية",
    "images": [],
    "features": ["حديقة", "مسبح"],
    "parking": 2,
    "contactInfo": "+966 50 000 0000",
    "companyLogos": [],
    "marketer": { "name": "أحمد", "role": "مسوق عقاري" }
  },
  "template": {
    "content": [
      { "type": "Title" },
      { "type": "Price" },
      { "type": "DetailsGrid" },
      { "type": "ContactCard" }
    ]
  }
}
```

## Verify

```bash
npm test
npm run build
```
