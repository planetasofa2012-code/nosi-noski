export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-[15px] [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}
