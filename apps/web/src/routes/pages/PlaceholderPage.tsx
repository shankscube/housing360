interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="p-lg">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      <p className="mt-sm text-neutral-500">This page is a placeholder — content coming soon.</p>
    </div>
  );
}
