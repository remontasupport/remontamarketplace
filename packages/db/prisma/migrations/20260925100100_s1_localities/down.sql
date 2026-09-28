-- Drops au_localities and au_locality_refreshes.
--
-- What is lost: the suburb rows are reproducible -- re-run localities:refresh from
-- data/au_localities.csv after re-applying the migration (ids will differ, which
-- is why s1_worker_locations must be reversed first). The refresh history is NOT
-- reproducible; export au_locality_refreshes first if it matters.
-- Reverse s1_worker_locations first: its foreign key blocks this drop.
DROP TABLE "au_locality_refreshes";
DROP TABLE "au_localities";
