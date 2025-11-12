# Test Instructions Summary

## For You to Share With Another Person

Send them these 3 files from the project:
1. **QUICK_START.md** - Simple checklist
2. **SETUP_GUIDE.md** - Detailed instructions  
3. **requirements.txt** - Dependencies list

---

## Quick Email Template

```
Subject: PDF Hasher Testing - Setup Instructions

Hi [Name],

I need you to test a PDF hashing proof-of-concept that compares multiple hash algorithms.

What it does:
- Hashes PDF content (ignoring metadata) for accurate deduplication
- Compares 5 algorithms: BLAKE2B, SHA-256, SHA-512, SHA3-256, SHA3-512
- Shows performance metrics and stores results in NeonDB

Time needed: 15-20 minutes

Setup:
1. Download the project folder: resumeHashingPOC
2. Follow instructions in QUICK_START.md
3. You'll need:
   - Python 3.8+
   - Free NeonDB account (https://neon.tech)
   - Any PDF file to test

Key commands:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Create .env with your NeonDB connection string
./run_hasher.sh
```

Expected result:
- Performance comparison of 5 hash algorithms
- Hash stored in database
- Duplicate detection on second run

Full instructions: See SETUP_GUIDE.md in the project folder

Let me know if you hit any issues!
```

---

## Files They Need

### Essential Files
```
resumeHashingPOC/
├── pdf_hasher_content_only.py      # Main program ⭐
├── run_hasher.sh                    # Easy runner script
├── requirements.txt                 # Dependencies
├── .env.example                     # Config template
├── migrate_add_content_only.py     # DB setup
├── QUICK_START.md                  # Quick instructions ⭐
└── SETUP_GUIDE.md                  # Detailed guide ⭐
```

### Optional (For Deep Dive)
```
├── compare_content_vs_file_hashing.py
├── test_metadata_impact.py
├── compare_hash_algorithms.py
├── README.md
├── METADATA_EXPLANATION.md
└── flow_of_control_explanation.py
```

---

## Test Validation Criteria

They should confirm:

### ✅ Setup Complete
- [ ] Virtual environment created and activated
- [ ] Dependencies installed (psycopg2-binary, python-dotenv, PyPDF2)
- [ ] .env file configured with NeonDB connection
- [ ] ~~Database migration ran~~ (Not needed - auto-created on first run!)

### ✅ Functionality Working
- [ ] Script runs without errors
- [ ] All 5 algorithms tested (BLAKE2B, SHA-256, SHA-512, SHA3-256, SHA3-512)
- [ ] Performance comparison displayed
- [ ] Hash stored in database (first run)
- [ ] Duplicate detected (second run)

### ✅ Understanding Demonstrated
- [ ] Can explain why content-based hashing matters
- [ ] Understands metadata vs content difference
- [ ] Can interpret performance results
- [ ] Knows why BLAKE2B is recommended

---

## Expected Test Output

### First Run - Success
```
================================================================================
HASH ALGORITHM COMPARISON - Content-Based Hashing
================================================================================
File: [filename].pdf
Size: [X] bytes ([Y] MB)
...

Testing BLAKE2B...
✓ Generated content-based hash (BLAKE2B): [hash]
  Time: [X]ms
  Throughput: [Y] MB/s

...

🏆 Fastest: [Algorithm] ([X]ms)
🔒 Most Bits: [Algorithm] (512 bits)

✅ Best for PDF Deduplication: BLAKE2B

Results:
  Stored: Yes ✓
```

### Second Run - Duplicate Detection
```
⚠ Hash already exists in database!
  Original file: [filename].pdf
  Created at: [timestamp]
  Stored: No (duplicate) ✓
```

---

## Troubleshooting Quick Reference

| Symptom | Fix |
|---------|-----|
| `ModuleNotFoundError` | Use `.venv/bin/python` not system python |
| `DATABASE_URL not configured` | Create/check `.env` file |
| `Permission denied` | `chmod +x run_hasher.sh` |
| `File not found` | Update `PDF_FILE_PATH` in script |
| Slow performance | Normal for content-based (5-15 seconds) |

---

## Success Metrics

### Performance Benchmarks (Typical)
- **File-based hashing**: 2-5ms per MB
- **Content-based hashing**: 3-10 seconds for 1MB PDF
- **5 algorithm comparison**: 15-50 seconds total

### Key Insights They Should Gain
1. Content-based hashing is slower but more accurate
2. SHA-256 may be fastest due to hardware acceleration
3. BLAKE2B provides best balance for deduplication
4. 512-bit hashes provide better collision resistance
5. Metadata changes don't affect content-based hashes

---

## Post-Test Discussion Points

Ask them:
1. Which algorithm was fastest on their machine? (CPU-dependent)
2. Did they see duplicate detection work?
3. Do they understand why metadata independence matters?
4. What would they choose for production: speed or accuracy?

Expected answers:
1. SHA-256 (if CPU has SHA-NI) or BLAKE2B (older CPUs)
2. Yes - second run should show "duplicate"
3. Yes - same content with different dates/authors = same hash
4. Accuracy (BLAKE2B content-based) - correctness > speed

---

## Additional Resources

Point them to:
- **METADATA_EXPLANATION.md** - Why content-based matters
- **README.md** - Full project documentation
- **compare_content_vs_file_hashing.py** - Proof of metadata independence

---

## Timeline

| Task | Time |
|------|------|
| Install Python/setup environment | 5 min |
| Create NeonDB account | 3 min |
| Configure .env | 2 min |
| Run migration | 1 min |
| First test run | 1-2 min |
| Second run (duplicate test) | 1 min |
| Review results | 3 min |
| **Total** | **15-20 min** |

---

## What Makes This a Good Test

✅ **Easy Setup** - Clear step-by-step instructions  
✅ **Self-Validating** - Clear success/failure indicators  
✅ **Educational** - Teaches concepts while testing  
✅ **Real-World** - Uses actual cloud database  
✅ **Comprehensive** - Tests multiple algorithms  
✅ **Reproducible** - Should work on any Linux/Mac machine  

---

## Final Checklist for You

Before sharing:
- [ ] Verify all files are included
- [ ] Test on clean environment yourself
- [ ] Confirm .env.example is included (not .env with secrets!)
- [ ] Check PDF file path in script is generic or documented
- [ ] Ensure QUICK_START.md and SETUP_GUIDE.md are complete
- [ ] Provide your contact info for questions

---

**Good luck with the testing! The documentation is comprehensive, so they should be able to follow along without much help.** 🚀
