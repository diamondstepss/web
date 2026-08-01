# Brand assets — Diamond Stepss

Pulled from the live https://diamondstepss.com/ on 2026-07-26. These carry over to the new build unchanged.

| File | Source | Notes |
|---|---|---|
| `wide-logo.png` | `/wp-content/uploads/2025/02/wide-logo-1.png` | 1024×500 RGBA. Primary wordmark |
| `app-icon-512.jpg` | `/wp-content/uploads/2025/02/cropped-logo-new-padded.jpg` | 512×512. Square icon / PWA / social avatar |
| `favicon.ico` | `/favicon.ico` | 32×32 (JPEG data despite the `.ico` extension — regenerate as a real multi-size ICO + SVG) |
| `brand-logos/*.webp` | `/wp-content/uploads/2025/{02,05}/` | 14 stocked-brand logos for the brand strip and filter facets |

## Wordmark

Red slab "DIAMOND" in heavy uppercase, black handwritten script "Stepss" overlapping its lower right, illustrated red-and-white high-top sneaker at the left. The red is the brand accent and effectively matches the `#FF3333` design token.

## Needed in Phase 0

The current wordmark only works on light backgrounds — its black script vanishes on the dark theme, which is the site's default. Three exports required:

1. **Light-on-dark variant** — white script, same red "DIAMOND". For the dark theme header and footer.
2. **Compact mark** — sneaker icon + tightened lockup for the mobile header at ~40px tall.
3. **True favicon set** — 16/32/48 ICO, 180 Apple touch, 192/512 PNG, and an SVG. The existing one is a JPEG misnamed `.ico` and looks muddy at small sizes.

Source them as vector (SVG) if the original artwork exists; the 1024×500 PNG is the largest raster available and will soften on retina displays at full width.

## Links and details (verbatim)

```
Instagram   https://www.instagram.com/diamond_stepss/
Facebook    https://www.facebook.com/profile.php?id=61572978448795
WhatsApp    https://wa.me/917888522353
Maps        https://maps.app.goo.gl/5ZbHCdtKLU937L2o7

Phone       +91 78885 22353
Email       support@diamondstepss.com · info@diamondstepss.com
Address     Shop No 3, Main Road, Ladhewali Road, Jalandhar 144007, Punjab, India
Hours       Monday–Saturday, 10 AM – 7 PM IST
Tagline     Style & Comfort for Every Step!
Meta Pixel  2355846348111938
```
