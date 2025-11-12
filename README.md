# PDF Hashing POC

A Python program that generates unique hashes for PDF files and stores them in NeonDB using the BLAKE2b hashing algorithm.

## Features

- **Fast Hashing**: Uses BLAKE2b algorithm (fastest cryptographic hash)
- **Unique Hash Guarantee**: Database constraint ensures hash uniqueness
- **Duplicate Detection**: Automatically detects if a PDF has already been processed
- **Memory Efficient**: Reads files in chunks for large PDF support
- **PostgreSQL/NeonDB Integration**: Optimized for cloud-native NeonDB

## Why BLAKE2b?

BLAKE2b is chosen as the hashing algorithm because:

1. **Speed**: Faster than MD5, SHA-256, and SHA-3 (~1 GB/s on modern hardware)
2. **Security**: Cryptographically secure with excellent collision resistance
3. **Native Support**: Built into Python's `hashlib` module
4. **64-bit Optimized**: Best performance on modern processors
5. **Unique Hashes**: Virtually impossible collision probability (2^256)

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your environment variables:
```bash
cp .env.example .env
# Edit .env with your NeonDB connection string
```

## Configuration

Create a `.env` file with your NeonDB connection string:

```
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

You can get your connection string from the NeonDB dashboard.

## Usage

### Basic Usage

```python
from pdf_hasher import PDFHasher
import os

# Initialize with your NeonDB connection string
DATABASE_URL = os.getenv('DATABASE_URL')
hasher = PDFHasher(DATABASE_URL)

# Connect to database
hasher.connect()

# Create table (first time only)
hasher.create_table()

# Process a PDF file
result = hasher.process_pdf('path/to/your/file.pdf')

# Cleanup
hasher.disconnect()
```

### Running the Example

Edit `pdf_hasher.py` and update:
- `DATABASE_URL`: Your NeonDB connection string
- `PDF_FILE_PATH`: Path to your PDF file

Then run:
```bash
python pdf_hasher.py
```

### Processing Multiple Files

```python
from pdf_hasher import PDFHasher
import os
import glob

DATABASE_URL = os.getenv('DATABASE_URL')
hasher = PDFHasher(DATABASE_URL)

try:
    hasher.connect()
    hasher.create_table()
    
    # Process all PDFs in a directory
    pdf_files = glob.glob('pdfs/*.pdf')
    
    for pdf_file in pdf_files:
        result = hasher.process_pdf(pdf_file)
        print(f"Processed: {result['file_name']} - Stored: {result['stored']}")
        
finally:
    hasher.disconnect()
```

## Database Schema

The program creates a `pdf_hashes` table with the following structure:

```sql
CREATE TABLE pdf_hashes (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(128) UNIQUE NOT NULL,
    file_size BIGINT NOT NULL,
    hash_algorithm VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- `UNIQUE` constraint on `file_hash` ensures no duplicate hashes
- Indexed on `file_hash` for fast lookups
- Tracks file metadata (name, path, size, timestamp)

## Hash Uniqueness

The program guarantees hash uniqueness through:

1. **Algorithm**: BLAKE2b produces 256-bit hashes with negligible collision probability
2. **Database Constraint**: `UNIQUE` constraint on the `file_hash` column
3. **Duplicate Detection**: Checks for existing hashes before insertion
4. **Integrity Enforcement**: PostgreSQL prevents duplicate hash insertion

## API Reference

### `PDFHasher` Class

#### `__init__(database_url: str)`
Initialize the hasher with NeonDB connection string.

#### `connect()`
Establish connection to the database.

#### `disconnect()`
Close the database connection.

#### `create_table()`
Create the `pdf_hashes` table with unique constraints.

#### `generate_hash(file_path: str) -> str`
Generate BLAKE2b hash for a PDF file.

#### `check_hash_exists(file_hash: str) -> Optional[dict]`
Check if a hash exists in the database.

#### `store_hash(file_path: str, file_hash: str) -> bool`
Store the hash in the database. Returns `False` if duplicate.

#### `process_pdf(file_path: str) -> dict`
Complete workflow: generate hash and store in database.

## Performance

- **Hashing Speed**: ~1 GB/s (BLAKE2b on modern CPU)
- **Memory Usage**: ~8KB buffer (streaming file read)
- **Database Operations**: Optimized with indexes on `file_hash`

## Error Handling

The program handles:
- Missing files
- Database connection errors
- Duplicate hashes
- Invalid file paths
- Transaction rollback on errors

## Requirements

- Python 3.8+
- PostgreSQL/NeonDB account
- `psycopg2-binary` for database connectivity

## License

MIT License
