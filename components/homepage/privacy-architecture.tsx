import { CornerTicks, Reveal, StaggerGroup, StaggerItem } from "@/components/marketing/motion";

const PROMISE_STEPS = [
  {
    title: "Selected locally",
    detail: "You choose the files from your device.",
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4" />
      </svg>
    ),
  },
  {
    title: "Processed in this browser",
    detail: "We run the tools locally, inside your browser.",
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
      </svg>
    ),
  },
  {
    title: "Result available locally",
    detail: "Download or copy results. Nothing is uploaded.",
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4v10m0 0 4-4m-4 4-4-4" />
        <path d="M5 19h14" />
      </svg>
    ),
  },
  {
    title: "Your privacy is our product",
    detail: "The file never leaves your device.",
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 4.5H6A1.5 1.5 0 0 0 4.5 6v3" />
        <path d="M15 19.5h3a1.5 1.5 0 0 0 1.5-1.5v-3" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const TRUST_ROW = [
  { title: "Privacy first", detail: "Your data never leaves your device for the implemented local workflows." },
  { title: "Works offline", detail: "No internet required for supported tools once the app is loaded." },
  { title: "Broadly compatible", detail: "Works with PDF, JPG, PNG, and WebP across modern browsers." },
  { title: "No sign-up for free", detail: "Free tools are available immediately, without an account." },
];

export function PrivacyArchitectureSection() {
  return (
    <section className="mx-auto max-w-[80rem] px-5 py-16 md:px-8 md:py-24">
      <Reveal className="aperture card-surface relative p-6 md:p-10">
        <CornerTicks />
        <p className="eyebrow">The ZANCTA promise</p>
        <StaggerGroup className="mt-8 grid gap-8 md:grid-cols-4">
          {PROMISE_STEPS.map((step, index) => (
            <StaggerItem key={step.title} className="relative">
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border-strong bg-elevated text-platinum">
                  {step.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
                </div>
              </div>
              {index < PROMISE_STEPS.length - 1 && (
                <span aria-hidden className="absolute -right-6 top-3 hidden text-muted-foreground md:block">→</span>
              )}
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Reveal>

      <StaggerGroup className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ROW.map((item) => (
          <StaggerItem key={item.title}>
            <div className="card-surface card-lift h-full p-5">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.detail}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
