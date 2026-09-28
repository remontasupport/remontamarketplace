# Burst test (S1 step 5b)

`burst.js` sends **20 sign-ups/s for 20 s** at one instance, about 5× what one
thread can hash at bcrypt cost 12. At the same time it sends 2 health checks/s to
see whether the instance still answers anything else.

`harness.ts` is the real `createApp` and pipeline with a sign-up-shaped endpoint.
It does one bcrypt cost-12 hash per request and uses no database. The real
registration endpoint is burst-tested in step 12.

```bash
# terminal 1 (apps/api)
PROTECT=on PORT=4100 node --import tsx load/harness.ts        # or PROTECT=off
# terminal 2
k6 run -e BASE_URL=http://127.0.0.1:4100 --summary-export=out.json load/burst.js
```

Kill the harness by port before the next run. `npx tsx` leaves a child process
holding the port, and one invalid run on 2026-09-25 measured the wrong server
because of it.

## Results, 2026-09-25

Local Windows machine (16 cores), k6 on the same machine.

| Configuration | Health checks OK | Health latency med / p95 | Sign-ups accepted | Accepted latency med / p95 | Other sign-ups |
|---|---|---|---|---|---|
| **No protection.** bcryptjs on the event loop, as `apps/app` does today | 100% | **6.0 s / 22 s** | 25% | 22.8 s / 24.5 s | time out at 30 s |
| Shedding + bulkhead, hashing still on the event loop | **24%** | 32 ms / 156 ms | 13% | 1.4 s / 2.3 s | fast 503 |
| **Shedding + worker-thread hashing, 2 threads**, health exempt | **100%** | **1 ms / 2 ms** | 33% (~6.6/s) | 1.6 s / 1.6 s | fast 503 + Retry-After |
| Same, **4 threads** | 100% | 1 ms / 2 ms | 64% (~12.8/s) | 1.7 s / 1.7 s | fast 503 + Retry-After |

## What this showed

1. **Hashing on the event loop is the failure mode.** While bcryptjs runs, the
   process cannot even accept connections, so requests wait in the OS queue where
   nothing in the process can see them. Health checks took up to 22 s, and a load
   balancer would have restarted a healthy instance.
2. **In-process shedding does not help while the loop is blocked.** It turned the
   hangs into fast 503s, but it also shed the health check.
3. **With hashing in worker threads,** the event loop stays free and the health
   check answers in 1–2 ms. Accepted sign-ups finish in a bounded ~1.6 s, and
   overflow gets an immediate 503 with `Retry-After` that the page can retry.
   Capacity scales linearly with threads: about 3.3 sign-ups/s each.
   `HASH_CONCURRENCY` defaults to cores − 1, at most 8.
4. **Beyond one instance** the lever is horizontal scaling (Infrastructure
   Design). A message queue such as Kafka would not change any of this: the
   sign-up response needs the hash, and the slow side effects already go through
   the outbox.

Sizing: the global limit on sign-ups is 500 per hour, about 0.14/s sustained. One
instance with 2 hash threads absorbs bursts about 45× that rate.
