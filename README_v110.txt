Timberlite v110 — Manufacture navigation continuity
Apply over v109: copy src into quoteapp-v2 and replace included files.

Removed the extra Summary / Design/Options / Print manufacture book control row from Gable and Edwardian. Use the shared top navigation and its Print button.

All roof styles now use Home → Design/Options → Manufacture Book → Technical, followed by the existing tabs. Edwardian's tab is renamed Manufacture Book to match the others. Trade visibility remains unchanged.

Navigation order, header Print presence, trade permissions and syntax checks passed. Existing Gable/Lean-To UI and Edwardian book/save checks passed. This is a navigation-only change; no calculations or printed book content change.

Run npm run build, then check the top tabs on each style and confirm no extra controls remain below the Gable / Edwardian navigation.
