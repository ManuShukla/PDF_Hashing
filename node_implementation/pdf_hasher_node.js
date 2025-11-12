import fs from 'fs/promises';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';
import { createHash as createBlake2Hash } from 'blake2';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from current directory (node_implementation folder)
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;
const execPromise = promisify(exec);

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Ask user a question and return their answer
 */
function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

class PDFHasher {
    /**
     * A class to generate unique hashes for PDF files and store them in NeonDB.
     * Uses BLAKE2b algorithm for optimal speed and security.
     * Hashes only PDF content, excluding metadata for true content-based deduplication.
     */
    
    constructor(dbConfig, includeMetadata = false, algorithm = 'blake2b', parser = 'pdf-parse') {
        /**
         * Initialize the PDFHasher with database connection.
         * 
         * @param {object} dbConfig - Database configuration object
         * @param {boolean} includeMetadata - If true, hash entire file (old behavior)
         * @param {string} algorithm - Hash algorithm to use
         * @param {string} parser - PDF parser to use ('pdf-parse' or 'pdftotext')
         */
        this.dbConfig = dbConfig;
        this.pool = null;
        this.includeMetadata = includeMetadata;
        this.algorithm = algorithm.toLowerCase();
        this.parser = parser.toLowerCase();
        
        // Validate algorithm
        const validAlgorithms = ['blake2b', 'sha256', 'sha512', 'sha3-256', 'sha3-512'];
        if (!validAlgorithms.includes(this.algorithm)) {
            throw new Error(`Algorithm must be one of: ${validAlgorithms.join(', ')}`);
        }
        
        // Validate parser
        const validParsers = ['pdf-parse', 'pdftotext'];
        if (!validParsers.includes(this.parser)) {
            throw new Error(`Parser must be one of: ${validParsers.join(', ')}`);
        }
    }
    
