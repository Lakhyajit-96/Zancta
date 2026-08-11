import { test } from "@playwright/test";
test("benchmarks", async ({ page }) => {
  const pngBase64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
  const buf=Buffer.from(pngBase64,"base64");
  const cases = [
    { slug:"image-compress", name:"1MB JPEG (simulated 1px)", files:1 },
    { slug:"image-compress", name:"5MB batch5", files:5 },
    { slug:"image-convert", name:"convert PNG→JPG", files:1 },
    { slug:"image-resize", name:"resize 800x600", files:1 },
    { slug:"exif-cleaner", name:"exif", files:1 },
  ];
  for (const c of cases) {
    const t0=Date.now();
    await page.goto(`/tools/${c.slug}`);
    const fps = await page.evaluate(()=>new Promise<number>(r=>{
      let f=0; const s=performance.now();
      function t(){f++; if(performance.now()-s<800) requestAnimationFrame(t); else r(Math.round(f*1000/(performance.now()-s)));}
      requestAnimationFrame(t);
    }));
    const t1=Date.now();
    await page.locator('input[type="file"]').setInputFiles(Array.from({length:c.files},(_,i)=>({name:`a${i}.png`,mimeType:"image/png",buffer:buf})));
    const start=Date.now();
    await page.getByRole("button",{name:/Process locally/i}).click();
    await page.getByText(/Completed/i).first().waitFor({timeout:15000});
    const elapsed=Date.now()-start;
    console.log(`${c.name}: FPS ${fps}, processing ${elapsed}ms, setup ${t1-t0}ms`);
  }
});
