# Custom benchmark evidence runbook

The published FPS figures must be reproducible measurements, not values copied from the existing
summary charts. Keep the commercial release gate pending until this runbook has been completed.

## Capture

1. Copy `benchmark-evidence.template.json` to `benchmark-evidence.json`.
2. Record the exact CPU, GPU, motherboard, memory, storage, cooling, BIOS, drivers, Windows build,
   game build, resolution, graphics settings, measurement tool, scenario, and warm-up procedure.
3. Capture at least two stock runs and two optimized runs. Use the same machine, game build,
   settings, scenario, warm-up, and capture duration for every run.
4. Save an unedited result screenshot or exported capture for every run and reference it from
   `rawEvidence`. Preserve failed or anomalous runs; rerun only for a documented technical reason.
5. Enter average FPS and 1% low FPS for every run. Do not manually choose the published result.

## Verify and publish

From `react-app`, run:

```powershell
npm run benchmark:verify
```

The validator rejects placeholders, missing raw evidence, fewer than two runs per profile,
non-positive measurements, 1% lows above the average, duplicate run IDs, and reported figures that
do not equal the calculated medians.

After the command passes:

1. Set the six `VITE_BENCHMARK_*` values from the verified methodology.
2. Update site claims and charts to the calculated medians.
3. Have a named reviewer compare the page, manifest, and every raw capture.
4. Record the immutable evidence references and review timestamp under
   `benchmark.methodology-and-raw-runs` in `launch-evidence.json`.