    async connect() {
        /**
         * Establish connection pool to NeonDB.
         */
        try {
            this.pool = new Pool({
                host: this.dbConfig.host,
                port: this.dbConfig.port,
                user: this.dbConfig.username,
                password: this.dbConfig.password,
                database: this.dbConfig.database,
                ssl: this.dbConfig.ssl ? {
                    rejectUnauthorized: false
                } : false,
                connectionTimeoutMillis: 15000,
                idleTimeoutMillis: 30000
            });
            
            // Test connection
            const result = await this.pool.query('SELECT NOW() as now, version() as version');
            console.log('✓ Connected to NeonDB successfully');
            console.log(`  Host: ${this.dbConfig.host}`);
            console.log(`  Database: ${this.dbConfig.database}`);
            console.log(`  PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
        } catch (error) {
            console.error(`✗ Error connecting to database: ${error.message}`);
            if (error.code) console.error(`   Error code: ${error.code}`);
            console.error(`   Hint: Check your .env file configuration`);
            throw error;
        }
    }
    
    async disconnect() {
        /**
         * Close database connection pool.
         */
        if (this.pool) {
            await this.pool.end();
            console.log('✓ Disconnected from NeonDB');
        }
    }
    
    async createTable() {
        /**
         * Create the pdf_hashes table if it doesn't exist.
         * Includes unique constraint on hash to ensure uniqueness.
         */
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS pdf_hashes (
                id SERIAL PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_hash VARCHAR(128) UNIQUE NOT NULL,
                file_size BIGINT NOT NULL,
                hash_algorithm VARCHAR(50) NOT NULL,
                content_only BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_hash UNIQUE (file_hash)
            );
            
            CREATE INDEX IF NOT EXISTS idx_file_hash ON pdf_hashes(file_hash);
            CREATE INDEX IF NOT EXISTS idx_created_at ON pdf_hashes(created_at);
            CREATE INDEX IF NOT EXISTS idx_content_only ON pdf_hashes(content_only);
        `;
        
        try {
            await this.pool.query(createTableQuery);
            console.log("✓ Table 'pdf_hashes' created/verified successfully");
        } catch (error) {
            console.error(`✗ Error creating table: ${error.message}`);
            throw error;
        }
    }
    
    _getHasher() {
        /**
         * Get the appropriate hasher object based on algorithm
         */
        if (this.algorithm === 'blake2b') {
            return createBlake2Hash('blake2b', { digestLength: 64 });
        } else if (this.algorithm === 'sha256') {
            return crypto.createHash('sha256');
        } else if (this.algorithm === 'sha512') {
            return crypto.createHash('sha512');
        } else if (this.algorithm === 'sha3-256') {
            return crypto.createHash('sha3-256');
        } else if (this.algorithm === 'sha3-512') {
            return crypto.createHash('sha3-512');
        } else {
            throw new Error(`Unsupported algorithm: ${this.algorithm}`);
        }
    }
    
    async generateHashFromContent(filePath) {
        /**
         * Generate hash from PDF content only (excluding metadata).
         * 
         * This method:
         * - Extracts text from each page
         * - Ignores metadata (Author, Title, CreationDate, etc.)
         * 
         * @param {string} filePath - Path to the PDF file
         * @returns {string} Hexadecimal string representation of the hash
         */
        const hasher = this._getHasher();
        
        try {
            let text;
            
            if (this.parser === 'pdftotext') {
                // Use pdftotext command (faster)
                const { stdout } = await execPromise(`pdftotext "${filePath}" -`);
                text = stdout;
                console.log(`  Parser: pdftotext (poppler-utils)`);
            } else {
                // Use pdf-parse library (default)
                const dataBuffer = await fs.readFile(filePath);
                const pdfData = await pdfParse(dataBuffer);
                text = pdfData.text;
                console.log(`  Pages: ${pdfData.numpages}`);
                console.log(`  Parser: pdf-parse`);
            }
            
            if (text) {
                // Normalize whitespace for consistency
                const normalizedText = text.split(/\s+/).join(' ').trim();
                // Convert to Buffer for blake2 compatibility
                const textBuffer = Buffer.from(normalizedText, 'utf-8');
                hasher.update(textBuffer);
            }
            
            const fileHash = hasher.digest('hex');
            console.log(`✓ Generated content-based hash (${this.algorithm.toUpperCase()}): ${fileHash}`);
            return fileHash;
            
        } catch (error) {
            console.error(`✗ Error generating content hash: ${error.message}`);
            console.log('  Falling back to full-file hash');
            return await this.generateHashFromFile(filePath);
        }
    }
    
    async generateHashFromFile(filePath) {
        /**
         * Generate hash from entire file (including metadata).
         * This is the old method - kept for compatibility.
         * 
         * @param {string} filePath - Path to the PDF file
         * @returns {string} Hexadecimal string representation of the hash
         */
        const hasher = this._getHasher();
        
        try {
            const data = await fs.readFile(filePath);
            hasher.update(data);
            
            const fileHash = hasher.digest('hex');
            console.log(`✓ Generated file-based hash (${this.algorithm.toUpperCase()}): ${fileHash}`);
            return fileHash;
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`✗ Error: File not found: ${filePath}`);
            } else {
                console.error(`✗ Error generating hash: ${error.message}`);
            }
            throw error;
        }
    }
    
    async generateHash(filePath) {
        /**
         * Generate hash for a PDF file and return hash with timing.
         * 
         * @param {string} filePath - Path to the PDF file
         * @returns {Object} {hash: string, timeTaken: number}
         */
        const startTime = performance.now();
        
        let hashResult;
        if (this.includeMetadata) {
            console.log(`  Mode: Hashing entire file (includes metadata) - Algorithm: ${this.algorithm.toUpperCase()}`);
            hashResult = await this.generateHashFromFile(filePath);
        } else {
            console.log(`  Mode: Hashing content only (excludes metadata) - Algorithm: ${this.algorithm.toUpperCase()}`);
            hashResult = await this.generateHashFromContent(filePath);
        }
        
        const endTime = performance.now();
        const timeTaken = (endTime - startTime) / 1000; // Convert to seconds
        
        return { hash: hashResult, timeTaken };
    }
    
