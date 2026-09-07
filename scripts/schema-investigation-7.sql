-- ============================================================================
-- Geographic Coverage — Sizing (round 7)
-- ============================================================================
-- Measures what SR-R8 needs, and corrects a figure stated without measurement:
-- AD-15 claimed "767 workers have null coordinates". That was never queried.
--
-- READ-ONLY. Aggregate counts and coarse geographic buckets only.
-- ============================================================================

-- 1. THE CORRECTION — how many workers actually have coordinates?
SELECT count(*)                                                        AS worker_profiles,
       count(*) FILTER (WHERE latitude IS NOT NULL
                          AND longitude IS NOT NULL)                   AS has_coordinates,
       count(*) FILTER (WHERE latitude IS NULL
                           OR longitude IS NULL)                       AS NULL_COORDINATES,
       count(*) FILTER (WHERE (latitude IS NULL OR longitude IS NULL)
                          AND location IS NOT NULL)                    AS has_location_but_no_coords
FROM worker_profiles;

-- 1b. Of those with no coordinates, how many are otherwise complete enough to matter?
SELECT count(*)                                                        AS uncoordinated,
       count(*) FILTER (WHERE "isPublished")                           AS published,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM worker_services ws
                                      WHERE ws."workerProfileId" = wp.id)) AS declared_services
FROM worker_profiles wp
WHERE latitude IS NULL OR longitude IS NULL;

-- 2. Geographic spread — how many distinct states and cities?
--    Sizes the seeded service-area set and sanity-checks the bbox cap.
SELECT state, count(*) AS workers, count(DISTINCT city) AS distinct_cities
FROM worker_profiles
WHERE state IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC;

-- 3. Coordinate sanity — any values outside Australia?
--    AU is roughly lat -44..-10, lng 112..154.
SELECT count(*)                                                        AS with_coords,
       count(*) FILTER (WHERE latitude  BETWEEN -44 AND -10
                          AND longitude BETWEEN 112 AND 154)           AS inside_australia,
       count(*) FILTER (WHERE NOT (latitude  BETWEEN -44 AND -10
                               AND longitude BETWEEN 112 AND 154))     AS OUTSIDE_AUSTRALIA,
       count(*) FILTER (WHERE latitude = 0 AND longitude = 0)          AS null_island
FROM worker_profiles
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Duplicate anchors — how many workers share a coordinate?
--    Tells us whether suburb-level anchoring is already the de facto model.
SELECT round(latitude::numeric, 3)  AS lat_3dp,
       round(longitude::numeric, 3) AS lng_3dp,
       count(*)                     AS workers
FROM worker_profiles
WHERE latitude IS NOT NULL
GROUP BY 1,2 HAVING count(*) > 5
ORDER BY 3 DESC LIMIT 20;

-- 5. Service requests — is `location` free text, and does it look geocodable?
SELECT count(*)                                            AS requests,
       count(DISTINCT location)                            AS distinct_locations,
       count(*) FILTER (WHERE location ~ '\d{4}')          AS contains_a_postcode
FROM service_requests;

-- 6. Do participants carry a location too? (deciding whether to geocode them)
SELECT count(*)                                    AS participants,
       count(location)                             AS has_location,
       count(DISTINCT location)                    AS distinct_locations
FROM participants;

-- ============================================================================
-- END — no writes performed
-- ============================================================================
