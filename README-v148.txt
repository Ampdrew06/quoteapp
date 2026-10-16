Timberlite Gable Edit banner + required delivery postcode v148
Apply over v147 by merging supplied src files.
Gable now matches the teal Edit collapse/expand behaviour. Quote / Save / Reset remain visible, inputs retain values, invalid dimensions remain open.
Gable, Edwardian and Victorian require a nonblank delivery postcode with a matching confirmed route before quote price display/save. Customer default mileage alone no longer makes a quotation ready. Verified zero-mile routes remain allowed; blank or stale distances do not.
Quote with no postcode shows a clear prompt and keeps inputs open. Clearing postcode from an existing displayed quote hides its price and disables saving. Auto postcode lookup and admin explicit mileage override are retained.
Admin Summary material/labour diagnostics remain visible, but final net/VAT/gross/profit figures are hidden until postcode delivery is ready. Other Summary template callers retain existing behaviour by default.
No material/geometry/pricing formula changes or Lean-To/Hipped flow changes.
377 calculation checks passed plus actual Gable Edit, shared submit guard, Victorian missing-postcode price/save suppression, Summary selling-price gate and existing mocked quote/save/route/user-role checks.
Full browser/mobile visual QA and live delivery lookup require your environment. Compile and test each style: missing postcode (no price), entered postcode + lookup (price), Edit and remove postcode (price removed), and Gable Quote > Edit on desktop/mobile.
