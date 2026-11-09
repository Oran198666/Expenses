// Main heading shown at the top of every signed-in page (PRD: one H1 per page).
export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="glow-text text-2xl sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2">{subtitle}</p>}
    </header>
  );
}