    async checkHashExists(fileHash) {
        /**
         * Check if a hash already exists in the database.
         * 
         * @param {string} fileHash - The hash to check
         * @returns {Object|null} Existing record if found, null otherwise
         */
        const query = 'SELECT * FROM pdf_hashes WHERE file_hash = $1';
        
        try {
            const result = await this.pool.query(query, [fileHash]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error(`✗ Error checking hash: ${error.message}`);
            throw error;
        }
    }
    
    async storeHash(filePath, fileHash) {
        /**
         * Store the PDF hash in NeonDB.
         * 
         * @param {string} filePath - Path to the PDF file
         * @param {string} fileHash - The generated hash
         * @returns {boolean} True if stored successfully, False if hash already exists
         */
        // Check if hash already exists
        const existing = await this.checkHashExists(fileHash);
        if (existing) {
            console.log('⚠ Hash already exists in database!');
            console.log(`  Original file: ${existing.file_name}`);
            console.log(`  Original path: ${existing.file_path}`);
            console.log(`  Created at: ${existing.created_at}`);
            return false;
        }
        
        // Get file metadata
        const fileName = filePath.split('/').pop();
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;
        
        const insertQuery = `
            INSERT INTO pdf_hashes (file_name, file_path, file_hash, file_size, hash_algorithm, content_only)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;
        
        try {
            const result = await this.pool.query(
                insertQuery,
                [fileName, filePath, fileHash, fileSize, this.algorithm.toUpperCase(), !this.includeMetadata]
            );
            const recordId = result.rows[0].id;
            console.log(`✓ Hash stored successfully with ID: ${recordId}`);
            return true;
            
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                console.log('⚠ Hash already exists (integrity constraint)');
                return false;
            }
            console.error(`✗ Error storing hash: ${error.message}`);
            throw error;
        }
    }
    
    async processPDF(filePath) {
        /**
         * Complete workflow: generate hash and store in database.
         * 
         * @param {string} filePath - Path to the PDF file
         * @returns {Object} Processing results
         */
        console.log('\n' + '='.repeat(60));
        console.log(`Processing: ${filePath}`);
        console.log('='.repeat(60));
        
        // Validate file
        try {
            await fs.access(filePath);
        } catch {
            throw new Error(`File not found: ${filePath}`);
        }
        
        if (!filePath.toLowerCase().endsWith('.pdf')) {
            console.log('⚠ Warning: File does not have .pdf extension');
        }
        
        // Generate hash
        const { hash: fileHash, timeTaken } = await this.generateHash(filePath);
        
        // Store in database
        const stored = await this.storeHash(filePath, fileHash);
        
        const stats = await fs.stat(filePath);
        const result = {
            filePath,
            fileName: filePath.split('/').pop(),
            hash: fileHash,
            algorithm: this.algorithm.toUpperCase(),
            contentOnly: !this.includeMetadata,
            stored,
            fileSize: stats.size,
            timeTaken
        };
        
        console.log('='.repeat(60) + '\n');
        return result;
    }
}

async function compareAlgorithms(dbConfig, pdfFilePath, parser = 'pdf-parse') {
    /**
     * Compare all hash algorithms on the same PDF file.
     * @param {string} parser - PDF parser to use ('pdf-parse' or 'pdftotext')
     */
    const algorithms = ['blake2b', 'sha256', 'sha512', 'sha3-256', 'sha3-512'];
    const results = [];
    
    const stats = await fs.stat(pdfFilePath);
    const fileSize = stats.size;
    
    console.log('\n' + '='.repeat(80));
    console.log('HASH ALGORITHM COMPARISON - Content-Based Hashing');
    console.log('='.repeat(80));
    console.log(`File: ${pdfFilePath.split('/').pop()}`);
    console.log(`Size: ${fileSize.toLocaleString()} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Parser: ${parser}`);
    console.log('='.repeat(80) + '\n');
    
    for (const algo of algorithms) {
        console.log(`Testing ${algo.toUpperCase()}...`);
        console.log('-'.repeat(80));
        
        const hasher = new PDFHasher(dbConfig, false, algo, parser);
        
        try {
            await hasher.connect();
            
            // Generate hash (don't store to avoid duplicates)
            const { hash: fileHash, timeTaken } = await hasher.generateHash(pdfFilePath);
            
            const timeMs = timeTaken * 1000;
            const throughputMbps = (fileSize / 1024 / 1024) / timeTaken;
            const hashLength = fileHash.length;
            const outputBits = hashLength * 4; // Each hex char = 4 bits
            
            results.push({
                algorithm: algo.toUpperCase(),
                hash: fileHash,
                timeMs,
                throughputMbps,
                hashLength,
                outputBits
            });
            
            console.log(`  Time: ${timeMs.toFixed(2)}ms`);
            console.log(`  Throughput: ${throughputMbps.toFixed(2)} MB/s`);
            console.log(`  Hash length: ${hashLength} characters (${outputBits} bits)\n`);
            
        } catch (error) {
            console.error(`✗ Error with ${algo}: ${error.message}\n`);
        } finally {
            await hasher.disconnect();
        }
    }
    
    // Print comparison table
    console.log('='.repeat(80));
    console.log('PERFORMANCE COMPARISON');
    console.log('='.repeat(80));
    console.log(`${'Algorithm'.padEnd(15)} ${'Time (ms)'.padEnd(12)} ${'Throughput'.padEnd(15)} ${'Bits'.padEnd(10)} Relative`);
    console.log('-'.repeat(80));
    
    // Sort by speed (fastest first)
    results.sort((a, b) => a.timeMs - b.timeMs);
    const fastestTime = results[0].timeMs;
    
    results.forEach((r, i) => {
        const relative = r.timeMs / fastestTime;
        const icon = i === 0 ? '🏆' : '  ';
        console.log(
            `${icon} ${r.algorithm.padEnd(13)} ${r.timeMs.toFixed(2).padStart(8)} ms  ` +
            `${r.throughputMbps.toFixed(2).padStart(8)} MB/s  ${r.outputBits.toString().padEnd(10)} ${relative.toFixed(2).padStart(6)}x`
        );
    });
    
    console.log('='.repeat(80));
    
    // Show actual hashes
    console.log('\nHASH OUTPUTS:');
    console.log('-'.repeat(80));
    for (const r of results) {
        console.log(`\n${r.algorithm} (${r.hashLength} chars):`);
        console.log(`  ${r.hash.substring(0, 64)}...`);
        if (r.hash.length > 64) {
            console.log(`  ...${r.hash.substring(64)}`);
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATIONS:');
    console.log('='.repeat(80));
    
    const fastest = results[0];
    console.log(`\n🏆 Fastest: ${fastest.algorithm} (${fastest.timeMs.toFixed(2)}ms)`);
    
    // Find most secure (largest output)
    const mostBits = results.reduce((max, r) => r.outputBits > max.outputBits ? r : max);
    console.log(`🔒 Most Bits: ${mostBits.algorithm} (${mostBits.outputBits} bits)`);
    
    console.log('\n✅ Best for PDF Deduplication: BLAKE2B');
    console.log('   • Fast performance');
    console.log('   • 512-bit output (excellent collision resistance)');
    console.log('   • Modern design for hashing');
    console.log('   • Content-based = metadata independent');
    
    console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
    /**
     * Example usage of the PDFHasher class with algorithm comparison.
     */
    const rl = createReadlineInterface();
    
    try {
        // Load configuration from .env file
        const dbConfig = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            ssl: process.env.DB_SSL === 'true'
        };
        
        // Validate configuration
        if (!dbConfig.host || !dbConfig.username || !dbConfig.password || !dbConfig.database) {
            console.log('\n' + '='.repeat(60));
            console.log('⚠ Database configuration incomplete!');
            console.log('='.repeat(60));
            console.log('\nPlease set up your .env file with the following variables:');
            console.log('  DB_HOST=your-neondb-host.neon.tech');
            console.log('  DB_PORT=5432');
            console.log('  DB_USERNAME=your_username');
            console.log('  DB_PASSWORD=your_password');
            console.log('  DB_DATABASE=neondb');
            console.log('  DB_SSL=true');
            console.log('\n' + '='.repeat(60) + '\n');
            return;
        }
        
        const PDF_FILE_PATH = '../taleoftwocities.pdf';  // Relative to node_implementation folder
        // OR use absolute path: '/home/manu/Desktop/resumeHashingPOC/taleoftwocities.pdf'
        
        // Check if PDF file exists
        try {
            await fs.access(PDF_FILE_PATH);
        } catch {
            console.log(`\n⚠ Error: PDF file not found: ${PDF_FILE_PATH}`);
            console.log('Please update PDF_FILE_PATH in the main() function\n');
            return;
        }
        
        // Ask user which parser to use
        console.log('\n' + '='.repeat(80));
        console.log('PDF PARSER SELECTION');
        console.log('='.repeat(80));
        console.log('\nAvailable parsers:');
        console.log('  1. pdf-parse   - Pure JavaScript, slower (~1700ms)');
        console.log('  2. pdftotext   - Native C library, faster (~800ms, 2.1x speedup)');
        console.log('\nNote: pdftotext requires poppler-utils to be installed');
        console.log('      (sudo apt-get install poppler-utils)');
        
        let parser = 'pdf-parse';
        const parserChoice = await askQuestion(rl, '\nWhich parser would you like to use? (1/2, default: 1): ');
        
        if (parserChoice === '2') {
            // Check if pdftotext is available
            try {
                await execPromise('which pdftotext');
                parser = 'pdftotext';
                console.log('✓ Using pdftotext (poppler-utils detected)\n');
            } catch {
                console.log('\n⚠ Warning: pdftotext not found. Falling back to pdf-parse.');
                console.log('  To install: sudo apt-get install poppler-utils\n');
                parser = 'pdf-parse';
            }
        } else {
            console.log('✓ Using pdf-parse\n');
        }
        
        // Run algorithm comparison
        await compareAlgorithms(dbConfig, PDF_FILE_PATH, parser);
        
        // Now process with recommended algorithm (BLAKE2b)
        console.log('\n' + '='.repeat(80));
        console.log('STORING HASH WITH RECOMMENDED ALGORITHM (BLAKE2B)');
        console.log('='.repeat(80) + '\n');
        
        // Initialize hasher with content-only mode, BLAKE2b, and selected parser
        const hasher = new PDFHasher(dbConfig, false, 'blake2b', parser);
        
        try {
            // Connect to database
            await hasher.connect();
            
            // Create table if not exists
            await hasher.createTable();
            
            // Process PDF file
            const result = await hasher.processPDF(PDF_FILE_PATH);
            
            // Print results
            console.log('Results:');
            console.log(`  File: ${result.fileName}`);
            console.log(`  Hash: ${result.hash.substring(0, 64)}...`);
            console.log(`  Algorithm: ${result.algorithm}`);
            console.log(`  Content-only: ${result.contentOnly}`);
            console.log(`  Size: ${result.fileSize} bytes`);
            console.log(`  Time: ${(result.timeTaken * 1000).toFixed(2)}ms`);
            console.log(`  Stored: ${result.stored ? 'Yes' : 'No (duplicate)'}`);
            
        } catch (error) {
            console.error(`\n✗ Error: ${error.message}`);
        } finally {
            // Cleanup
            await hasher.disconnect();
        }
    } catch (error) {
        console.error(`\n✗ Fatal Error: ${error.message}`);
    } finally {
        rl.close();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { PDFHasher, compareAlgorithms };
