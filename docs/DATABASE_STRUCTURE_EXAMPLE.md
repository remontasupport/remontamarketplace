# Worker Registration Database Structure

## Sample Data Structure

When a worker completes registration, the data should be structured like this:

```json
{
  "id": "worker_123456",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "mobile": "0412 345 678",
  "age": "28",
  "gender": "Male",
  "genderIdentity": "Male",
  "languages": ["English", "Mandarin", "Spanish"],
  "location": "Melbourne, VIC",

  "services": [
    {
      "serviceType": "Support Worker",
      "categories": [
        "daily-living",
        "household-tasks",
        "community-participation"
      ],
      "categoryDetails": {
        "daily-living": {
          "title": "Daily Living Assistance",
          "selected": true
        },
        "household-tasks": {
          "title": "Household Tasks",
          "selected": true
        },
        "community-participation": {
          "title": "Community Participation",
          "selected": true
        }
      }
    },
    {
      "serviceType": "Nursing Services",
      "categories": null
    }
  ],

  "experience": "5",
  "introduction": "Passionate about helping others achieve independence...",
  "qualifications": "Certificate III in Individual Support\nFirst Aid Certificate",
  "hasVehicle": "Yes",

  "personalTouch": {
    "funFact": "I love hiking and have climbed Mt. Kosciuszko twice!",
    "hobbies": "Reading, gardening, and cooking",
    "uniqueService": "I bring a warm, patient approach to care...",
    "whyEnjoyWork": "I find joy in making a positive difference..."
  },

  "photos": [
    "https://storage.example.com/workers/worker_123456/photo1.jpg",
    "https://storage.example.com/workers/worker_123456/photo2.jpg"
  ],

  "consents": {
    "profileShare": true,
    "marketing": false
  },

  "createdAt": "2025-10-20T10:30:00Z",
  "updatedAt": "2025-10-20T10:30:00Z",
  "status": "pending_verification"
}
```

## Database Schema (SQL Example)

### Main Tables

#### 1. `workers` table
```sql
CREATE TABLE workers (
  id VARCHAR(255) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  age VARCHAR(10),
  gender VARCHAR(50),
  gender_identity VARCHAR(100),
  languages JSONB, -- ["English", "Mandarin"]
  location VARCHAR(255),
  experience VARCHAR(10),
  introduction TEXT,
  qualifications TEXT,
  has_vehicle VARCHAR(10),
  fun_fact TEXT,
  hobbies TEXT,
  unique_service TEXT,
  why_enjoy_work TEXT,
  consent_profile_share BOOLEAN DEFAULT false,
  consent_marketing BOOLEAN DEFAULT false,
  photos JSONB, -- array of photo URLs
  status VARCHAR(50) DEFAULT 'pending_verification',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. `worker_services` table (for easy filtering)
```sql
CREATE TABLE worker_services (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(255) REFERENCES workers(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL, -- "Support Worker", "Nursing Services", etc.
  has_sub_categories BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(worker_id, service_type)
);

CREATE INDEX idx_worker_services_service_type ON worker_services(service_type);
CREATE INDEX idx_worker_services_worker_id ON worker_services(worker_id);
```

#### 3. `worker_support_categories` table (for Support Worker sub-categories)
```sql
CREATE TABLE worker_support_categories (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(255) REFERENCES workers(id) ON DELETE CASCADE,
  category_id VARCHAR(100) NOT NULL, -- "daily-living", "household-tasks", etc.
  category_title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(worker_id, category_id)
);

CREATE INDEX idx_support_categories_worker_id ON worker_support_categories(worker_id);
CREATE INDEX idx_support_categories_category_id ON worker_support_categories(category_id);
```

## NoSQL Schema (MongoDB Example)

```javascript
// workers collection
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  mobile: "0412 345 678",
  age: "28",
  gender: "Male",
  genderIdentity: "Male",
  languages: ["English", "Mandarin", "Spanish"],
  location: "Melbourne, VIC",

  // Services with nested structure for easy querying
  services: [
    {
      serviceType: "Support Worker",
      hasSubCategories: true,
      categories: [
        {
          categoryId: "daily-living",
          categoryTitle: "Daily Living Assistance"
        },
        {
          categoryId: "household-tasks",
          categoryTitle: "Household Tasks"
        },
        {
          categoryId: "community-participation",
          categoryTitle: "Community Participation"
        }
      ]
    },
    {
      serviceType: "Nursing Services",
      hasSubCategories: false,
      categories: []
    }
  ],

  // Flat arrays for easy indexing and filtering
  serviceTypes: ["Support Worker", "Nursing Services"],
  supportWorkerCategories: ["daily-living", "household-tasks", "community-participation"],

  experience: "5",
  introduction: "Passionate about helping others...",
  qualifications: "Certificate III in Individual Support\nFirst Aid Certificate",
  hasVehicle: "Yes",

  personalTouch: {
    funFact: "I love hiking...",
    hobbies: "Reading, gardening...",
    uniqueService: "I bring a warm approach...",
    whyEnjoyWork: "I find joy..."
  },

  photos: [
    "https://storage.example.com/workers/worker_123456/photo1.jpg",
    "https://storage.example.com/workers/worker_123456/photo2.jpg"
  ],

  consents: {
    profileShare: true,
    marketing: false
  },

  createdAt: ISODate("2025-10-20T10:30:00Z"),
  updatedAt: ISODate("2025-10-20T10:30:00Z"),
  status: "pending_verification"
}
```

### MongoDB Indexes for Fast Queries
```javascript
db.workers.createIndex({ "serviceTypes": 1 });
db.workers.createIndex({ "supportWorkerCategories": 1 });
db.workers.createIndex({ "location": 1 });
db.workers.createIndex({ "email": 1 }, { unique: true });
```

## Example Query Scenarios

### 1. Find all Support Workers who provide Daily Living Assistance
```sql
-- SQL
SELECT DISTINCT w.*
FROM workers w
JOIN worker_services ws ON w.id = ws.worker_id
JOIN worker_support_categories wsc ON w.id = wsc.worker_id
WHERE ws.service_type = 'Support Worker'
  AND wsc.category_id = 'daily-living';
