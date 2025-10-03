## Relief Hub — Philippines Disaster Relief Heatmap

A Next.js app to visualize disaster relief help requests across the Philippines. It features a heatmap and location markers by urgency level, a submission form for new requests, and a responsive UI optimized for fast access during emergencies.

### Features
- Visual, interactive heatmap of help requests with urgency-based intensities
- Custom map markers with popovers (title, type, people affected, contact)
- Submit and view requests tabs
- Responsive header, navbar, and map container
- Client-side only map using Leaflet and leaflet.heat

### Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Leaflet + leaflet.heat (dynamically imported)
- lucide-react icons
- Sonner toasts

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

Useful scripts:
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — lint check

## Project Structure
- `app/` — Next.js app routes and layout
- `components/` — UI and feature components (heatmap, list, form)
- `hooks/` — reusable hooks (e.g., toast)
- `lib/` — utilities

## Notes on the Map
- Leaflet CSS is injected once on the client; the map and heat layer are dynamically imported to avoid SSR issues.
- The map automatically resizes using `ResizeObserver` with a window resize fallback.
- Fit bounds padding adjusts based on viewport for better framing on small screens.

## Accessibility & Responsiveness
- Header and navigation adapt to mobile with a hamburger menu and accessible button states.
- The heatmap container height scales by breakpoint to keep the map usable on phones and desktops.

## Security & Data
- Consider a hybrid access model: public read-only heatmap, authenticated submissions, and an admin/moderation area. Add CAPTCHA and rate limiting if keeping submissions public.

## Deployment
- Recommended: Vercel. Build command: `npm run build`, output: `.next`.
- Ensure `NEXT_TELEMETRY_DISABLED=1` if you prefer disabling telemetry.

## Contributing
Issues and PRs are welcome. Please run `npm run lint` before submitting changes.
