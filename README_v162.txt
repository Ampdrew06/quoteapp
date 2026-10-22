Timberlite v162 — Victorian tab continuity

Apply over v161. Copy the included src folder over your project src, replacing six Victorian files. No new dependencies or calculation changes.

Both Victorian manufacture books now begin with the standard front page directly beneath the banner. The duplicate Home/D/O/Print controls and draft message above the book have been removed. Optional front-page override fields remain available in a collapsed Book details section after the front page; normal front-page delivery/address/instruction inputs and Save remain in place. Use Print in the main banner.

Technical and Summary now place their navigation outside the content container, matching Design/Options. Their content uses the same 1100px maximum width, 16px padding and heading sizes. Duplicate Technical navigation links and introductory development commentary are removed. Technical input tools remain in a collapsed Technical settings section. Summary customer/reference/delivery controls remain in collapsed Quote details and delivery. The checklist no longer has a second Print button. Technical and Tiles/Laths no longer both highlight for the same hash route.

Book and checklist pages retain A4 dimensions for printing; these are intentionally narrower than the interactive technical/pricing pages. Existing print margins and cut diagrams are unchanged. Jack cut lengths remain pending connection verification, as indicated on their setting-out/cut pages.

Validation: actual layout component checks for both families, front-first ordering, collapsed book/settings controls, outer navigation, Summary width and checklist; existing book/save and cross-family navigation checks also passed. All six JSX modules parsed. Browser layout/print preview and full local build are not available in this source-only workspace; please compile and review the tab transitions and print pagination locally.
