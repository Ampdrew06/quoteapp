Timberlite app name and installed icon — v284

INSTALL THE UPDATE
Copy BOTH src AND public into the matching folders at the root of quoteapp-v2.
public is beside src; do not put public inside src.
This cumulative ZIP includes the previous Schedule/customer/roof changes. No new Supabase SQL is required. Do not re-run the older SQL files just for this branding update.
Publish/deploy the updated app using your existing hosted-app process to make the icon available on phones and other laptops. This ZIP has not itself been deployed to your hosting.

BRANDING
Uses the existing Timberlite roof-and-wordmark logo without redesigning it. Supplied square icons have a white background and retain the full logo. Includes standard 192/512 icons, a separately padded maskable icon, an Apple touch icon, a multi-size Windows/browser favicon, and branded copies of CRA's usual logo image names.
The manifest supplies the name Timberlite and a standalone app window. The installed app opens the normal Home page; the user signs in there before choosing Schedule.
The bootstrap sets the page title and links the manifest, favicon and Apple metadata, so an existing Create React App HTML template does not need to be replaced. All supplied public assets must be deployed with src.

PHONE / DESKTOP INSTALLATION
Open the HOSTED app in a browser that supports installation and use its Install app / Add to home screen option. The browser obtains the Timberlite icon from the app; the user does not need to choose an image manually.
On Windows, prefer Chrome or Edge's browser app-install option for a branded standalone app. A generic Windows URL shortcut may use the browser's icon instead.
An already-created shortcut may retain its old icon. Re-create the shortcut or reinstall the web app if needed; do not clear site data merely to change the icon.
Browser installation prompts/menus vary by browser and device. Installation on your actual devices still needs local verification. This does not create an Android APK or a Windows EXE.

COLLEAGUE'S LAPTOP
Use the same hosted app URL pointing to the same Supabase project. A localhost URL on your PC is not a shared hosted address for his laptop. He does not need a copy of your source code to use an already-published web app.
The shortcut does not grant access. He still needs an authorised saved login. Current Schedule access is administrator-only; a restricted Schedule-only staff role is not part of this icon update. Set up his own appropriate account before sharing access, rather than treating a desktop shortcut as permission.
Saved Schedule records are shared through the configured Supabase database, not through the shortcut. Both machines need connectivity to load/save shared data.

NO OTHER BEHAVIOUR CHANGES
No service worker or offline cache is added. Existing login and remembered-admin checks, financial data, calendar leave records and quote workflows are unchanged. Icon installation does not turn the app into an offline order system.

VERIFICATION
Checks passed for manifest requirements and icon paths, dimensions, maskable safe area, Windows favicon sizes, title/head metadata, repeated boot without duplicate manifests, root/subpath URLs and source parsing.
Full CRA build, hosted deployment and actual browser/phone/desktop installation were not available in this source-only workspace.
Reference: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
