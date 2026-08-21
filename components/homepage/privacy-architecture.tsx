import Link from "next/link";

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
    detail: "Implemented tools run on the selected file in this tab.",
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18" />
      </svg>
    ),
  },
  {
    title: "Result available locally",
    detail: "Download or copy results. The file is not uploaded for processing.",
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4v10m0 0 4-4m-4 4-4-4" />
        <path d="M5 19h14" />
      </svg>
    ),
  },
];

const TRUST_ROW = [
  { title: "Local processing", detail: "Selected file bytes stay in the browser for implemented local workflows." },
  { title: "After the app loads", detail: "Supported tools can keep working if the network drops after the page has loaded." },
  { title: "Formats today", detail: "PDF tools accept PDF. Image tools accept JPG, PNG, and WebP." },
  { title: "No sign-up for free", detail: "Free tools are available immediately, without an account." },
];

export function PrivacyArchitectureSection() {
  return (
    <section className="mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-20">
      <div className="card-surface p-6 md:p-10">
        <p className="eyebrow">The ZANCTA promise</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {PROMISE_STEPS.map((step, index) => (
            <div key={step.title} className="relative">
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
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm leading-7 text-muted-foreground">
          Details, including what still leaves the device, are in the{" "}
          <Link href="/guides/local-processing" className="underline underline-offset-4 hover:text-foreground">
            local processing guide
          </Link>
          .
        </p>
      </div>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ROW.map((item) => (
          <li key={item.title} className="card-surface h-full p-5">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
