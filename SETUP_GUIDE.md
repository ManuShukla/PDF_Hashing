# PDF Hasher - Setup and Testing Guide

## 📋 Quick Overview

This project demonstrates PDF content-based hashing with multiple algorithms (BLAKE2b, SHA-256, SHA-512, SHA3-256, SHA3-512) for resume/document deduplication. It compares performance and stores hashes in NeonDB with metadata independence.

---

## 🚀 Setup Instructions for New Machine

### Prerequisites
- **Python 3.8+** installed
- **Git** (optional, for cloning)
- **NeonDB account** (free tier available at https://neon.tech)

### Step 1: Get the Code

**Option A: If using Git**
```bash
cd ~/Desktop
git clone <repository-url> resumeHashingPOC
cd resumeHashingPOC
```

**Option B: If copying files**
```bash
# Copy the entire resumeHashingPOC folder to ~/Desktop/
cd ~/Desktop/resumeHashingPOC
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate

# Your prompt should now show (.venv)
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed psycopg2-binary-2.9.9 python-dotenv-1.0.0 PyPDF2-3.0.1
```

### Step 4: Set Up NeonDB

1. **Create NeonDB Account**
   - Go to https://neon.tech
   - Sign up (free tier is sufficient)
   - Create a new project

2. **Get Connection String**
   - In your NeonDB dashboard, click "Connection Details"
   - Copy the connection string (looks like):
     ```
     postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```

3. **Configure Environment**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env file (use nano, vim, or any text editor)
   nano .env
   ```

4. **Add your connection string to .env**
   ```
   DATABASE_URL=postgresql://your-username:your-password@your-host.neon.tech/neondb?sslmode=require
   ```

### Step 5: Database Setup

**Note:** For new installations, you can **SKIP** this step! The main script (`pdf_hasher_content_only.py`) automatically creates the table with the correct schema.

**Only run migration if:**
- You're upgrading from the old `pdf_hasher.py`
- Your database already has a `pdf_hashes` table without the `content_only` column

```bash
# Only needed for upgrades from old version:
.venv/bin/python migrate_add_content_only.py
```

**Expected output (if you run it):**
```
✓ Column 'content_only' added successfully
✓ Migration completed successfully
```

**For new installations:** The table will be created automatically on first run!

### Step 6: Add a Test PDF

Place any PDF file in the project directory, or update the PDF path in the script:

```bash
# If you have a PDF file, copy it:
cp ~/Downloads/your-resume.pdf ./test.pdf

# Or use the provided sample if available
```

**Edit the file path in `pdf_hasher_content_only.py`:**
```python
PDF_FILE_PATH = '/home/YOUR_USERNAME/Desktop/resumeHashingPOC/your-file.pdf'
```

---

## ▶️ Running the Program

### Option 1: Using the Shell Script (Recommended)

```bash
./run_hasher.sh
```

### Option 2: Direct Python Command

```bash
.venv/bin/python pdf_hasher_content_only.py
```

### Option 3: After Activating Virtual Environment

```bash
source .venv/bin/activate
python3 pdf_hasher_content_only.py
deactivate  # When done
```

---

## 📊 What the Program Does

When you run it, the program will:

1. **Compare 5 Hash Algorithms**
   - BLAKE2b (512-bit)
   - SHA-256 (256-bit)
   - SHA-512 (512-bit)
   - SHA3-256 (256-bit)
   - SHA3-512 (512-bit)

2. **Show Performance Metrics**
   - Time taken for each algorithm
   - Throughput (MB/s)
   - Relative speed comparison
   - Hash output samples

3. **Store Hash in Database**
   - Uses recommended algorithm (BLAKE2b)
   - Detects duplicates
   - Tracks metadata independence

---

## 📖 Expected Output

```
================================================================================
HASH ALGORITHM COMPARISON - Content-Based Hashing
================================================================================
File: your-file.pdf
Size: 1,316,140 bytes (1.26 MB)
================================================================================

Testing BLAKE2B...
--------------------------------------------------------------------------------
  Mode: Hashing content only (excludes metadata) - Algorithm: BLAKE2B
  Pages: 330
✓ Generated content-based hash (BLAKE2B): 627c20757a68703ffe...
  Time: 14.52ms
  Throughput: 86.52 MB/s
  Hash length: 128 characters (512 bits)

Testing SHA256...
...

================================================================================
PERFORMANCE COMPARISON
================================================================================
Algorithm       Time (ms)    Throughput      Bits       Relative
--------------------------------------------------------------------------------
🏆 SHA256          2.31 ms    542.79 MB/s  256        1.00x
   SHA512          4.12 ms    304.51 MB/s  512        1.78x
   BLAKE2B        14.52 ms     86.52 MB/s  512        6.29x
   SHA3_256       15.89 ms     79.02 MB/s  256        6.88x
   SHA3_512       18.34 ms     68.52 MB/s  512        7.94x
================================================================================

HASH OUTPUTS:
--------------------------------------------------------------------------------

BLAKE2B (128 chars):
  627c20757a68703ffe79fdd51febdd35015bf399e833147e2ace44184a3c0b1f...
  ...e459efeb9d33bece083b0798c207ef2cf20755ef3e6f031062a58afa84f6803e

...

================================================================================
RECOMMENDATIONS:
================================================================================

🏆 Fastest: SHA256 (2.31ms)
🔒 Most Bits: BLAKE2B (512 bits)

✅ Best for PDF Deduplication: BLAKE2B
   • Fast performance
   • 512-bit output (excellent collision resistance)
   • Modern design for hashing
   • Content-based = metadata independent

================================================================================
```

---

## 🧪 Testing Features

### Test 1: Algorithm Comparison
```bash
./run_hasher.sh
```
This runs all 5 algorithms and shows performance comparison.

### Test 2: Metadata Independence
```bash
.venv/bin/python compare_content_vs_file_hashing.py
```
Creates two PDFs with identical content but different metadata, proving content-based hashing works.

### Test 3: Duplicate Detection
```bash
# Run twice with the same PDF
./run_hasher.sh  # First run: stores hash
./run_hasher.sh  # Second run: detects duplicate
```

**Expected on second run:**
```
⚠ Hash already exists in database!
  Original file: your-file.pdf
  Original path: /path/to/your-file.pdf
  Created at: 2025-11-12 05:56:43
  Stored: No (duplicate)
```

---

## 🔧 Troubleshooting

### Error: `ModuleNotFoundError: No module named 'PyPDF2'`
**Solution:** You're using system Python instead of virtual environment
```bash
# Use one of these:
./run_hasher.sh
# OR
.venv/bin/python pdf_hasher_content_only.py
# OR
source .venv/bin/activate && python3 pdf_hasher_content_only.py
```

### Error: `DATABASE_URL not configured`
**Solution:** Check your .env file
```bash
cat .env  # Should show your connection string
nano .env  # Edit if needed
```

### Error: `could not translate host name`
**Solution:** Your NeonDB connection string is incorrect
- Go back to NeonDB dashboard
- Copy the correct connection string
- Update .env file

### Error: `File not found`
**Solution:** Update the PDF path in the script
```bash
# Edit line 373 in pdf_hasher_content_only.py
nano pdf_hasher_content_only.py
# Change: PDF_FILE_PATH = '/path/to/your/file.pdf'
```

### Error: `Permission denied: ./run_hasher.sh`
**Solution:** Make script executable
```bash
chmod +x run_hasher.sh
```

---

## 📁 Project Structure

```
resumeHashingPOC/
├── .env                              # Database configuration (create this)
├── .env.example                      # Example configuration
├── .venv/                           # Virtual environment (created by setup)
├── requirements.txt                 # Python dependencies
├── pdf_hasher_content_only.py      # Main program (with algorithm comparison)
├── run_hasher.sh                   # Convenient runner script
├── migrate_add_content_only.py     # Database migration
├── compare_content_vs_file_hashing.py  # Metadata test
├── README.md                        # Full documentation
├── METADATA_EXPLANATION.md          # Metadata deep dive
└── taleoftwocities.pdf             # Sample PDF (if available)
```

---

## 🎯 Key Features Demonstrated

1. **Content-Based Hashing**
   - Ignores PDF metadata (author, dates, etc.)
   - Same content = same hash
   - Perfect for resume deduplication

2. **Multiple Algorithm Support**
   - BLAKE2b (recommended)
   - SHA-256 (fastest on modern CPUs)
   - SHA-512 (good balance)
   - SHA3-256/512 (newest standard)

3. **Performance Comparison**
   - Real-time benchmarking
   - Throughput measurement
   - Side-by-side comparison

4. **Database Integration**
   - Stores hashes in NeonDB
   - Duplicate detection
   - Tracks algorithm used

5. **Metadata Independence**
   - Proven with test scripts
   - Production-ready solution

---

## 📊 Benchmark Results (1.26 MB PDF)

| Algorithm | Time | Throughput | Bits | Recommended For |
|-----------|------|------------|------|-----------------|
| **SHA-256** | 2.3ms | 543 MB/s | 256 | Speed-critical |
| **SHA-512** | 4.1ms | 305 MB/s | 512 | Balance |
| **BLAKE2b** | 14.5ms | 87 MB/s | 512 | **Deduplication** ✅ |
| SHA3-256 | 15.9ms | 79 MB/s | 256 | NIST standard |
| SHA3-512 | 18.3ms | 69 MB/s | 512 | Max security |

**Note:** Performance varies by CPU. CPUs with SHA-NI (2016+) will show SHA-256/512 as fastest.

---

## 🎓 Learning Objectives

After running this project, you'll understand:

1. **Hash algorithm differences** (speed vs. output size)
2. **Content-based vs file-based hashing**
3. **Why metadata matters** in deduplication
4. **PostgreSQL integration** with Python
5. **Practical benchmarking** techniques
6. **Production-ready error handling**

---

## 🤝 Helping Someone Else Test

Send them this checklist:

```
□ Install Python 3.8+
□ Create NeonDB account (free)
□ Download/clone project files
□ Create virtual environment: python3 -m venv .venv
□ Activate venv: source .venv/bin/activate
□ Install dependencies: pip install -r requirements.txt
□ Create .env file with NeonDB connection string
□ Run migration: .venv/bin/python migrate_add_content_only.py
□ Add a test PDF file
□ Run: ./run_hasher.sh
□ Check results and compare algorithms
```

---

## 📞 Support

If you encounter issues:

1. **Check virtual environment is activated** (prompt shows `.venv`)
2. **Verify .env file exists** and has correct connection string
3. **Ensure PDF file path is correct** in the script
4. **Check Python version**: `python3 --version` (should be 3.8+)
5. **Review error messages** - they're designed to be helpful!

---

## 🎉 Success Criteria

You've successfully set up and tested when you see:

✅ All 5 algorithms tested  
✅ Performance comparison displayed  
✅ Hash stored in database  
✅ Duplicate detection works on second run  
✅ No errors in output  

**Congratulations!** You now have a working PDF deduplication system with algorithm comparison.

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Metadata Deep Dive**: See `METADATA_EXPLANATION.md`
- **Algorithm Comparison**: Run `compare_hash_algorithms.py`
- **Flow Explanation**: See `flow_of_control_explanation.py`

---

**Happy Hashing! 🎯**
