# Google Sheet → GitHub Pages Live Data Display

A lightweight, read-only website that displays data from a **private** Google Sheet.
Google Sheets stays the only place data is edited; the site just reads it.

```
Google Sheet → Google Apps Script (Web App) → JSON API → GitHub Pages website
```

## Files

```
google-sheet-website/
├── index.html
├── style.css
├── script.js
├── README.md
└── google-apps-script/
    └── Code.gs
```

## 1. Google Sheet configuration

- Spreadsheet ID: `1yagXN_W4QJ9nnwZs1CLi8FRYPZkt5Pt_UCIAaZh8WBc`
- Sheet (tab) name: **Website Data**
- Data range: **A:J**
- **Row 1 = column headings.** Rows below Row 1 = data.
- Headings and row counts are never hard-coded. Rename a heading or add/remove rows in
  the sheet and the website follows automatically.

The sheet does **not** need to be shared publicly. The Apps Script runs as *you*, so it
reads the sheet with your own permissions.

## 2. Google Apps Script setup

1. Open the Google Sheet.
2. **Extensions → Apps Script**.
3. Delete the sample code in `Code.gs` and paste the contents of
   `google-apps-script/Code.gs`.
4. Save (disk icon). Optionally run `doGet` once and approve the permission prompt.

## 3. Deploy the Apps Script as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon → choose **Web app**.
3. Settings:
   - **Description:** `Website Data API`
   - **Execute as:** *Me (your@gmail.com)*
   - **Who has access:** **Anyone**
4. Click **Deploy**, then **Authorize access** and allow the requested permissions.
5. Copy the **Web app URL** — it ends with `/exec`.

> After editing `Code.gs` later, use **Deploy → Manage deployments → edit (pencil) →
> Version: New version → Deploy**, otherwise the old code keeps serving.

Test the URL in a browser: you should see JSON like

```json
{"success":true,"lastUpdated":"2026-08-16T12:00:00.000Z","headers":["Product ID","Product","Quality","Quantity"],"rows":[["1","Wheat","Good","200 Bags"]]}
```

## 4. Where to paste the Web App URL

Open `script.js` and replace **only** this one line (line 8):

```js
const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

with

```js
const API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

Nothing else in the project needs changing.

## 5. GitHub repository setup

1. On GitHub click **New repository**, name it e.g. `stock-data`, keep it public, **Create**.
2. Click **Add file → Upload files** and upload `index.html`, `style.css`, `script.js`,
   `README.md` (and the `google-apps-script` folder if you want it version-controlled).
   Keep `index.html` in the repository root.
3. Commit the changes (**Commit changes** button).

## 6. Enable GitHub Pages

1. Repository → **Settings** (top bar).
2. Left sidebar → **Pages**.
3. Under **Build and deployment → Source** choose **Deploy from a branch**.
4. Branch: **main**, folder: **/ (root)** → **Save**.
5. Wait ~1 minute, then reload the Pages settings page — your live URL appears:
   `https://<username>.github.io/<repository>/`

## 7. How the automatic 2-minute refresh works

- `loadData()` runs immediately when the page opens.
- `setInterval(loadData, 120000);` re-runs it every 120 seconds.
- Each run fetches fresh JSON, compares it with what is on screen and re-renders the
  table only when something changed. The browser page is never reloaded.
- The status bar shows `● Live`, the sheet's **Last updated** timestamp and the
  **Last checked** time.

## 8. Changing the data

Edit the **Website Data** sheet in Google Sheets. Within 2 minutes (or on the next page
load) the website shows the new values. You never edit HTML/JS for data changes.

Adding a column inside A:J with a heading in Row 1 adds a column to the table
automatically.

## 9. Changing the design

All colours live at the top of `style.css`:

```css
--header-bg: #2b3a4a;   /* dark blue-gray table header */
--lime: #9ede3f;        /* green separators */
--body-bg: #eef2f6;     /* light blue-gray table body */
```

Change those values to re-skin the whole table. Row padding, font sizes and the mobile
breakpoint are in the same file.

## 10. Security notes

- The repository contains **no** Google password, OAuth client secret, service-account
  key or API key. Only a public Web App URL.
- **Important:** a Web App set to "Anyone" is reachable by anyone who knows the URL, so
  treat the data returned by the API as public information. Don't put confidential
  columns in A:J of the *Website Data* sheet.
- The sheet itself stays private: visitors can only read the JSON the script returns,
  they cannot open, edit, add or delete anything in the spreadsheet.
- The website is strictly read-only — no forms, buttons, logins or admin panel.

## 11. Troubleshooting

| Problem | Fix |
| --- | --- |
| "Configuration needed" message | `API_URL` in `script.js` is still the placeholder. |
| "Unable to load the latest data" | Open the Web App URL directly in a browser. If it shows a Google sign-in page, redeploy with **Who has access: Anyone**. |
| CORS error in the console | Make sure the URL ends with `/exec` (not `/dev`) and that you did not add custom headers to the fetch. Apps Script `/exec` endpoints allow cross-origin GET requests. |
| `Sheet "Website Data" was not found` | The tab name must match exactly, including the space and capitals. |
| Table is empty | Row 1 must contain headings, and data must start in Row 2 within columns A:J. |
| Old data keeps showing | You edited `Code.gs` but deployed no **New version** (Manage deployments → pencil → New version). |
| Changes to files not visible on GitHub Pages | Wait a minute and hard-refresh (Ctrl/Cmd + Shift + R). |

No dependencies, no build step, no server other than Google Apps Script.