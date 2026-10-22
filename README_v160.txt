Timberlite v160 — Manufacture tabs and return to the current roof

Apply over v159. Copy the included src folder into your project, replacing the listed files. No dependencies or database changes.

Both 3- and 5-facet Victorian manufacture books now show their normal roof navigation tabs, hidden when printing.

The shared Quotes, Jobs, Customers, Materials and My Quotes navigation remembers the last roof family. Design/Options, Manufacture Book and the other roof tabs therefore return to the roof being worked on. Previously the shared bar was fixed to Lean-To, so an Edwardian draft appeared to disappear when the wrong design page opened. Existing Edwardian inputs are retained. Home still allows a fresh roof to be selected as before.

Validation: actual navigation component checks across five roof families and five shared pages; Edwardian dimension/quote restoration with a separate Hipped Lean-To draft present; both Victorian book tab variants; trade access restrictions; changed JSX parsing. Existing v159 book and front-details checks also passed. Full app build and browser navigation/print preview must be checked locally.

Please compile, then try Edwardian -> Quotes -> Design/Options without selecting a fresh roof from Home, and confirm dimensions, plan and price persist. Also check the tabs on both Victorian manufacture books and their print preview.
