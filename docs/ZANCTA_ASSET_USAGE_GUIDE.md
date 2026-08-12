# ZANCTA Brand Assets — Engineering Integration Guide

**Purpose:** Quick-reference implementation guide for integrating ZANCTA brand assets into the Next.js application  
**Generated:** 2026-08-12  
**Assets Available:** 10 files in `/public/assets/zancta-brand/` + favicon

---

## Quick Start

### Update Root Metadata

Update `app/layout.tsx` to reference new branded favicon and OG image:

```tsx
export const metadata: Metadata = {
  title: {
    default: 'ZANCTA - Your Files Stay Private',
    template: '%s | ZANCTA',
  },
  description: 'Powerful local-first file tools — no upload, no watermark.',
  // NEW: Branded favicon
  icons: {
    icon: '/favicon-zancta.svg',
    apple: '/favicon-zancta.svg',
  },
  // NEW: Default Open Graph image
  openGraph: {
    images: [
      {
        url: '/assets/zancta-brand/og-images/zancta-og-hero.png',
        width: 1200,
        height: 630,
      },
    ],
  },
};
```

---

## Component Integration Examples

### Navigation Header

Update `components/marketing/nav.tsx`:

```tsx
export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-8 py-4">
      {/* NEW: Use primary wordmark */}
      <Link href="/" aria-label="ZANCTA home">
        <img 
          src="/assets/zancta-brand/logos/primary-wordmark.svg" 
          alt="ZANCTA" 
          className="h-10 w-auto"
        />
      </Link>
      
      {/* ... rest of nav items ... */}
    </nav>
  );
}
```

### Hero Section

Update `components/marketing/hero.tsx`:

```tsx
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* NEW: Technical background texture */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center opacity-[0.05]"
          style={{ backgroundImage: "url('/assets/zancta-brand/hero/zancta-hero-bg.png')" }}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-8 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Your files never leave your device.
        </h1>
        
        {/* NEW: Use compact mark as visual anchor */}
        <div className="mb-12 flex justify-center">
          <img 
            src="/assets/zancta-brand/logos/compact-mark.svg" 
            alt="" 
            className="w-32 h-32"
          />
        </div>
        
        <p className="text-xl text-muted-foreground mb-8">
          Local-first file tools with military-grade precision. No uploads. No compromises.
        </p>
        
        {/* ... CTA buttons ... */}
      </div>
    </section>
  );
}
```

### Pricing Page

Update `app/pricing/page.tsx` or `pricing-client.tsx`:

```tsx
import Image from 'next/image';

export function PricingClient() {
  return (
    <section>
      {/* NEW: Branded pricing banner at top */}
      <div className="mb-16">
        <Image
          src="/assets/zancta-brand/og-images/zancta-pricing-banner.png"
          alt="ZANCTA Pricing Plans - Free vs Premium"
          width={1200}
          height={630}
          className="rounded-lg shadow-xl"
          priority
        />
      </div>
      
      {/* ... pricing cards ... */}
    </section>
  );
}
```

### Tool Cards

Update `components/marketing/tool-grid.tsx`:

```tsx
import PDFIcon from '/assets/zancta-brand/icons/pdf-icon.svg';
import ImageIcon from '/assets/zancta-brand/icons/image-icon.svg';

export function ToolGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* PDF Tools */}
      <article className="tool-card">
        <div className="flex items-start gap-4">
          {/* NEW: Category-specific icon */}
          <PDFIcon className="w-12 h-12 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold">Merge PDF</h3>
            <p className="text-muted-foreground">Combine multiple PDFs into one secure document.</p>
          </div>
        </div>
      </article>
      
      {/* Image Tools */}
      <article className="tool-card">
        <div className="flex items-start gap-4">
          <ImageIcon className="w-12 h-12 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold">Compress Image</h3>
            <p className="text-muted-foreground">Reduce file size while preserving quality.</p>
          </div>
        </div>
      </article>
    </div>
  );
}
```

---

## CSS Global Styles

