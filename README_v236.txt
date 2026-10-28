Timberlite v236 - Gable front overhang correction
Apply over v235. Copy the included src contents into your app src folder, replacing matching files, then restart normally.

Gable No soffit applies only to the sides. Front Overhang retains its 150mm default and stays editable under Automatic, side restriction and No soffit. Its entered value is no longer overridden. Front soffit boards and front J-trim remain supplied when required by that overhang; side soffit boards/trims are omitted under No soffit. The side fascia lip remains.

Saved inputs from v235 retained the entered front overhang, so reopening/recalculating uses that value again after this correction. Intentionally entered zero values remain zero. Other roof styles are unchanged.

Checked 12 side-mode/front-overhang combinations (0/100/150/200mm), actual front-field callbacks, dimensions, front/side material allocation and stored-input rebuilds. Cross-style and book-saving regression checks passed. Full browser/production build and physical manufacture testing were not available in this source-only workspace.
