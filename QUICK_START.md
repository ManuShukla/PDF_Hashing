## 🚀 Quick Start Checklist for Testing on Another Machine

Copy and paste this checklist for your colleague:

---

### ✅ Pre-Testing Setup (5-10 minutes)

```bash
# 1. Navigate to project directory
cd ~/Desktop/resumeHashingPOC

# 2. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up NeonDB connection
# - Go to https://neon.tech (sign up if needed)
# - Create a project
# - Copy connection string
# - Create .env file:
cp .env.example .env
nano .env  # or use any text editor

# 5. Add your NeonDB connection string to .env:
DATABASE_URL=postgresql://username:password@host.neon.tech/neondb?sslmode=require

# 6. (OPTIONAL) Only if upgrading from old version:
# .venv/bin/python migrate_add_content_only.py
# Skip this for new installations - the main script handles it!

# 7. Verify you have a PDF file to test
# Update PDF path in pdf_hasher_content_only.py (line ~373) if needed
```

---

### ▶️ Run the Test

```bash
# Make script executable (if needed)
chmod +x run_hasher.sh

# Run the comparison
./run_hasher.sh
```

---

### 📊 What You Should See

1. **Algorithm Comparison** - Tests 5 hash algorithms:
   - BLAKE2B
   - SHA-256
   - SHA-512
   - SHA3-256
   - SHA3-512

2. **Performance Table** - Shows:
   - Time taken (ms)
   - Throughput (MB/s)
   - Hash output bits
   - Relative speed

3. **Hash Outputs** - Sample hashes from each algorithm

4. **Database Storage** - Stores hash with BLAKE2B (recommended)

5. **Duplicate Detection** - Run twice to see it detect duplicates

---

### ✅ Success Indicators

You'll know it's working when you see:

```
🏆 Fastest: [Algorithm Name] ([X]ms)
🔒 Most Bits: [Algorithm] (512 bits)

✅ Best for PDF Deduplication: BLAKE2B
   • Fast performance
   • 512-bit output (excellent collision resistance)
   • Modern design for hashing
   • Content-based = metadata independent
```

And:
```
✓ Hash stored successfully with ID: [number]
```

---

### 🧪 Additional Tests

#### Test 1: Duplicate Detection
```bash
./run_hasher.sh  # Run once - stores hash
./run_hasher.sh  # Run again - detects duplicate
```

Expected on second run:
```
⚠ Hash already exists in database!
  Stored: No (duplicate)
```

#### Test 2: Metadata Independence
```bash
.venv/bin/python compare_content_vs_file_hashing.py
```

Expected result:
```
Content-Based Hashing:
  File 1 hash: [hash]
  File 2 hash: [same hash]
  Match: True ✓
```

---

### ⚠️ Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: PyPDF2` | Use `.venv/bin/python` not `python3` |
| `DATABASE_URL not configured` | Check `.env` file exists and has connection string |
| `File not found` | Update `PDF_FILE_PATH` in script (line ~373) |
| `Permission denied` | Run `chmod +x run_hasher.sh` |

---

### 📝 Testing Checklist

Copy this and check off as you go:

```
□ Python 3.8+ installed
□ Project files downloaded/copied
□ Virtual environment created (.venv folder exists)
□ Virtual environment activated (prompt shows .venv)
□ Dependencies installed (pip install completed)
□ NeonDB account created
□ .env file created with connection string
□ Database migration run successfully
□ Test PDF file available
□ Script runs without errors
□ All 5 algorithms tested
□ Performance comparison displayed
□ Hash stored in database
□ Duplicate detection works on second run
□ Compare script runs successfully
```

---

### 🎯 Expected Performance (1.26 MB PDF)

Your results may vary based on CPU, but typical ranges:

| Algorithm | Time | Notes |
|-----------|------|-------|
| SHA-256 | 2-6s | Fastest on CPUs with SHA-NI |
| SHA-512 | 4-6s | Good on 64-bit systems |
| BLAKE2B | 5-15s | Content parsing overhead |
| SHA3-256 | 5-16s | Newer standard |
| SHA3-512 | 6-18s | Most secure |

**Note:** Content-based hashing is slower than file-based because it parses PDF structure, but this is the correct approach for deduplication.

---

### 📞 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review error messages (they're designed to be helpful)
3. Verify `.env` file format matches example
4. Ensure PDF file path is correct

---

### 🎉 Test Complete!

You've successfully tested when:
- ✅ All algorithms run without errors
- ✅ Performance comparison shows results
- ✅ Hash is stored in database
- ✅ Second run detects duplicate
- ✅ You understand why BLAKE2B is recommended

**Time to complete:** 10-15 minutes

---

**Questions? Check the full documentation in `README.md` and `METADATA_EXPLANATION.md`**
