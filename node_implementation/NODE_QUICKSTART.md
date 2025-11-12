# 🚀 Node.js Version - Quick Instructions

## Installation (One-Time Setup)

```bash
# 1. Install Node.js dependencies
npm install

# 2. Use existing .env file (same as Python!)
# Already configured? Skip to step 3!

# If .env doesn't exist:
cp .env.example .env
nano .env  # Add your DATABASE_URL
```

---

## Running the Hasher

### **Method 1: NPM Script (Recommended)**
```bash
npm start
```

### **Method 2: Wrapper Script**
```bash
chmod +x run_hasher_node.sh  # First time only
./run_hasher_node.sh
```

### **Method 3: Direct Node Command**
```bash
node pdf_hasher_node.js
```

---

## What You'll See

```
================================================================================
HASH ALGORITHM COMPARISON - Content-Based Hashing
================================================================================
File: taleoftwocities.pdf
Size: 1,316,140 bytes (1.26 MB)
================================================================================

Testing BLAKE2B...
--------------------------------------------------------------------------------
  Pages: 330
✓ Generated content-based hash (BLAKE2B): 627c20752c94d7c8...
  Time: 5586.47ms
  Throughput: 0.22 MB/s
  Hash length: 128 characters (512 bits)

[... tests all 5 algorithms ...]

================================================================================
PERFORMANCE COMPARISON
================================================================================
🏆 SHA3-256      5520.79 ms     0.23 MB/s  256          1.00x
   BLAKE2B       5586.47 ms     0.22 MB/s  512          1.01x
   SHA3-512      5610.02 ms     0.22 MB/s  512          1.02x

✅ Best for PDF Deduplication: BLAKE2B
```

---

## NPM Scripts Available

```bash
npm start       # Run main hasher with algorithm comparison
npm run compare # Run algorithm comparison only
npm run test    # Test metadata impact (coming soon)
```

---

## Update PDF File Path

Edit `pdf_hasher_node.js` around line 380:

```javascript
const PDF_FILE_PATH = '/path/to/your/file.pdf';
```

---

## Test Duplicate Detection

```bash
npm start  # First run - stores hash
npm start  # Second run - detects duplicate

# Output on second run:
# ⚠ Hash already exists in database!
#   Original file: taleoftwocities.pdf
#   Stored: No (duplicate)
```

---

## Works With Python Version!

Both use the same database:

```bash
# Hash with Python
./run_hasher.sh

# Check with Node.js
npm start
# Result: "⚠ Hash already exists in database!"
```

---

## Common Issues

**`Cannot find module 'pdf-parse'`**
```bash
npm install
```

**`SyntaxError: Cannot use import`**
→ Already fixed! `package.json` has `"type": "module"`

**`Error connecting to database`**
```bash
cat .env  # Check DATABASE_URL is set correctly
```

---

## Full Documentation

- **[NODE_SETUP.md](NODE_SETUP.md)** - Complete Node.js setup guide
- **[LANGUAGE_COMPARISON.md](LANGUAGE_COMPARISON.md)** - Python vs Node.js comparison
- **[QUICK_START.md](QUICK_START.md)** - Both versions side-by-side

---

## Quick Comparison

| Feature | Python | Node.js |
|---------|--------|---------|
| **Install** | `pip install -r requirements.txt` | `npm install` |
| **Run** | `./run_hasher.sh` | `npm start` |
| **Performance** | ~5.5s for 1.26MB PDF | ~5.5s for 1.26MB PDF |
| **Database** | ✅ Shared | ✅ Shared |
| **Duplicate Detection** | ✅ Works | ✅ Works |

---

**That's it! You're ready to hash PDFs with Node.js!** 🎉

For detailed explanations, see [NODE_SETUP.md](NODE_SETUP.md)
