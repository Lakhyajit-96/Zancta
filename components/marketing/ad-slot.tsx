export function AdSlot({ id, className = "" }: { id: string; className?: string }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;
  return (
    <div
      id={id}
      data-ad-slot={id}
      aria-hidden="true"
      className={`min-h-[90px] w-full ${className}`}
    />
  );
}
