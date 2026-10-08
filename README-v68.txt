Timberlite Gable Plastics, Guttering and Front Clearance — v68

Apply over v67. Merge src and replace matching files. Browser hot reload is sufficient under normal conditions.

SCOPE
Read-only Gable preview/audit. This update does not yet integrate Gable pricing into Summary, saved quotations, loading lists or a manufacture-book export. The calculated requirements are ready for review. Existing Lean-To/Hipped and Home Tile Calcs functions retain their behaviour.
The new notification is displayed in the Gable preview and geometry notes; when Gable manufacture-book export is integrated it must carry this same instruction.

FRONT CLEARANCE
Customer external projection = internal projection + front frame + requested front overhang.
Manufacturing projection = customer external projection + 5mm, applied ONCE.
Both side ring-beams and the flush front truss follow manufacturing projection. Other Gable material calculations consume the same value. Requested soffit widths and nominal quotation dimensions remain unchanged.
Notice: Includes 5mm front soffit clearance—do not add again.

EXPECTED 3800 x 4100, 25 DEGREE EXAMPLE
Requested external projection 4320mm; manufacturing projection 4325mm.
Two ring-beams 4325mm; front truss centre 4302.5mm.
Gutters: 3 x 4m lengths; 2 unions; 7 brackets per side (800mm approximate spacing); no gutter corners.
Two running outlets, four stop ends, two round downpipes, four offset bends, four clips, two shoes. Square/ogee adds two square-to-round adaptors; round adds none.
Side fascia: 225mm stock, external cut height 223mm, coverage above lip 213mm. Front sloping fascia: provisional 300mm stock, to be reviewed by factory.
Front sloping fascia runs approx 2010.9mm each, ending at the gusset. One central 400 x 1000mm box-end blank with two joining fascia joints; four front fascia corners as instructed.
With the default soffit widths and 3mm rip kerf, board candidate is three 150mm x 5m soffit boards. Compatible offcuts are shared. Custom available stock widths can alter the planner's proposal.
Fascia candidate: two 225mm x 5m boards and one 300mm x 5m board with shared front slope cuts.
J-trim candidate approx 12.626m = three 5m lengths, following side frames and the assumed front A-frame slopes/flat. Side factory venting 9m under existing ceiling rule.
Steel: 74 main tiles, ridge 4325mm, external laths 95.150m (20 x 4.8m).
LiteSlate: 480 main slates, external laths 138.400m (29 x 4.8m), 24 ridge tiles. No additional short finishing course.
External tile-covered area increases slightly because of the extra 5mm projection. Membrane reconciliation to the tile-starter extent remains pending as documented previously.

MATERIALS
Open Materials > Plastic Elements > Fascia & soffit accessories.
Enter White and Foiled prices for Gable box end (400 x 1000mm blank). Absent rates display Unconfigured in the audit; explicitly entered zero remains valid.
Polytop pricing follows the existing single 50-pin allowance. Check stored price represents this allowance, not the full 250-pin box.
No installed plastic weight rates were changed.

FACTORY REVIEW POINTS
The central box-end's exact cut outline/finished height and required joint fitting lengths need a workshop drawing. Stock coverage is flagged if the calculated gusset alone exceeds the blank dimensions; no finished box-end cut is claimed.
Front A-frame J-trim profile, front corner angle/fitting details and soffit corner H-trim remain provisional. H-trim candidate currently includes straight board joins only. The front soffit includes the central flat under the closure.
Do not treat these proposed stock layouts as a validated manufacture cut list.

FILE MAP
src/lib/geometry/gableGeometry.js
  UPDATED: adds manufacturingProjectionMM = requested externalProjectionMM + 5mm; truss setting-out and ring-beam lengths use it. Nominal quotation dimensions remain unchanged.
src/lib/geometry/gableGeometry.test.js
  UPDATED: verifies separate nominal/manufacturing dimensions and single clearance application.
src/lib/Calculations/gableTimberAudit.js
  UPDATED: uses manufacturing projection for the two straight ring-beams.
src/lib/Calculations/gableTimberAudit.test.js
  UPDATED: ring-beam dimensions/areas reflect the 5mm front allowance.
src/lib/Calculations/gableInsulationAudit.js
  UPDATED: external membrane face length follows manufacturing projection; ceiling retains internal projection; PIR bays follow revised truss setting-out.
src/lib/Calculations/gableInsulationAudit.test.js
  UPDATED: verifies revised external face reference, retaining internal ceiling rules.
src/lib/Calculations/gableTilingAudit.js
  UPDATED: tile face width and ridge use manufacturing projection. Steel remains 74 main tiles; LiteSlate remains 480 for this example.
src/lib/Calculations/gableTilingAudit.test.js
  UPDATED: ridge/lath lengths include clearance, with previous ordering checks retained.
src/lib/Calculations/gablePlasticsGutteringAudit.js
  NEW: read-only eaves/front plastic requirements, single central box-end blank, shared board stock, J-trim, pins, independent side gutters and downpipes.
src/lib/Calculations/gablePlasticsGutteringAudit.test.js
  NEW: five regression tests for stock reuse, independent assemblies, front box end, white/foiled prices, clearance and invalid input.
src/lib/materials.js
  UPDATED: adds gable_box_end_400x1000_white_price and gable_box_end_400x1000_foiled_price with no invented prices.
src/pages/Materials.js
  UPDATED: adds the box-end row to Fascia & soffit accessories, with White and Foiled price inputs.
src/pages/gable/GableDesignPreview.jsx
  UPDATED: shows the clearance notice, manufacturing projection and new read-only audit. Remembers plastics price band and gutter profile choices.

No files retired or deleted. Your customised RoofPlanDiagram is not included.

VALIDATION
123 lightweight Node regression checks passed (Gable geometry/timber/insulation/tiling/plastics plus existing central-boss, steel ordering and Summary paths). JSX/source syntax checked; Gable page evaluated with actual calculation dependencies and both SVG diagrams rendered/inspected.
Complete CRA/Jest/build installation is not available in this workspace. Run locally:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gablePlasticsGutteringAudit.test.js src/lib/Calculations/gableTilingAudit.test.js src/lib/Calculations/gableInsulationAudit.test.js src/lib/Calculations/gableTimberAudit.test.js src/lib/geometry/gableGeometry.test.js src/lib/Calculations/steelTileCourseAudit.test.js src/lib/Calculations/integratedAutomaticRoofTiling.test.js

npm run build

Please copy/paste the new plastics/guttering audit and verify the Materials box-end price fields before integration.
