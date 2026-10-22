Timberlite v163 — Consistent Lean-To screen page widths

Apply over v162. Copy the included src folder over your project src, replacing the files and including the new components/AppPageLayout.css file. No dependencies or database changes.

Lean-To Design/Options, Technical, Tiles/Laths, Summary and standalone checklist use the tab bar's 1100px outer width and 16px horizontal inset. This also applies to the manufacture book's outer container and shared Quotes, Jobs, Customers and Materials pages. Materials navigation now sits outside its content container like the other shared pages. Integrated Hipped Lean-To standalone checklist uses the same container; embedded manufacture checklists keep their existing layout.

The CSS changes apply only on screen. Original page styles remain in place for printing. A4 manufacture sheets remain centred at their existing dimensions inside the common outer container; they are not stretched or reflowed. Content, quantities, calculations and diagrams are unchanged. Browser scrollbar space is reserved to prevent horizontal movement when switching between short and long pages.

Validation: all eleven changed JSX/JS modules parsed successfully; thirteen Lean-To/Hipped save callback checks passed; cross-family navigation and Victorian layout checks passed. No browser screenshot comparison or full local compile is available here. Please compile locally, click through the Lean-To tabs and check alignment against Home and Materials, then confirm print preview remains as before.
