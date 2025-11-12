# 📦 Node.js Setup Guide for PDF Hasher

This guide shows you how to run the PDF hasher using Node.js instead of Python.

---

## 🎯 Prerequisites

### **Check Node.js Version**
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

### **Install Node.js (if needed)**

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**
```bash
brew install node
```

**Or download from:** https://nodejs.org/

---

## 🚀 Quick Start

### **1. Navigate to Project Directory**
```bash
cd ~/Desktop/resumeHashingPOC
```

### **2. Install Node.js Dependencies**
```bash
npm install
```

This installs:
- `pdf-parse` - PDF parsing library (like PyPDF2)
- `pg` - PostgreSQL client (like psycopg2)
- `dotenv` - Environment variable management
- `blake2` - BLAKE2 hashing algorithm

### **3. Set Up Environment Variables**

**Option A: Use existing .env file**
```bash
# If you already set up Python version, .env is ready!
cat .env  # Verify DATABASE_URL is set
```

**Option B: Create new .env file**
```bash
cp .env.example .env
nano .env  # Add your NeonDB connection string
```

```
DATABASE_URL=postgresql://username:password@host.neon.tech/neondb?sslmode=require
```

### **4. Update PDF Path (if needed)**

Edit `pdf_hasher_node.js` line ~380:
```javascript
const PDF_FILE_PATH = '/path/to/your/file.pdf';
```

### **5. Run the Hasher**

**Option A: Using the wrapper script**
```bash
chmod +x run_hasher_node.sh
./run_hasher_node.sh
```

**Option B: Direct npm command**
```bash
npm start
```

**Option C: Direct node command**
```bash
node pdf_hasher_node.js
```

---

## 📊 What You'll See

### **Algorithm Comparison**
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
```

### **Performance Table**
```
================================================================================
PERFORMANCE COMPARISON
================================================================================
Algorithm       Time (ms)    Throughput      Bits       Relative
--------------------------------------------------------------------------------
🏆 SHA3-256       5520.79 ms     0.23 MB/s  256          1.00x
   BLAKE2B        5586.47 ms     0.22 MB/s  512          1.01x
   SHA3-512       5610.02 ms     0.22 MB/s  512          1.02x
   SHA256         5660.41 ms     0.22 MB/s  256          1.03x
   SHA512         5772.83 ms     0.21 MB/s  512          1.05x
```

### **Database Storage**
```
✓ Connected to NeonDB successfully
✓ Table 'pdf_hashes' created/verified successfully
✓ Hash stored successfully with ID: 5
```

---

## 🧪 NPM Scripts

The `package.json` includes convenient scripts:

### **Run Main Hasher**
```bash
npm start
```

### **Compare Algorithms Only**
```bash
npm run compare
```

### **Test Metadata Impact**
```bash
npm run test
```

---

## 🔄 Python vs Node.js Comparison

### **Python Version**
```bash
source .venv/bin/activate
./run_hasher.sh
```

### **Node.js Version**
```bash
npm install  # Only once
npm start
```

### **Both Use Same:**
- ✅ NeonDB database (same `.env` file)
- ✅ Same table structure (`pdf_hashes`)
- ✅ Same algorithms (BLAKE2b, SHA-256, etc.)
- ✅ Same content-based hashing approach
- ✅ Same duplicate detection

### **Can Mix and Match:**
```bash
# Hash with Python
./run_hasher.sh

# Check duplicates with Node.js
npm start
# Will detect: "⚠ Hash already exists in database!"
```

---

## 📁 File Structure

```
resumeHashingPOC/
├── package.json              # Node.js dependencies & scripts
├── pdf_hasher_node.js        # Main Node.js implementation
├── run_hasher_node.sh        # Bash wrapper for Node.js
├── NODE_SETUP.md            # This file
│
├── pdf_hasher_content_only.py   # Python version (still works!)
├── run_hasher.sh                # Python wrapper
│
├── .env                      # Shared by both versions
├── node_modules/             # Node.js packages (auto-created)
└── taleoftwocities.pdf       # Test PDF file
```

---

## ⚠️ Common Issues & Fixes

### **Issue: `Cannot find module 'pdf-parse'`**
**Solution:**
```bash
npm install
```

### **Issue: `SyntaxError: Cannot use import statement outside a module`**
**Solution:** Check `package.json` has `"type": "module"`
```json
{
  "type": "module"
}
```

### **Issue: `Error: Cannot find module 'blake2'`**
**Solution:** On some systems, blake2 needs compilation tools
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# macOS
xcode-select --install

# Then retry
npm install
```

