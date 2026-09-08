export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "left",
}: {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
}) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      {eyebrow && (
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-sage-deep">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink text-balance">
        {heading}
      </h2>
      {subheading && (
        <p className="max-w-2xl text-lg text-ink-soft leading-relaxed">
          {subheading}
        </p>
      )}
    </div>
  );
}
