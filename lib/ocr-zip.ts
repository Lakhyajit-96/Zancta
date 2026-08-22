export async function zipTextParts(parts: Array<{ name: string; text: string }>): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const part of parts) {
    zip.file(part.name, part.text);
  }
  return zip.generateAsync({ type: "blob" });
}
