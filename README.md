# Personal Finance AI Analyst MVP

A polished browser-only MVP for importing transaction CSVs, categorising spending, showing monthly breakdowns, and generating analyst-style insights.

## Run

Open `index.html` in a browser.

## Demo

Use **Load sample data** in the app, or import `sample-transactions.csv`.

## Supported CSV shapes

The importer recognises common bank-export column names:

- Date: `Date`, `Transaction Date`, `Created`, `Booking Date`
- Description: `Description`, `Merchant`, `Name`, `Details`, `Reference`, `Narrative`, `Payee`
- Amount: `Amount`, `Value`, `Transaction Amount`
- Split amount columns: `Money Out`, `Paid Out`, `Debit`, `Withdrawal`, `Money In`, `Paid In`, `Credit`, `Deposit`

Negative amounts are treated as spending. Positive amounts are treated as income.

## MVP scope

- CSV parsing in the browser
- Rule-based categorisation for common UK transaction descriptions
- Month filter and transaction search
- Total spend, income, net cashflow, top category, and health score
- Category spend breakdown
- Generated insights for overspending, savings opportunities, and behavioural patterns

The insight engine is deterministic for the MVP, so it works without API keys. A real LLM call can be added later behind the same summary data.
