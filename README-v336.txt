Timberlite v336 — Combined quotation / order pack and roof illustration

Small update over v335. Extract into the app root (containing src).
Run in PowerShell:
powershell -ExecutionPolicy Bypass -File .\Apply-v336.ps1

The patch keeps your edited email body/signature and existing CSS files.
It replaces the quotation layout and updates the modern order form acceptance.
A backup of CustomerRoofDocument.jsx is made before patching.

Quotation opens with Include order form in PDF checked.
Use browser Save as PDF, not Microsoft Print to PDF:
CAD quotation uses A4 landscape; the following order form uses A4 portrait.
Uncheck the box for CAD only. Order Form tab remains available separately.
One signature on the order form confirms that form and the accompanying CAD,
identified by quote number and reference. No online acceptance feature is added.

The smaller real Timberlite logo appears above company details.
Notes move beneath the CAD. Roof illustration appears below the price.
Illustration geometry uses the selected saved roof dimensions and pitches.
Colours are approximate, not product swatches. The tile pattern is decorative
and must not be used as a tile set-out or quantity calculation.
No windows/vents are invented: their display will be added with their geometry.

Existing saved Summary choices, exclusions and prices continue to be used.
Save design/Summary changes before issuing. Long notes may need extra pages;
review Print Preview. Final mixed-orientation print layout needs confirmation
on your browser. The geometry and document data checks pass locally.
