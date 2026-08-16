import { Navigation, Footer } from "@/components/marketing/nav";
export const metadata = { title: "Help" };
export default function Help(){return(<><Navigation /><main className="mx-auto max-w-3xl px-6 py-12"><h1 className="text-3xl font-semibold">Help</h1><p className="mt-3 text-sm text-muted-foreground">Each tool has its own page: drop files, wait for local processing, download. Max 50MB/file, 5 files free. HEIC/SVG not supported in MVP.</p></main><Footer /></>)}
