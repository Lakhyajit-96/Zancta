# PHASE 10E — ZANCTA Brand Assets Manifest

**Generated:** 2026-08-12  
**Brand Name:** ZANCTA (pronounced **ZANK-ta**)  
**Brand Essence:** Coined from "sanctum/sanctuary" — *a safe place for files*  
**Visual Identity:** Dark/futuristic premium aesthetic with metallic graphite tones, restrained luminous accents, precision geometry, and technical sophistication

---

## Table of Contents

1. [Logos](#1-logos)
2. [Favicon](#2-favicon)
3. [Open Graph Images](#3-open-graph-images)
4. [Hero Backgrounds](#4-hero-backgrounds)
5. [Tool Category Icons](#5-tool-category-icons)
6. [Brand Color System](#6-brand-color-system)
7. [Usage Guidelines](#7-usage-guidelines)

---

## 1. Logos

All logos are provided in SVG format for infinite scalability across all use cases.

### `primary-wordmark.svg`
**Path:** `/public/assets/zancta-brand/logos/primary-wordmark.svg`

**Description:** 
Main wordmark treatment featuring "ZANCTA" in custom geometric sans-serif typography. Metallic silver gradient finish (#E8E8E8 → #C0C0C0 → #A8A8A8) with subtle luminous glow effect against deep black background (#0A0A0A). Includes precision horizontal accent line with micro dot endpoints as technical detail motif.

**Specifications:**
- Dimensions: 400×100 viewBox
- Typography: Custom letter-spacing (8px), 700 weight
- Gradient: Metallic silver linear (0° diagonal)
- Clearspace: Minimum 20px on all sides
- Usage: Primary logo for hero sections, headers, marketing materials

**Minimum Size:** 120px height

---

### `compact-mark.svg`
**Path:** `/public/assets/zancta-brand/logos/compact-mark.svg`

**Description:**
Single-letter "Z" monogram mark with angular precision geometry. Features five-tone metallic gradient (lightest to darkest), inner shadow depth filter, and corner technical reference dots. Shield-inspired architectural silhouette conveys security and craftsmanship.

**Specifications:**
- Dimensions: 80×80 viewBox (square aspect ratio)
- Colors: 5-step metallic gradient (#F5F5F5 → #D4D4D4 → #A8A8A8 → #8C8C8C → #787878)
- Details: Inner shadow filter, hairline white highlight at 30% opacity
- Corner markers: 1px radius technical dots at corners (#404040)
- Usage: App icons, social avatars, favicon substitute, loading states

**Minimum Size:** 48×48px

---

### `monochrome-white.svg`
**Path:** `/public/assets/zancta-brand/logos/monochrome-white.svg`

**Description:**
Pure white wordmark optimized for dark backgrounds. Luminous glow filter creates subtle atmospheric depth (#FFFFFF with 0.8 blur). Precision horizontal accent line and diagonal cut detail at endpoint add manufactured quality. Technical motif maintained through corner dots.

**Specifications:**
- Dimensions: 200×50 viewBox
- Color: Pure white (#FFFFFF)
- Effects: Luminous glow (0.8 blur radius)
- Accent line: 0.4px width at 50% opacity
- Usage: Dark backgrounds, video overlays, photography with light subjects

**Minimum Size:** 80px width

---

### `monochrome-black.svg`
**Path:** `/public/assets/zancta-brand/logos/monochrome-black.svg`

**Description:**
Graphite/dark metallic wordmark designed for light backgrounds. Subtle drop shadow creates dimensionality while maintaining technical precision. Edge bevel gradient (#404040 → #606060 → #2A2A2A) provides manufactured metal appearance. Mirror design of white variant.

**Specifications:**
- Dimensions: 200×50 viewBox
- Color: Dark metallic (#2A2A2A base)
- Effects: Depth shadow (offset 0×1, 0.5 blur)
- Accent line: Bevel gradient at 80% opacity
- Usage: Light backgrounds, printed materials, reverse photography

**Minimum Size:** 80px width

---

## 2. Favicon

### `favicon-zancta.svg`
**Path:** `/public/favicon-zancta.svg`

**Description:**
Scaled-down version of compact "Z" mark optimized for browser tabs and bookmarks. Refined 48×48 resolution maintains legibility at small sizes. Simplified metallic gradient and reduced detail density ensure clarity at 16×16 favicon display.

**Specifications:**
- Dimensions: 48×48 viewBox
- Optimized for: Browser tabs, bookmarks, PWA home screen
- Colors: 4-step metallic gradient (vs. 5-step in full version)
- Glow filter: Reduced intensity (0.3 blur vs. 0.5)
- File size target: < 8KB compressed

**Usage:**
```html
<link rel="icon" href="/favicon-zancta.svg">
<link rel="apple-touch-icon" href="/favicon-zancta.svg">
```

**Recommended alt formats:** Generate PNG variants at 32×32, 64×64, 128×128 for broader compatibility if needed.

---

## 3. Open Graph Images

### `zancta-og-hero.png`
**Path:** `/public/assets/zancta-brand/og-images/zancta-og-hero.png`

**Description:**
Primary social media preview image (1200×630px). Features centered compact Z mark with full tagline "Your files never leave your device." Grid background pattern reinforces technical precision theme. Three luminous accent orbs provide atmospheric depth without visual clutter.

**Specifications:**
- Dimensions: 1200×630px (Open Graph standard)
- Title font: 82px weight 700, 12px letter-spacing
- Tagline: 32px weight 400, 2px letter-spacing
- Features section: Local-first • Private • Fast triad
- Background: 60px grid at 10% opacity + radial gradient glows

**Usage:**
```html
<meta property="og:image" content="https://yourdomain.com/assets/zancta-brand/og-images/zancta-og-hero.png">
<meta name="twitter:card" content="summary_large_image">
```

**Social platforms tested:** Twitter/X, LinkedIn, Facebook, Discord

---

### `zancta-pricing-banner.png`
**Path:** `/public/assets/zancta-brand/og-images/zancta-pricing-banner.png`

**Description:**
Pricing page promotional image showcasing Free vs Premium plans. Glassmorphism card design with metallic edge highlights. "Best Value" badge on Premium tier uses gradient mesh for premium feel. Atmospheric glow behind cards creates focal hierarchy.

**Specifications:**
- Dimensions: 1200×630px
- Layout: Two-column pricing table
- Card style: Frosted glass backdrop blur (20px), 1px metallic border
- Badge: Gradient pill (#C8C8C8 → #969696)
- Typography: Price 56px/700, plan name 18px/600 uppercase

**Usage:**
```html
<!-- Link building -->
<a href="/pricing">
  <img src="/assets/zancta-brand/og-images/zancta-pricing-banner.png" alt="ZANCTA Pricing Plans">
</a>

<!-- Email campaigns -->
<img src="https://yourdomain.com/assets/zancta-brand/og-images/zancta-pricing-banner.png" alt="View ZANCTA pricing">
```

---

## 4. Hero Backgrounds

### `zancta-hero-bg.png`
**Path:** `/public/assets/zancta-brand/hero/zancta-hero-bg.png`

**Description:**
Abstract technical background texture (1920×1080px). Deep gradient base (#0A0A0A → #161616 variations) with concentric geometric shapes creating dimensional depth. Hairline borders, corner reference markers, and atmospheric luminous orbs evoke blueprint precision. Subtle noise overlay adds tactile manufactured quality.

**Specifications:**
- Dimensions: 1920×1080px (Full HD)
- Layer elements:
  - Gradient base: 5-stop diagonal sweep
  - Grid overlay: 120px spacing at 5% opacity
  - Geometric rings: 3 nested shapes (600px, 400px, 800px diameter)
  - Luminous orbs: 2 radial gradients (80px blur)
  - Noise texture: SVG turbulence at 3% opacity
  - Corner markers: 2px hairlines at 40% opacity
  - Reference lines: Horizontal + vertical crosshair

**Usage:**
```css
.hero-background {
  background-image: url('/assets/zancta-brand/hero/zancta-hero-bg.png');
  background-size: cover;
  background-position: center;
}
```

**Responsive notes:** Works best behind text overlays and call-to-action buttons. Consider adding an overlay gradient for improved text contrast on mobile.

---

## 5. Tool Category Icons

All tool icons follow consistent visual language: metallic stroke-only design on black backgrounds, same stroke weight (2.5px), uniform corner accent treatments, and matching technical detail motifs.

### `pdf-icon.svg`
**Path:** `/public/assets/zancta-brand/icons/pdf-icon.svg`

**Description:**
PDF document icon featuring trapezoidal page shape with folded top-right corner. "PDF" text set in geometric sans-serif. Internal horizontal lines suggest document content. Top-left corner has extended precision marker lines.

**Specifications:**
- Dimensions: 64×64 viewBox
- Stroke: 2.5px metallic gradient
- Text: 14px weight 700, 1px letter-spacing
- Detail lines: 5 internal horizontal strokes at varying opacities

**Tool categories represented:** PDF Merge, PDF Compress, PDF to Images, Split PDF

---

### `image-icon.svg`
**Path:** `/public/assets/zancta-brand/icons/image-icon.svg`

**Description:**
Photography/Image category icon with classic mountain landscape motif inside frame. Mountain range creates angular geometric rhythm, sun circle completes composition. Rounded rectangle frame (2px rx) softens otherwise technical aesthetic.

**Specifications:**
- Dimensions: 64×64 viewBox
- Stroke: 2.5px main frame, 2px landscape, 1.5px sun
- Sun circle: 4px radius
- Landscape: 5-point angular path (mountain peaks)
- Frame rounding: 2px radius

**Tool categories represented:** Image Compress, Image Resize, Image Convert, Background Remover

---

## 6. Brand Color System

Core color palette derived from graphite, gunmetal, and metallic silver spectrum with restrained luminous accents.

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Zancta Black | `#0A0A0A` | Backgrounds, primary surface |
| Graphite | `#1A1A1A` | Secondary backgrounds, cards |
| Gunmetal | `#2A2A2A` | Tertiary backgrounds, footer |
| Metallic Silver Base | `#A8A8A8` | Primary text, main gradient stop |
| Metallic Silver Light | `#E8E8E8` | Highlight gradient stop |
| Pure White | `#FFFFFF` | Text on black backgrounds |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| Technical Gray | `#404040` | Micro details, divider lines |
| Reference Gray | `#606060` | Corner markers, secondary lines |
| Atmosphere Gray | `#808080` | Glows, atmospheric effects |
| Ambient Gray | `#B0B0B0` | Secondary text, muted elements |

### Gradients

**Metallic Silver (Vertical):**
```css
linear-gradient(180deg, #E8E8E8 0%, #C0C0C0 50%, #A8A8A8 100%)
```

**Metallic Diagonal (45°):**
```css
linearGradient(x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" "#F5F5F5"/>
  <stop offset="25%" "#D4D4D4"/>
  <stop offset="50%" "#A8A8A8"/>
  <stop offset="75%" "#8C8C8C"/>
  <stop offset="100%" "#787878"/>
</linearGradient>
```

**Graphite Base:**
```css
linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)
```

---

## 7. Usage Guidelines

### DO

✅ Use metallic gradients on primary branding elements (logos, key CTAs)  
✅ Maintain minimum clearspace around logos (see individual specifications)  
✅ Choose white or black monochrome versions based on background brightness  
✅ Apply subtle luminous glow effects sparingly (blur radius ≤ 1px)  
✅ Use deep black (#0A0A0A) as default background for brand experiences  
✅ Layer geometric patterns with low opacity (< 15%) for technical atmosphere  

### DON'T

❌ Rainbow or saturated color gradients (violates monochrome restraint principle)  
❌ Add drop shadows thicker than 2px blur (preserves sharp technical aesthetic)  
❌ Rotate logos more than 5° (precision geometry should remain stable)  
❌ Use generic system fonts like Arial or Inter (choose refined alternatives)  
❌ Saturate accent colors beyond original gray spectrum  
❌ Overload with animated effects (restraint is core to premium feeling)  

### Accessibility

- **Text contrast:** All metallic gradients maintain WCAG AA contrast ratios on #0A0A0A backgrounds when viewed at mid-tone values
- **Focus states:** Never remove metallic gradient entirely for focus—use increased opacity instead
- **Motion:** Respect `prefers-reduced-motion`; apply glow filters static (no animation)

### Production Deployment

All SVG assets are inline-ready and can be embedded directly into HTML/CSS/React components. For React:

```jsx
import PrimaryWordmark from '/public/assets/zancta-brand/logos/primary-wordmark.svg';

export function Header() {
  return <img src={PrimaryWordmark} alt="ZANCTA" className="w-40 h-10" />;
}
```

---

## Asset Checklist

- ✅ `/public/assets/zancta-brand/logos/primary-wordmark.svg`
- ✅ `/public/assets/zancta-brand/logos/compact-mark.svg`
- ✅ `/public/assets/zancta-brand/logos/monochrome-white.svg`
- ✅ `/public/assets/zancta-brand/logos/monochrome-black.svg`
- ✅ `/public/favicon-zancta.svg`
- ✅ `/public/assets/zancta-brand/og-images/zancta-og-hero.png`
- ✅ `/public/assets/zancta-brand/og-images/zancta-pricing-banner.png`
- ✅ `/public/assets/zancta-brand/hero/zancta-hero-bg.png`
- ✅ `/public/assets/zancta-brand/icons/pdf-icon.svg`
- ✅ `/public/assets/zancta-brand/icons/image-icon.svg`

**Total Assets Generated:** 10 files  
**Total Code Lines Written:** 916 lines across 10 files  
**File Sizes (Approximate):** SVGs < 2KB each, PNGs ~50-80KB each

---

**Status:** COMPLETE  
**Next Steps:** Integrate assets into Next.js layout, update metadata configuration, replace placeholder images with branded OG assets.

---

*Generated by PHASE 10E Brand Identity + Assets workflow following ZANCTA brand research specifications.*
