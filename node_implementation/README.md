# 📦 Node.js Implementation

This folder contains the Node.js version of the PDF hasher.

---

## 🚀 Quick Start

```bash
# 1. Navigate to this folder
cd node_implementation

# 2. Install dependencies
npm install

# 3. Set up .env (use parent folder's .env)
# The script will automatically look for .env in parent directory

# 4. Run the hasher
npm start
# OR: ./run_hasher_node.sh
# OR: node pdf_hasher_node.js
```

---

## 📁 Files in This Folder

- **`pdf_hasher_node.js`** - Main Node.js implementation
- **`package.json`** - Node.js dependencies and scripts
- **`run_hasher_node.sh`** - Bash wrapper script
- **`NODE_SETUP.md`** - Complete Node.js setup guide
- **`NODE_QUICKSTART.md`** - Quick reference guide
- **`README.md`** - This file

---

## 📚 Documentation

- **Quick Start:** See [NODE_QUICKSTART.md](NODE_QUICKSTART.md)
- **Full Setup Guide:** See [NODE_SETUP.md](NODE_SETUP.md)
- **Python vs Node.js:** See [../LANGUAGE_COMPARISON.md](../LANGUAGE_COMPARISON.md)
- **Main Project Docs:** See [../README.md](../README.md)

---

## 🔧 Configuration

### **Environment Variables**

The Node.js implementation uses the `.env` file from the **parent directory**:

```
resumeHashingPOC/
├── .env                    ← Shared by both Python and Node.js
└── node_implementation/
    └── pdf_hasher_node.js  ← Uses parent's .env
```

This ensures both implementations share the same database configuration.

### **PDF File Path**

Update the PDF path in `pdf_hasher_node.js` (line ~380):

```javascript
const PDF_FILE_PATH = '../taleoftwocities.pdf';  // Relative to this folder
// OR use absolute path:
const PDF_FILE_PATH = '/absolute/path/to/file.pdf';
```

---

## 🧪 Testing

### **Test 1: Basic Run**
```bash
npm start
```

### **Test 2: Duplicate Detection**
```bash
npm start  # First run
npm start  # Second run - should detect duplicate
```

### **Test 3: Interoperability with Python**
```bash
# Hash with Python
cd ..
./run_hasher.sh

# Check with Node.js
cd node_implementation
npm start
# Should detect duplicate from Python!
```

---

## 📦 NPM Scripts

Defined in `package.json`:

```bash
npm start       # Run main hasher with algorithm comparison
npm run compare # Run algorithm comparison only
npm run test    # Test metadata impact
```

---

## 🔄 Python Interoperability

Both Python and Node.js implementations:
- ✅ Share the same `.env` file
- ✅ Use the same NeonDB database
- ✅ Use the same `pdf_hashes` table
- ✅ Can detect each other's duplicates

**Example:**
```bash
# Hash with Python (in parent directory)
cd ..
./run_hasher.sh

# Verify with Node.js
cd node_implementation
npm start
# Output: "⚠ Hash already exists in database!"
```

---

## 🎯 Performance

**Test File:** 1.26 MB PDF (330 pages)

| Metric | Performance |
|--------|-------------|
| Content parsing | ~5.5 seconds |
| BLAKE2b hashing | ~5.6 seconds |
| SHA-256 hashing | ~5.7 seconds |
| Memory usage | ~120 MB |

Same performance as Python version!

---

## 🛠️ Development

### **Run with Custom PDF**
```bash
node pdf_hasher_node.js /path/to/your/file.pdf
```

### **Use as Module**
```javascript
import { PDFHasher } from './pdf_hasher_node.js';

const hasher = new PDFHasher(process.env.DATABASE_URL);
await hasher.connect();
const result = await hasher.processPDF('./file.pdf');
await hasher.disconnect();
```

### **Integration Example**
```javascript
// Express.js API
import express from 'express';
import { PDFHasher } from './node_implementation/pdf_hasher_node.js';

const app = express();
const hasher = new PDFHasher(process.env.DATABASE_URL);

app.post('/hash-pdf', async (req, res) => {
    await hasher.connect();
    const result = await hasher.processPDF(req.file.path);
    await hasher.disconnect();
    res.json({ hash: result.hash, isDuplicate: !result.stored });
});
```

---

## ⚠️ Common Issues

**`Cannot find module 'pdf-parse'`**
```bash
npm install
```

**`Error: Cannot find .env file`**
```bash
# Create .env in parent directory
cd ..
cp .env.example .env
nano .env  # Add DATABASE_URL
```

**`File not found: ../taleoftwocities.pdf`**
```javascript
// Update path in pdf_hasher_node.js
const PDF_FILE_PATH = '/absolute/path/to/your/file.pdf';
```

---

## 📈 Next Steps

1. ✅ Run `npm install`
2. ✅ Verify `.env` exists in parent directory
3. ✅ Update PDF path in `pdf_hasher_node.js`
4. ✅ Run `npm start`
5. ✅ Check output for successful hash storage

---

## 💡 Why Node.js?

Choose Node.js implementation when:
- Building Express/Next.js applications
- Deploying to Vercel/Netlify serverless
- Team prefers JavaScript/TypeScript
- Need fast cold starts
- Want async/await native support

See [../LANGUAGE_COMPARISON.md](../LANGUAGE_COMPARISON.md) for detailed comparison.

---

**Ready to hash some PDFs? Run `npm start`!** 🚀
