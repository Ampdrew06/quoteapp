Apply over v197. Copy src into your project, replacing matching files.

Adds the admin Victorian Hipped preview Side pitch input. Entering a pitch resolves the physical boss centres through the existing equal-depth joint solver. All plan, hip and rafter layout consumers use the resolved centres. Editing the boss inset returns to position-controlled calculation. Editing the front pitch or projection retains an explicit requested side pitch. Saved preview inputs retain this choice; existing saved previews retain their prior boss positions until edited.

Default example: requested 25 degrees gives boss inset 2185.12565mm and wallbar pitch 25 degrees. The plan side labels show the wallplate side pitch; the table explicitly identifies its existing geometric layout pitches. The underlying geometric hip/rafter slopes remain provisional frame-datum approximations, as before; this update does not validate production cuts.

Verified actual geometry and UI callbacks at 20/25/30 degrees, boss/pitch inverse, updated hips and rafters, unchanged rise, front-pitch change, saved reopen, invalid targets, admin gate, and existing wallplate suite. No full React compile or live deployment available locally.