```

```javascript
// MongoDB
db.workers.find({
  serviceTypes: "Support Worker",
  supportWorkerCategories: "daily-living"
});
```

### 2. Find workers who provide Nursing Services OR Support Worker services
```sql
-- SQL
SELECT DISTINCT w.*
FROM workers w
JOIN worker_services ws ON w.id = ws.worker_id
WHERE ws.service_type IN ('Support Worker', 'Nursing Services');
```

```javascript
// MongoDB
db.workers.find({
  serviceTypes: { $in: ["Support Worker", "Nursing Services"] }
});
```

### 3. Find Support Workers who can do Daily Living + Community Participation
```sql
-- SQL
SELECT w.*,
       GROUP_CONCAT(wsc.category_id) as categories
FROM workers w
JOIN worker_services ws ON w.id = ws.worker_id
JOIN worker_support_categories wsc ON w.id = wsc.worker_id
WHERE ws.service_type = 'Support Worker'
GROUP BY w.id
HAVING
  SUM(CASE WHEN wsc.category_id = 'daily-living' THEN 1 ELSE 0 END) > 0
  AND SUM(CASE WHEN wsc.category_id = 'community-participation' THEN 1 ELSE 0 END) > 0;
```

```javascript
// MongoDB
db.workers.find({
  serviceTypes: "Support Worker",
  supportWorkerCategories: { $all: ["daily-living", "community-participation"] }
});
```

### 4. Find Support Workers in Melbourne who provide High Intensity Supports
```javascript
// MongoDB
db.workers.find({
  serviceTypes: "Support Worker",
  supportWorkerCategories: "high-intensity",
  location: { $regex: /Melbourne/i }
});
```

## Key Benefits of This Structure

1. **Easy Filtering**: Flat arrays (`serviceTypes`, `supportWorkerCategories`) allow fast queries
2. **Detailed Information**: Nested structure preserves full category details
3. **Flexible**: Can add new service types without schema changes
4. **Indexed**: Quick lookups on common search criteria
5. **Normalized (SQL)**: Avoids data duplication, maintains referential integrity
6. **Denormalized (NoSQL)**: Fast reads, suitable for search/filter operations

## Recommendation

For your use case, I recommend:
- **MongoDB** if you need flexible schema and fast read operations for search/filtering
- **PostgreSQL with JSONB** if you want relational integrity + JSON flexibility
- Store the flat arrays (`serviceTypes`, `supportWorkerCategories`) for fast filtering
- Keep nested structure for displaying full details to users
