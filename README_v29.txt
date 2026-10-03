Timberlite — Boss centre and complete wallplate geometry v29

SUPERSEDES v28. v28 was held because it retained the old side pitch and did not correct the boss-centre reference. Do not apply v28. This package includes everything needed to apply directly over v27, or to replace v28 if it was applied.

INSTALL
Merge src into your quoteapp-v2/src and replace the included files. Keep all other project files. The app should hot reload normally.

CORRECTED RULE
Boss setting-out position means the CENTRE B of the timber joint, as shown in Andrew's CAD.
Default B = internal projection / 2, measured horizontally inward from each internal side-frame line. For 2885mm projection this is exactly 1442.5mm.
An explicit side pitch instead moves that same boss centre B. Other explicit centre-distance inputs are still supported.
The old rounded default 1443mm is restored to 1442.5mm. Other supplied positions are retained.

SIDE PITCH
The horizontal wallplate underside is determined by the front pitch, with the wallbar feet on the 40mm ring-beam. For an equal-depth mitre:
C = rise / tan(side pitch)
A = C - member depth * tan(side pitch / 2)
B = (A + C) / 2
The solver determines side pitch from B, or determines B from an explicit side pitch. It uses an analytic solution, not an empirical allowance.

SHARED ASSEMBLY
Wallbar endpoints are reconstructed above the ring-beam. The horizontal member is measured between the same finished endpoints. Technical and D/O visualisers use the same assembly as Manufacture. All returned legacy and resolved boss/hip positions now use B, so front rafters, jacks, hip profiles and roof facets consume the same centre. Invalid boss locations or inconsistent assembly geometry do not produce horizontal wallplate cut lengths.

ORDERED ROOF — NEW MATCHED SET
4050 x 2885 internal, 15-degree front pitch, both hips, specified 100mm side-soffit envelope, 220mm members, 40mm ring-beam:
Boss centre B: 1442.5mm each side
Side pitch: 27.744049 degrees (previously approximately 28.178519)
Joint top A: 1415.334743mm each side
Joint bottom C: 1469.665257mm each side
Horizontal top EWPL: 1219.330513mm
Horizontal bottom IWPL: 1110.669487mm
Wallbar external EWBS: 1772.057589mm
Wallbar internal IWBS: 1660.571177mm
VFC: 168.100555mm
HFC: 153mm
Underside height: 813.033420mm; top height: 1033.033420mm
Top saw cut off square: 13.872025 degrees

IMPORTANT PHYSICAL LIMIT
These dimensions form a NEW MATCHED ASSEMBLY. The side pitch and wallbar cuts change as well as the horizontal section. The 1262.5mm suggested replacement for the existing wallbars is not the target for this revised geometry. Do not combine the new horizontal cut with the old wallbars. The approximately 27mm observed gap in the old assembly remains unexplained; no empirical 27mm correction has been applied.
The new assembly has been validated mathematically, not rebuilt and physically verified. Compare the complete revised set on the factory floor before using it for this ordered job.

OTHER MATERIALS
Side-pitch and boss corrections flow through dependent geometry, Summary quantities, installed area/weight and pricing. These can change. The existing timber hardware allowances and physical hip-profile formulas have not been re-tuned to match any price or old gap.

HISTORICAL CAD COMPARISON
The old automatic-tiling integration test treated a floor-foot TOP intersection as the boss and checked a historical CAD hip profile within 20mm. That assumption conflicts with the newly confirmed centre-B definition. Its test now independently reconstructs B and checks the hip plan length against that physical centre. The separate historical CAD audit and its reference measurements remain unchanged.
For the older 5870 x 3230 roof with explicit 25-degree sides, the historical floor-top offset is approximately 1893.0mm while centre B is now approximately 1831.6mm. The V2 external hip slope becomes approximately 3845.9mm versus the historical 3885mm reference. That difference still requires physical/hardware verification; passing the calculation tests is not a claim that every historical CAD measurement has been reproduced.
The plasterboard regression fixture was also updated from 106.33kg to 106.17kg because its installed facet area changes with the corrected default side pitch.

LOCAL CHECKS
96 geometry/manufacturing checks and 36 material/pricing checks passed through local assertion harnesses, including independent ray intersections, matching mitre endpoints, boss/pitch round-trips, shared plan and rafter centres, single hips, unequal pitches, ring-beam datums, invalid geometry, ordinary Lean-To isolation and Summary pricing controls. This is not a CRA test run or React compilation; the supplied workspace has no React build dependencies.

RUN IN YOUR WINDOWS PROJECT
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/geometry/wallplateBossGeometry.test.js src/lib/geometry/wallplateAssemblyGeometry.test.js src/lib/geometry/hippedWallplateSawSettings.test.js src/lib/Calculations/automaticRoofTiling.test.js src/lib/Calculations/miscellaneousSummaryIntegration.test.js src/lib/Calculations/summaryMaterialsModel.test.js

Check app compilation and that Technical/Manufacture display the same B, EWPL, IWPL and wallbar cuts. If an explicit side pitch is entered, it must move B consistently in the plan and assembly. Default/no override must retain B at projection / 2.
