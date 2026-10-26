Timberlite v193 — Victorian Hipped Lean-To automatic rafter layout

Apply over v192. Back up your existing source and copy the included src folder over your project src folder. Compile/deploy using your usual process.

Open Home > Admin tools > Victorian Hipped Preview, or /quote/victorian-hipped/technical. This remains an admin geometry preview, with no trade quotation entry yet.

The five-facet, four-hip, two-wallplate-boss preview now includes automatic rafters and jack rafters, labelled members, per-facet connection counts, and expandable centre/member-pitch/geometric-length information. Angled front facets use the existing provisional Victorian 850mm rule; sides use existing Hipped Lean-To wall-led 690mm/665mm centres and the 400mm final hip-seat clearance. The centre front facet reuses the existing Hipped Lean-To centre/boss layout builder.

Angled-front intermediate boss rafters fan from the facet midpoint to their boss. Their actual member pitch and geometric slope are calculated from their own endpoints, rather than copying the perpendicular facet pitch. Other supports intersect the actual facet boundary and are classified as boss-connected, wallplate-connected or hip-connected jacks.

The admin-only Edit Rafter Position selector covers all five facets. Add/remove internal rafters, edit centres or either gap, Apply changes or Restore automatic layout on the selected facet. Hips, bosses and boundary slots remain fixed. Right-side centres are measured from the house wall. Applied overrides persist in the existing isolated Victorian Hipped preview draft and reopen with it. Overlapping/out-of-bounds slots or invalid support intersections are rejected. Changes to input dimensions can expose invalid stored overrides; the editor can repair them using the automatic geometry fallback.

Lengths are internal plan/geometric references only. They do not include eaves extensions, hook/terminal deductions or manufactured timber cutting profiles. Vents, glazing and non-standard angles from the reference order have not been replicated. Pricing settings and existing completed roof styles are unchanged. Next stage: ringbeam profiles/upstands, followed by validated timber profiles and quotation integration.

Verification: changed sources pass Babel transformation; original Victorian Hipped geometry tests; five new geometry cases; support intersections, hip meeting heights and plane heights; mirrored geometry; actual rafter pitch; manual member role changes; selector/gap/Apply/reject/restore handlers; actual preview state/persistence/CAD/reopen; isolated inputs and admin-only access; visual inspection of rendered SVG; existing 3-/5-facet Victorian editor/save and pricing regressions.

A full local React compile and deployed browser/live cloud checks were not available here. Please compile and inspect the updated preview. Start with the default standard example and compare the five-facet layout, then try moving/removing a rafter and reopening the preview.
