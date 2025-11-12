# Migration Script - When Do You Need It?

## Quick Answer

**For NEW installations:** ❌ NOT NEEDED  
**For UPGRADES from old version:** ✅ YES, run it

---

## Explanation

### The `pdf_hasher_content_only.py` Script

Already includes the complete schema:
```python
def create_table(self):
    create_table_query = """
    CREATE TABLE IF NOT EXISTS pdf_hashes (
        id SERIAL PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_hash VARCHAR(128) UNIQUE NOT NULL,
        file_size BIGINT NOT NULL,
        hash_algorithm VARCHAR(50) NOT NULL,
        content_only BOOLEAN DEFAULT TRUE,    ← Already included!
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_hash UNIQUE (file_hash)
    );
    """
```

**What this means:**
- First time running the script → Creates table with all columns
- Table already exists → Does nothing (`IF NOT EXISTS`)
- **No migration needed for new installations!**

---

## When You NEED `migrate_add_content_only.py`

### Scenario: Upgrading from Old Version

**If you:**
1. Previously used the old `pdf_hasher.py` (before content-based hashing)
2. Already have a `pdf_hashes` table in your database
3. That table is missing the `content_only` column

**Then:**
```bash
.venv/bin/python migrate_add_content_only.py
```

**What it does:**
```sql
ALTER TABLE pdf_hashes 
ADD COLUMN content_only BOOLEAN DEFAULT FALSE;
```

**Why FALSE as default?**
- Existing records were created with file-based hashing (old method)
- Marks them as `content_only = FALSE` for historical accuracy
- New records will be `content_only = TRUE`

---

## Decision Tree

```
Do you have an existing pdf_hashes table?
│
├─ NO → Skip migration, run main script
│        ✓ Table created automatically with all columns
│
└─ YES → Does it have a 'content_only' column?
         │
         ├─ YES → Skip migration, you're good!
         │
         └─ NO → Run migration script
                  ✓ Adds missing column
                  ✓ Sets existing records to FALSE
```

---

## For Testing on Another Machine

### Instructions to Share

**Simple version (for most users):**
```bash
# Just run the main script - it handles everything!
./run_hasher.sh
```

**Advanced version (if they have old table):**
```bash
# Check if you need migration:
# 1. If fresh installation → No migration needed
# 2. If upgrading from old version → Run migration

# Run migration (if needed):
.venv/bin/python migrate_add_content_only.py

# Then run main script:
./run_hasher.sh
```

---

## Summary

| Situation | Need Migration? | Action |
|-----------|----------------|--------|
| **New installation** | ❌ NO | Just run `./run_hasher.sh` |
| **Fresh NeonDB database** | ❌ NO | Just run `./run_hasher.sh` |
| **Upgrading from old pdf_hasher.py** | ✅ YES | Run migration, then main script |
| **Table exists, has content_only column** | ❌ NO | Just run `./run_hasher.sh` |

---

## How to Check If You Need Migration

```bash
# Connect to your NeonDB and run:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'pdf_hashes' AND column_name = 'content_only';
```

**Result:**
- Returns `content_only` → You're good, skip migration
- Returns empty → Run migration
- Table doesn't exist → Skip migration (will be created)

---

## Bottom Line

**For 99% of test users:** Just run `./run_hasher.sh` - no migration needed!

The migration script is included for completeness and for anyone upgrading from an earlier version of the project.
