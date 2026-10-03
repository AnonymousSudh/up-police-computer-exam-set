# UP Police Computer Operator Practice Exams

A React + Vite practice simulator with timed exams, custom JSON imports, and answer review. This is an independent practice tool, not an official UP Police service.

## Develop and verify

Use Node.js 22.12+ (or 24 LTS) and npm:

```sh
npm ci
npm run dev
npm run check
npm audit
```

`check` runs lint, data validation/scoring/storage tests, and the production build. The UI uses system fonts and requires no external font downloads.

## Deploy

```sh
npm run build
```

Publish the generated `dist/` directory on an HTTPS static host. Do not run the development server in production. `npm run preview` is for local verification.

- **Vercel:** import this repository, use `npm run build`, and set output to `dist`. The included `vercel.json` provides SPA routing and basic security headers.
- **Netlify / Cloudflare Pages:** use `npm run build` and output `dist`. The included `public/_redirects` is copied into the build for direct-link routing.
- **Other hosts:** rewrite non-file routes to `/index.html` so refreshing `/exam/:id`, `/import`, and `/result` works. Apply `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Frame-Options: DENY` using the host's header configuration.

After deployment, check the live domain on a phone, open a direct exam URL, refresh during an attempt, submit, and refresh the result page. Browser tests on the local build do not verify your host configuration.

## Storage and practice behavior

Imported exams are stored in localStorage in the current browser. Active attempts and the latest result are stored in sessionStorage for the current tab and survive refreshes. Closing the tab ends that session. Clearing browser storage removes imported exams and attempts. If storage is unavailable, the UI displays an error or warning.

The practice timer uses an absolute deadline, including time spent in a background tab. It submits when time expires. Users can adjust the practice timer. Manual submission asks for confirmation. Scoring awards one point per correct answer, with no negative marking. This frontend exposes answer keys and is intended for practice, not supervised or secure testing.

## Import format

```json
{
  "id": "custom-1",
  "title": "My Practice Exam",
  "durationMinutes": 60,
  "questions": [
    {
      "id": "q1",
      "text": "Which component executes instructions?",
      "options": ["CPU", "Monitor", "Keyboard", "Printer"],
      "correctAnswer": 0,
      "explanation": "The CPU executes program instructions."
    }
  ]
}
```

`correctAnswer` is a zero-based option index. IDs must be unique. Missing exam/question IDs are generated, missing duration defaults to 60 minutes, and `question` is accepted as an alias for `text`. The app rejects empty exams, invalid durations, malformed options, and invalid answer indexes. Limits: 2 MB of input, 1000 questions, 2–8 options per question, and 1–1440 minutes.

## Optional advertising

Ads are disabled by default. Copy `.env.example` to `.env.local` and configure your real AdSense publisher ID and numeric slot IDs, then rebuild. Never put secrets in `VITE_*` values: they are public in the generated bundle. Desktop side ads require both side slots. Before enabling ads, complete publisher approval and any privacy/consent requirements that apply to your audience.

The production page does not load AdSense or render demo placeholders without valid configuration. Set domain-specific metadata (such as a canonical URL or social image) once your public domain and image are chosen.

## Optional browser regression checks

With Playwright and its Chromium browser available, start `npm run preview` and run:

```sh
node tests/browser-check.cjs
```

The check covers 320, 375, 390, 768, 1024, and 1440 pixel layouts, refresh recovery, imports, result filters, direct routes, and timer expiry. `PLAYWRIGHT_MODULE` can point to a shared Playwright install, and `CHROME_PATH` can select an installed Chrome executable. Playwright is optional and is not shipped in the app bundle.

## Built-in full-form practice

Every visitor gets two permanent full-form MCQ cards. **Part 1 (Simple)** has 100 foundational questions and a 30-minute limit; **Part 2 (Hard)** has 200 more challenging questions and a 60-minute limit. Both include explanations and references after submission. Together they cover hardware and memory, input/output and media, software terminology, databases and office tools, networking, and security/web formats.

Built-in content is shipped with the app and takes priority over old browser snapshots. Imported exams remain available alongside it; the retired combined exam is ignored for returning visitors to prevent duplicate cards. The question bank is `src/data/full-form-exam.json`, split into the two parts in `src/data/exam-library.js`; editorial provenance, source limitations, and maintenance guidance are in [the research notes](docs/full-form-research.md). Archived-paper topics, official training-bank topics, and reference-based practice are separately labelled. No numerical prediction of future exam questions is implied.

With the preview running and optional Playwright available, verify the new set using `node tests/full-form-browser-check.cjs` (the same `PLAYWRIGHT_MODULE` and `CHROME_PATH` overrides apply).
