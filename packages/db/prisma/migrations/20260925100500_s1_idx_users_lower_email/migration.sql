-- S1 step 9b: sign-in looks users up by lower(email) = lower($1) -- exact, so
-- '_' and '%' are not wildcards (they are with Prisma's mode: insensitive, which
-- is ILIKE), and indexed (a full scan of users otherwise: 47 ms at 100 k users).
-- CONCURRENTLY: no write lock on users. It cannot run in a transaction, so it is
-- the only statement in this migration. Prisma cannot express an expression
-- index; see the migrations README.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_lower_email_idx" ON "users" (lower("email"));
