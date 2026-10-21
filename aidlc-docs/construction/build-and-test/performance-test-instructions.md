# Performance test instructions: onboarding-tour (2026-10-21)

**Not run, by decision** (NFR design Q4 A): one read per home visit, one row by a unique key; one save per worker in
the tour's lifetime (at most one retry). The worker area's existing limits and capacity apply. What to watch after the
release: Cloud Logging `jsonPayload.entry="worker.getTour"` durations, and the existing latency policy.
