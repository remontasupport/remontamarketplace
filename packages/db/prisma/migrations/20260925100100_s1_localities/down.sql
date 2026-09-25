-- Drops au_localities and its data. The data is reproducible: re-run
-- localities:refresh from data/au_localities.csv after re-applying the migration.
-- Reverse s1_worker_locations first: its foreign key blocks this drop.
DROP TABLE "au_localities";
