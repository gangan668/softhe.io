# Dependency, performance and benchmark repairs

The source-map-js lockfile entry changes only from 1.2.1 to 1.2.2. `npm run audit:ci` now reports zero vulnerabilities. No unrelated dependency version changed.

## Asset budgets

Vite now emits a build manifest. The budget walks each selected route's static imports and CSS transitively and deduplicates shared chunks. It does not mistake every dynamic import for initial startup. Missing import entries fail the check.

The original public limit remains 120 KiB gzip JavaScript and 24 KiB gzip CSS. Public routes avoid authentication SDK startup when there is no stored session or callback. Portal startup has a separate explicit 140 KiB JavaScript limit and the same 24 KiB CSS limit, plus an independent 60 KiB SDK limit. The portal limit reflects the measured 79,600-byte shared entry, 56,035-byte SDK, and up to 4,595 bytes of required route code. It is not an increase of the public limit. Route code, transitive shared imports and associated CSS are included for login, password recovery, account, staff admin and checkout.

An integration build measured public homepage 79,600 bytes JS / 8,866 bytes CSS, largest public route FAQ 85,502 bytes JS, and account startup 140,230 bytes JS / 10,749 bytes CSS. Re-run `npm run build` and `npm run budget` after integration to record the exact final numbers.

Regression tests cover transitive and cyclic imports, shared chunk deduplication, CSS, dynamic SDK exclusion for anonymous startup, missing chunks, and oversized public, SDK and portal scenarios.

## Raw benchmark evidence

The public ZIP was downloaded directly from the URL in `docs/benchmark-evidence.json`. Its SHA256 is `7ffd5cfb4816fc581f359d96c0e9e6aa76f83c15a81a2aafe7bfae4b4c183de6`, exactly matching that manifest, with 8,086,382 bytes. It contains four original CapFrameX captures and an embedded manifest with matching medians.

`node scripts/verify-raw-benchmark.js` checks the downloaded archive, capture names/hashes, valid frame times, run arithmetic and manifest medians. Each capture's average FPS and 99th percentile frame-time FPS matches the published rounded figures within 0.005 FPS. The detailed calculations are in `benchmark/verification.json`.

The published "1% low" is the 99th percentile frame time converted to FPS, not the mean of the slowest one percent of frames. This distinction is now stated on the methodology page. Archive integrity and arithmetic do not establish the authenticity of the original capture procedure. The exact CS2 build and chipset-driver versions were not recorded. Windows edition, memory settings, BIOS profile and GPU driver changed together. These limitations remain visible.

Homepage, store and performance use one publication status and download link, backed by the same checked evidence manifest. The methodology no longer substitutes environment-dependent placeholders for published evidence.

## Whole-source coverage inventory

`npm run test:coverage:inventory` records all production `src/**/*.js` and JSX modules, including files untouched by tests, separately under `coverage/inventory`. It does not lower the existing focused quality gate. The inventory has no pass threshold because its purpose is to expose gaps, not claim all source is sufficiently tested. One integration run passed 387 tests and reported 81.16% lines, 71.07% branches, 73.94% statements and 67.44% functions. Final integration may add tests; repeat before release. Browser coverage and real-provider verification remain separate evidence.

## Consented route measurement and shared entry reduction

The budget also measures consented public routes, stored-session public routes with the SDK, and direct private routes without analytics. The fixed public analytics allowlist excludes unknown/404, auth, account, admin and checkout paths. All JavaScript and CSS import graphs are counted with the existing caps.

A separate publication module imports only the archive metadata from the evidence JSON. Home, store and the shared download link use that module, separating publication UI from the detailed methodology. Rollup may still place shared JSON fields in a common benchmark chunk. This preserves all user-facing evidence while reducing the shared entry. A separate output-directory integration build measured 79,825 bytes public homepage JS, 81,128 bytes consented homepage JS, 143,065 bytes consented stored-session FAQ JS and 140,945 bytes direct account JS. All graph budgets passed. Final strict enabled/disabled fixture builds must remeasure exact release values.

Home now loads through the same route-level lazy boundary as other pages. Budget homepage scenarios explicitly include its dynamic entry, transitive imports and styles, so the homepage budget continues to measure its full startup. Other routes no longer download Home code or styles. An isolated build with the exact configured portal fixture and legal values measured 140,043 bytes consented authenticated FAQ JS, 137,920 bytes direct account JS, 81,470 bytes complete homepage JS and 82,773 bytes consented homepage JS. All budgets passed without increasing caps. Shared archive links use the site's readable accent color, underline and a visible keyboard focus outline. Root integration browser review remains required.
