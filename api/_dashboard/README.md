# Product Board data

`data.json` is the only file a daily update needs to change. The page at /dashboard is built from it on the server.

- The four counts at the top are worked out from the lists, so they can't drift: Needs a decision, In progress, On hold, Done this week.
- Each item: `title` (required), `owner` (optional: set it only when Greg or Rachael has explicitly claimed the item; shown as "Owner: Greg"), `meta` (small grey text), `lead` (a date shown at the left), `status` (label), `tone` (`danger`, `warning`, `success`, or leave out for plain).
- Sections: `needsDecision`, `inProgress`, `onHold`, `doneThisWeek`, plus `howApprovalsWork` (plain sentences) and `asOf` (shown under the title).
- Plain English only. No passwords, keys, test accounts, user data, commit IDs or branch names.
- `legacy-encrypted-dashboard.html` is the old password-in-the-browser page, kept for reference. It is not served.
