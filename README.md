# Personal Finance AI Analyst MVP

A polished browser-only MVP for importing transaction CSVs, categorising spending, showing monthly breakdowns, and generating analyst-style insights.

## Run

Open `index.html` in a browser.

## Demo

Use **Load sample data** in the app, or import `sample-transactions.csv`.

## Daily tracking workflow

The MVP now supports live income and expense entry:

1. Add a transaction in the **Live ledger** form.
2. The dashboard updates immediately.
3. Manual entries are saved in the browser with `localStorage`.
4. Use **Export CSV** to download an Excel-ready ledger.
5. Open that CSV in Excel, or re-import it into the app later.

The exported ledger contains `Date`, `Description`, `Category`, `Amount`, and `Source` columns. Imported rows are marked as `import`; in-app entries are marked as `manual`.

## Excel automation path

This static MVP cannot silently write to a local `.xlsx` file because browsers block direct filesystem writes for security. To make Excel update automatically, the next production step would be one of:

- Microsoft 365 + Graph API: app writes each new entry to a OneDrive Excel table, then reads that same table on load.
- Power Automate: submit a simple form, append a row to an Excel table, then export or serve the table as CSV.
- Google Sheets alternative: append rows to a Sheet via Apps Script, then fetch the sheet as CSV.

The current CSV export/import flow keeps the data structure compatible with all three options.

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
- Browser-saved manual ledger entries
- Excel-compatible CSV export
- Rule-based categorisation for common UK transaction descriptions
- Month filter and transaction search
- Total spend, income, net cashflow, top category, and health score
- Category spend breakdown
- Generated insights for overspending, savings opportunities, and behavioural patterns

The insight engine is deterministic for the MVP, so it works without API keys. A real LLM call can be added later behind the same summary data.
