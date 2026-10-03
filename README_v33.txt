v33 — Vercel undefined-name build fixes

Extract over quoteapp-v2 preserving src folders.

Declares the standard globalThis global for the older ESLint configuration in the two storage helpers. Imports and calls the existing computeLiteSlateLeanTo calculator and saveQuote cloud function in Design/Options. No geometry, quantities or price rules changed.

Validation: all three modules pass Babel transformation; binding checks confirm the reported missing references are resolved. 44 local material/checklist regression checks passed. Full CRA production build is not available in this workspace.

Run on Windows before committing:
set CI=false&& npm run build

If successful, commit and push these changes through GitHub Desktop. Vercel should build the new commit automatically. The npm upgrade and Browserslist notices in the original log are unrelated to these failures.
