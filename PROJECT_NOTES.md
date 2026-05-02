# Project Notes

This project is a personal finance tool and portfolio piece.

## Design Decisions

- Used a static frontend to keep deployment simple through GitHub Pages.
- Used Google Sheets as the live ledger because it is easy to inspect, edit, and automate.
- Used Apps Script instead of a custom backend to keep the first live version lightweight.
- Kept categorisation deterministic so the app works without API keys.
- Prioritised daily expense entry over CSV import because that is the primary personal workflow.

## Known Tradeoffs

- Apps Script URL security is link-based in this MVP.
- The app does not connect directly to bank accounts.
- Category rules are simple keyword matches.
- Service worker caching may briefly show older UI after deployment.
- Local settings are per browser/device.

## Employer-Facing Summary

This is a realistic MVP: small enough to ship quickly, but complete enough to show an end-to-end workflow from data capture to automated storage to analysis UI.
