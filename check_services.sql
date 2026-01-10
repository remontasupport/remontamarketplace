-- Check this worker's services
SELECT 
  ws.id,
  ws.categoryName,
  ws.createdAt,
  wp.firstName
FROM worker_services ws
JOIN worker_profiles wp ON ws.workerProfileId = wp.id
WHERE wp.firstName = 'Test'
ORDER BY ws.createdAt ASC;
