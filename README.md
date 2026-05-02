# Personal Finance AI Analyst MVP

A polished browser-only MVP for importing transaction CSVs, categorising spending, showing monthly breakdowns, and generating analyst-style insights.

## Run

Open `index.html` in a browser.

For phone/laptop access, host the repo with GitHub Pages or any static host. The app includes a basic web app manifest and service worker so it can be installed from a mobile browser once served over HTTPS.

## Demo

Use **Load sample data** in the app, or import `sample-transactions.csv`.

## Live daily tracking workflow

The intended live workflow is:

1. Open the web app from phone, laptop, or any browser.
2. Add an income or expense in the **Live ledger** form.
3. The entry is posted to a Google Sheet through an Apps Script web app.
4. The tracker pulls the spreadsheet feed on load and whenever the configured refresh window has passed.
5. Set the refresh window to 24 hours for a daily finance tracker pull.

If live sync is not configured, entries are saved locally in the browser with `localStorage` and can still be exported as CSV.

## Google Sheets live setup

1. Create a Google Sheet.
2. Open **Extensions > Apps Script**.
3. Paste the contents of `google-apps-script/Code.gs`.
4. Save the script.
5. Deploy it with **Deploy > New deployment > Web app**.
6. Set **Execute as** to yourself.
7. Set **Who has access** to anyone with the link.
8. Copy the web app URL.
9. In the tracker, paste that URL into both **Spreadsheet write URL** and **Spreadsheet read URL**.
10. Click **Save**, then **Sync now**.

The Apps Script creates a `Transactions` sheet with these columns:

- `Id`
- `Date`
- `Description`
- `Category`
- `Amount`
- `Source`
- `Created At`

Anyone with the Apps Script URL can submit rows, so treat the URL as private. For a production version, add authentication with a backend or Microsoft/Google OAuth.

## Excel automation path

The current live MVP uses Google Sheets because it is the fastest route to a cross-device spreadsheet-backed app. For true Excel-native automation, the next production step is Microsoft 365 + Graph API: the app writes each new entry to a OneDrive Excel table, then reads that same table on load.

## Supported CSV shapes

The importer recognises common bank-export column names:

- Date: `Date`, `Transaction Date`, `Created`, `Booking Date`
- Description: `Description`, `Merchant`, `Name`, `Details`, `Reference`, `Narrative`, `Payee`
- Amount: `Amount`, `Value`, `Transaction Amount`
- Split amount columns: `Money Out`, `Paid Out`, `Debit`, `Withdrawal`, `Money In`, `Paid In`, `Credit`, `Deposit`

Negative amounts are treated as spending. Positive amounts are treated as income.

## MVP scope

- CSV parsing in the browser
- Manual income and expense entry
- Google Sheet backed live ledger
- 24-hour configurable spreadsheet pulls
- Browser-saved fallback ledger entries
- Excel-compatible CSV export
- Rule-based categorisation for common UK transaction descriptions
- Month filter and transaction search
- Total spend, income, net cashflow, top category, and health score
- Category spend breakdown
- Generated insights for overspending, savings opportunities, and behavioural patterns

The insight engine is deterministic for the MVP, so it works without API keys. A real LLM call can be added later behind the same summary data.