### **Issue: Database connection fails**
**Solution:** Same as Python - check `.env` file
```bash
cat .env  # Verify DATABASE_URL is correct
```

### **Issue: PDF file not found**
**Solution:** Update path in `pdf_hasher_node.js`
```javascript
const PDF_FILE_PATH = '/absolute/path/to/file.pdf';
```

---

## 🎯 Testing Checklist

```
□ Node.js v18+ installed
□ npm installed
□ Dependencies installed (npm install)
□ .env file configured
□ PDF file path updated
□ Script runs without errors
□ All 5 algorithms tested
□ Hash stored in database
□ Duplicate detection works
```

---

## 📊 Performance Comparison

**Typical results for 1.26 MB PDF:**

| Environment | Time | Notes |
|-------------|------|-------|
| **Python** | 5.5-6s | PyPDF2 parsing |
| **Node.js** | 5.5-6s | pdf-parse library |

**Both are comparable!** Content parsing is the bottleneck, not the language.

---

## 🔧 Advanced Usage

### **Use as Module in Your Code**

```javascript
import { PDFHasher } from './pdf_hasher_node.js';

const hasher = new PDFHasher(
    process.env.DATABASE_URL,
    false,  // content-only (not full file)
    'blake2b'
);

await hasher.connect();
await hasher.createTable();

const result = await hasher.processPDF('./my-resume.pdf');
console.log(`Hash: ${result.hash}`);

await hasher.disconnect();
```

### **Programmatic Algorithm Comparison**

```javascript
import { compareAlgorithms } from './pdf_hasher_node.js';

await compareAlgorithms(
    process.env.DATABASE_URL,
    './document.pdf'
);
```

### **Batch Processing**

```javascript
const files = ['resume1.pdf', 'resume2.pdf', 'resume3.pdf'];

for (const file of files) {
    const result = await hasher.processPDF(file);
    console.log(`${file}: ${result.stored ? 'New' : 'Duplicate'}`);
}
```

---

## 🌐 Integration Examples

### **Express.js API**

```javascript
import express from 'express';
import { PDFHasher } from './pdf_hasher_node.js';

const app = express();
const hasher = new PDFHasher(process.env.DATABASE_URL);

app.post('/upload-pdf', async (req, res) => {
    const result = await hasher.processPDF(req.file.path);
    res.json({
        isDuplicate: !result.stored,
        hash: result.hash
    });
});

app.listen(3000);
```

### **Next.js API Route**

```javascript
// pages/api/hash-pdf.js
import { PDFHasher } from '../../pdf_hasher_node.js';

export default async function handler(req, res) {
    const hasher = new PDFHasher(process.env.DATABASE_URL);
    await hasher.connect();
    
    const result = await hasher.processPDF(req.body.filePath);
    
    await hasher.disconnect();
    res.status(200).json(result);
}
```

---

## 🎉 Success Indicators

You'll know it's working when:

```
✓ Connected to NeonDB successfully
✓ Table 'pdf_hashes' created/verified successfully
✓ Generated content-based hash (BLAKE2B): 627c2075...
✓ Hash stored successfully with ID: 5

Results:
  File: taleoftwocities.pdf
  Hash: 627c20752c94d7c8a56e7f4e8b3d9a1f...
  Algorithm: BLAKE2B
  Content-only: true
  Stored: Yes
```

---

## 📚 Additional Resources

- **pdf-parse docs:** https://www.npmjs.com/package/pdf-parse
- **node-postgres:** https://node-postgres.com/
- **BLAKE2 for Node.js:** https://www.npmjs.com/package/blake2
- **Python version docs:** See `README.md`, `METADATA_EXPLANATION.md`

---

## 💡 Why Node.js Version?

### **Advantages:**
- ✅ Integrate with Node.js/Express/Next.js applications
- ✅ Use in JavaScript/TypeScript projects
- ✅ Deploy to Vercel/Netlify serverless functions
- ✅ Same performance as Python version
- ✅ Familiar for frontend developers

### **When to Use:**
- Building web applications (Express, Next.js, etc.)
- JavaScript-first development environment
- Serverless deployments
- Real-time duplicate detection in uploads

### **When to Use Python Instead:**
- Data science workflows
- Machine learning pipelines
- Existing Python infrastructure
- Academic/research projects

---

**Both versions work identically and share the same database! Choose based on your stack.** 🚀