Add brand tokens to `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* NEW: ZANCTA brand color tokens */
    --color-zancta-black: #0A0A0A;
    --color-graphite: #1A1A1A;
    --color-gunmetal: #2A2A2A;
    --color-metallic-silver: #A8A8A8;
    --color-metallic-silver-light: #E8E8E8;
    
    /* Metallic gradient utilities */
    --gradient-metallic-vertical: linear-gradient(180deg, var(--color-metallic-silver-light) 0%, var(--color-metallic-silver) 100%);
    --gradient-metallic-diagonal: linear-gradient(135deg, #F5F5F5 0%, #D4D4D4 25%, #A8A8A8 50%, #8C8C8C 75%, #787878 100%);
  }
}

@layer components {
  .brand-text-metallic {
    background: var(--gradient-metallic-vertical);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .brand-border-hairline {
    border: 0.5px solid rgba(96, 96, 96, 0.3);
  }
  
  .brand-glow-subtle {
    filter: drop-shadow(0 0 8px rgba(168, 168, 168, 0.2));
  }
}
```

---

## Social Media Optimization

All Open Graph images are pre-sized for maximum platform compatibility:

### Twitter/X
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://zancta.com/assets/zancta-brand/og-images/zancta-og-hero.png">
```

### LinkedIn
Uses same format as Twitter; test rendering at https://www.linkedin.com/post-inspector/

### Facebook
```html
<meta property="og:image" content="https://zancta.com/assets/zancta-brand/og-images/zancta-og-hero.png">
<meta property="fb:app_id" content="YOUR_APP_ID">
```

---

## Performance Considerations

### SVG Asset Optimization

All SVG files are inline-ready. For best performance:

**Option 1: Inline SVG directly** (recommended for frequently used logos):
```tsx
export function LogoInline() {
  return (
    <svg viewBox="0 0 400 100" className="h-10 w-auto">
      <defs>
        <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8E8E8" />
          <stop offset="50%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#A8A8A8" />
        </linearGradient>
      </defs>
      {/* ... full SVG content ... */}
    </svg>
  );
}
```

**Option 2: External SVG with proper caching**:
Ensure `next.config.ts` has correct MIME type:
```ts
async headers() {
  return [
    {
      source: '/assets/zancta-brand/logos/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### PNG Asset Strategy

OG images and hero backgrounds are served as-is via static serving. Add WebP fallbacks:

```html
<picture>
  <source type="image/webp" srcSet="/assets/zancta-brand/og-images/zancta-og-hero.webp">
  <img src="/assets/zancta-brand/og-images/zancta-og-hero.png" alt="..." />
</picture>
```

---

## Testing Checklist

Before deploying ZANCTA branding live:

- [ ] Favicon renders correctly in browser tab (all major browsers tested)
- [ ] Primary wordmark scales properly on mobile (minimum 40px height)
- [ ] Compact mark is legible at 24×24px (loading states, sidebar icons)
- [ ] Open Graph images render in social previews (test with Twitter Card Validator, Facebook Debugger)
- [ ] Hero background doesn't interfere with text readability (WCAG AA contrast maintained)
- [ ] Tool category icons scale consistently with existing icon set
- [ ] Monochrome versions work on both light and dark backgrounds
- [ ] All SVG assets load without console errors
- [ ] Page load time doesn't increase noticeably (LCP impact < 50ms)

---

## Troubleshooting

### Logos appear blurry on retina displays
**Fix:** SVGs should scale automatically; ensure no fixed dimensions set via CSS. If issue persists, add `width="auto" height="auto"` attributes.

### Metallic gradients look flat
**Check:** Ensure gradient direction matches specification. Dark backgrounds need vertical gradient; light backgrounds may require adjusted opacity stops.

### Glows too prominent
**Adjust:** Reduce blur radius from 0.8 to 0.5 for subtler effect. Remember restraint is core to premium feel.

### Icons don't match other UI elements
**Verify:** Stroke weight should be exactly 2.5px for consistency. Corner markers must align with bounding box edges.

---

## Future Asset Requests

If additional assets needed beyond current set:

1. **Social media avatar variants** (@zancta handle on Twitter/LinkedIn — requires square crops)
2. **Email signature template** (monochrome white version with social link icons)
3. **Presentation templates** (keynote/google slides deck with brand styles)
4. **Printed materials** (business cards, QR codes for offline marketing)
5. **Animated logo variant** (subtle metallic shimmer on hover — CSS-only preferred)

Submit requests via GitHub issue tagged `brand-assets`.

---

**Questions?** Refer to comprehensive manifest: `docs/PHASE10_ASSET_MANIFEST.md`  
**Contact:** Design system maintainers @ your-team

---

*This guide was generated as part of PHASE 10E Brand Identity rollout.*
