# Product Board data

`data.json` is the only file a daily update needs to change. The page at /dashboard is built from it on the server.

- The four counts at the top are worked out from the lists, so they can't drift: Waiting on Greg, Waiting on Rachael, In progress, Done this week.
- Each item: `title` (required), `meta` (small grey text), `lead` (a date shown at the left), `status` (label), `tone` (`danger`, `warning`, `success`, or leave out for plain).
- Sections: `waitingOnGreg`, `waitingOnRachael`, `inProgress`, `onHold`, `doneThisWeek`, plus `howApprovalsWork` (plain sentences) and `asOf` (shown under the title).
- Plain English only. No passwords, keys, test accounts, user data, commit IDs or branch names.
- `legacy-encrypted-dashboard.html` is the old password-in-the-browser page, kept for reference. It is not served.
