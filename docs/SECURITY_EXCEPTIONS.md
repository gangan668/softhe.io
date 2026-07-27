# Security audit exceptions

## React Router RSC CSRF advisory

- Advisory: `GHSA-qwww-vcr4-c8h2`
- Allowed version: `react-router-dom@7.18.1` only
- Scope: `react-router` and its direct `react-router-dom` audit finding only
- Added: 2026-07-27
- Review trigger: a patched React Router release, a change in advisory scope, or adoption of React Server Components/server actions

Softhe.io is a client-rendered Vite application using `BrowserRouter`, `Routes`, `Route`, and
client navigation helpers. It does not use React Server Components, React Router RSC APIs, route
actions, or server actions. The advisory affects RSC mode, so the vulnerable execution path is not
present in this application.

Downgrading to `7.11.0` is not acceptable because that release is affected by multiple older
high-severity XSS, remote-code-execution, and denial-of-service advisories. Until React Router
publishes a release outside the new advisory range, CI uses `scripts/audit-policy.js` to:

- require the exact `7.18.1` pin;
- accept only `GHSA-qwww-vcr4-c8h2`;
- fail on every additional advisory or vulnerable package;
- fail if the audit becomes clean, forcing removal of this exception;
- fail if the pinned version changes.

This exception does not authorize React Server Components or server actions. Introducing either
requires removing the exception and completing a fresh security review first.
