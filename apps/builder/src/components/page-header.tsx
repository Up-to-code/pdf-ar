import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex items-end justify-between gap-6 max-md:grid">
      <div className="grid max-w-3xl gap-2">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-brand-accent">{eyebrow}</span>
        <h1 className="text-4xl font-black tracking-tight text-ink max-md:text-3xl">{title}</h1>
        <p className="max-w-2xl text-base leading-8 text-ink-muted">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
