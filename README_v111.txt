Timberlite v111 — Dedicated Hipped wallplate page
Apply over v110: copy src into quoteapp-v2 and replace included files.

The horizontal wallplate drawing now marks A (joint top), B (boss centre) and C (joint bottom) on each active joint. Their horizontal distances from each internal side frame are printed directly beneath the image in the same box. The former separate reference paragraph is removed.

Four compact cards fill the reserved lower area: 18mm horizontal infill, 18mm chevron blanks, 9mm front faceplate developed coverage, and 9mm rear joint-cover blanks/packers. Dimensions and quantities reuse the existing wallplate integration audit. Chevron and cover allowances are explicitly blanks/coverage to trim to the assembled profile, not invented finished cutting outlines. Front faceplate may require multiple sheet pieces.

The offset-boss Wallplate page is arranged for one A4 page. Unequal wallbars use a slightly more compact diagram height. Central-boss roofs retain their separate truss and joint pages because they have no horizontal wallplate.

267 lightweight calculation checks passed, including wallplate integration and assembly tests. Equal/unequal/one-hip rendering, A/B/C values, plywood cards, central-boss isolation, existing UI and syntax checks passed. Diagrams visually inspected. Browser print pagination remains unverified here.

Run npm run build. Open the same offset-boss roof shown in your screenshot and check its Wallplate page in A4 Print Preview at 100% scale (browser headers/footers off). Please send the full page so we can confirm that the plywood cards remain on this page and all dimensions are readable.

Optional tests:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/geometry/wallplateAssemblyGeometry.test.js src/lib/Calculations/wallplateIntegrationAudit.test.js src/lib/Calculations/wallplateSummaryIntegration.test.js
