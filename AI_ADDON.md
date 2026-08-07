# AI add-on

Product descriptions written by AI, paid for in credits. The model key and the
credit ledger live in a **separate service we run**; this repo is one of its
clients and never talks to a model directly.

## Why the split

Three things follow from the service owning the ledger rather than the store:

- **One key, many stores.** The model key never ships to a client site, so a
  compromised storefront cannot spend it.
- **The service sets the price.** `creditsCharged` comes back in the response;
  the client never sends it. If the caller named its own price, someone with
  devtools would name zero.
- **Credits are enforced where they are counted.** A client-side check is a
  suggestion.

## Contract

The service must implement these two endpoints. `lib/ai-service.ts` is written
against them and is the authority if this document drifts.

### `GET /v1/balance`

```
Authorization: Bearer <store key>

200 → { "credits": 24, "lowWater": 5 }
```

`lowWater` is the point below which the admin header warns. The service decides
it, so it can be tuned per plan without shipping a client change.

### `POST /v1/generate/description`

```
Authorization: Bearer <store key>
Idempotency-Key: <uuid>
Content-Type: application/json

{
  "brand": "Nike",
  "title": "Free RN Flyknit Crimson",
  "price": 2499,
  "mrp": 3499,
  "sizes": ["6","7","8","9","10","11"],
  "imageUrls": ["https://…/front.jpg", "https://…/side.jpg"],
  "existing": null
}

200 → { "description": "…", "creditsCharged": 1, "creditsRemaining": 23 }
```

`existing` is set when the owner asked to improve current copy rather than
replace it; null otherwise.

### Status codes the client acts on

| Status | Meaning | What the admin shows |
|---|---|---|
| `402` | Out of credits | The error text, and the header chip refreshes |
| `429` | Rate limited | "Try again shortly" |
| `400` / `422` | Product unusable | The service's own message |
| `401` / `403` | Bad store key | "Not connected correctly" — logged as ours to fix, not the shop owner's |
| `5xx` | Anything else | "Unavailable right now" |

The 401/403 distinction matters: a key problem is our bug, and telling a shop
owner to check their credentials for it wastes their afternoon.

## Three things the service must get right

1. **Debit atomically, in the database.** A balance check followed by a separate
   decrement is a race, and the race is a customer generating for free.
2. **Refund a failed generation.** The debit happens first so it cannot be
   skipped, which means a model error has to give it back.
3. **Honour `Idempotency-Key`.** Return the stored result for a key already
   seen. Without this, a dropped response that the client retries is charged
   twice, and the customer is right to be angry about it.

Meter tokens internally for margin, but sell whole credits — "1 credit = 1
description". Nobody running a shoe shop wants to think in tokens.

## Configuration

```bash
# .env.local — all server-side, none NEXT_PUBLIC_
AI_SERVICE_URL=https://ai.example.com
AI_SERVICE_KEY=<store key>
AI_SERVICE_DASHBOARD_URL=https://ai.example.com/billing   # where the chip links to top up
```

Leave `AI_SERVICE_URL` or `AI_SERVICE_KEY` unset and the add-on disappears
cleanly: no credit chip, and the button reports that it is not connected. The
admin has to keep working for someone who never bought this.

## Development without the service

A stub implementing the contract lives at `app/api/dev/ai-stub/`. Point at it:

```bash
AI_SERVICE_URL=http://localhost:3000/api/dev/ai-stub
AI_SERVICE_KEY=dev
```

It starts with 25 credits, charges 1 per generation, honours the idempotency
key, pauses ~1.2s so the UI is built for a slow call, and 404s in production.
Its output is conspicuously labelled `[STUB]` — a stub that wrote plausible copy
would eventually get some saved to a live product.

## What's in this repo

| File | Role |
|---|---|
| [`lib/ai-service.ts`](lib/ai-service.ts) | Typed client. `server-only`, so importing it into a client component is a build error rather than a leaked key |
| [`lib/server/admin-guard.ts`](lib/server/admin-guard.ts) | Session + `is_admin` check shared by the admin API routes |
| [`app/api/admin/ai/description/route.ts`](app/api/admin/ai/description/route.ts) | Proxy. Reads the product from the database rather than trusting the browser |
| [`app/api/admin/ai/balance/route.ts`](app/api/admin/ai/balance/route.ts) | Balance for the header chip |
| [`components/admin/AiDescriptionButton.tsx`](components/admin/AiDescriptionButton.tsx) | "Write with AI" in the product form |
| [`components/admin/AiCreditsChip.tsx`](components/admin/AiCreditsChip.tsx) | Remaining credits in the admin header |
| [`app/api/admin/ai/photo/route.ts`](app/api/admin/ai/photo/route.ts) | Proxy for photo clean-up. Reads the image's current URL from `product_media` rather than trusting the browser, same reasoning as the description proxy |
| [`components/admin/GalleryUploader.tsx`](components/admin/GalleryUploader.tsx) | "Clean up a photo with AI" in the product gallery — replaces the chosen image's row in place |
| [`components/admin/views/MediaView.tsx`](components/admin/views/MediaView.tsx) | The same clean-up action, reachable from the site-wide media grid instead of one product at a time |
| [`components/admin/ImageField.tsx`](components/admin/ImageField.tsx) | Cover-image picker (category and collection tiles) — paste a URL, generate one, or upload and crop a photo from your computer |
| [`components/admin/ImageCropModal.tsx`](components/admin/ImageCropModal.tsx) | The crop step behind the upload option above. Nothing uploads until the crop is confirmed |

The proxy sends only a product id from the browser and reads brand, prices,
sizes and photos server-side. Otherwise the admin could describe anything it
liked, and a spent credit would buy copy for a product that does not exist.

## Photo enhancement, not generation

Diamond Stepss sells real Nike, Adidas and Puma stock. A *generated* product
photo shows a shoe the customer will not receive — colourway, logo placement and
sole detail all drift — which is a returns problem before it is a legal one, and
India's e-commerce rules require accurate depiction. Nothing here generates a
product photo, and `/v1/enhance/photo` does not accept one — see the service's
own docs.

Photo *enhancement* carries none of that: background removal onto a clean
backdrop, a consistent square crop, one output size, run against a photo this
shop actually took. That is also what actually makes a catalogue look
expensive — fifteen photos that match, rather than one pretty one. It costs
five credits rather than one, because an image edit costs the service roughly
five times what a description does — see the service's own pricing rather than
this doc, which is not the authority on it.

The old photo in storage is not deleted when a clean-up replaces it — the
Media page's orphan-file scan already exists to catch that, and the proxy
route would rather risk a harmless orphaned file than a failed delete after
the credit is already spent.
