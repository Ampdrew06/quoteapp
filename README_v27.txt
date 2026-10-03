Timberlite Customer Default Delivery Distance — v27

Apply after v26. Copy the enclosed src folder into quoteapp-v2 and replace matching files.
Do not delete your existing src folder. The running app should update automatically.

Fixes:
- Customer defaultDeliveryMilesOneWay maps to the database default_miles column on both save and load.
- Login lookup also returns that saved distance.
- Customer saves upsert the individual UUID instead of deleting/recreating the customer list.
- Customer deletion targets only the selected customer.
- Failed saves display the database error and retain the entered form details.
- Summary uses the customer's default distance when no positive delivery distance is entered.
- An entered distance continues to override the default, matching the existing Design/Options behaviour.

The live database schema cannot be inspected from this workspace.
If saving reports a missing default_miles column, run OPTIONAL_default_distance_column.sql in the Supabase SQL editor, then retry.
No SQL is needed if that column already exists and saving succeeds.
Do not change database permissions speculatively; report the exact save error if another error appears.

Run:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/customerRecords.test.js src/lib/customers.test.js src/lib/Calculations/summaryMaterialsModel.test.js

Verification here: seven customer checks and all 36 preceding pricing/calculation checks passed using Node assertion harnesses.
React compilation, CRA Jest and an actual database save/reload remain to be checked in the installed app.

Live check:
1. Edit the trade customer, enter a default one-way distance (e.g. 10 miles), Save.
2. Leave Customers, return and Edit the same customer: the distance should still be 10.
3. Open the roof Summary with no entered delivery distance: it should show 10 one-way miles.
4. An already entered positive distance takes precedence; it must not be overwritten by the default.
The fuller postcode/default-distance workflow audit remains separate.
