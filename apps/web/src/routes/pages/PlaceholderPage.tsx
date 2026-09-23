interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="p-lg">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-3 text-sm text-textMuted">This page is a placeholder — content coming soon.</p>
    </div>
  );
}
