import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = promisify(exec);

/**
 * Extract text using pdf-parse library (current implementation)
 */
async function extractWithPdfParse(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

/**
 * Extract text using pdftotext command directly (requires poppler-utils)
 */
async function extractWithPdftotextCommand(pdfPath) {
    try {
        const { stdout } = await execPromise(`pdftotext "${pdfPath}" -`);
        return stdout;
    } catch (error) {
        throw new Error(`pdftotext command failed: ${error.message}`);
    }
}

/**
 * Check if poppler-utils is installed
 */
async function checkPopplerInstalled() {
    try {
        await execPromise('which pdftotext');
        return true;
    } catch {
        return false;
    }
}

/**
 * Normalize text for consistent comparison
 */
function normalizeText(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n+/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Compare parsing performance
 */
async function compareParsers(pdfPath, runs = 3) {
    console.log('\n' + '='.repeat(80));
    console.log('PDF PARSER COMPARISON');
    console.log('='.repeat(80));
    console.log(`\nPDF File: ${path.basename(pdfPath)}`);
    
    // Get file stats
    const stats = fs.statSync(pdfPath);
    console.log(`File Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Runs per parser: ${runs}\n`);

    // Check if poppler is installed
    const popplerInstalled = await checkPopplerInstalled();
    if (!popplerInstalled) {
        console.log('⚠️  Warning: poppler-utils not installed. Only testing pdf-parse.');
        console.log('   To install: sudo apt-get install poppler-utils\n');
    }

    const results = {
        'pdf-parse': []
    };

    if (popplerInstalled) {
        results['pdftotext-command'] = [];
    }

    const textResults = {};

    // Test pdf-parse
    console.log('Testing pdf-parse (current implementation)...');
    for (let i = 0; i < runs; i++) {
        const start = Date.now();
        try {
            const text = await extractWithPdfParse(pdfPath);
            const elapsed = Date.now() - start;
            results['pdf-parse'].push(elapsed);
            if (i === 0) {
                textResults['pdf-parse'] = normalizeText(text);
            }
            console.log(`  Run ${i + 1}: ${elapsed}ms`);
        } catch (error) {
            console.log(`  Run ${i + 1}: ERROR - ${error.message}`);
            results['pdf-parse'].push(null);
        }
    }

    // Test pdftotext command (if available)
    if (popplerInstalled) {
        console.log('\nTesting pdftotext command (poppler-utils)...');
        for (let i = 0; i < runs; i++) {
            const start = Date.now();
            try {
                const text = await extractWithPdftotextCommand(pdfPath);
                const elapsed = Date.now() - start;
                results['pdftotext-command'].push(elapsed);
                if (i === 0) {
                    textResults['pdftotext-command'] = normalizeText(text);
                }
                console.log(`  Run ${i + 1}: ${elapsed}ms`);
            } catch (error) {
                console.log(`  Run ${i + 1}: ERROR - ${error.message}`);
                results['pdftotext-command'].push(null);
            }
        }
    }

    // Calculate statistics
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE RESULTS');
    console.log('='.repeat(80) + '\n');

    const stats_summary = {};
    for (const [parser, times] of Object.entries(results)) {
        const validTimes = times.filter(t => t !== null);
        if (validTimes.length === 0) {
            stats_summary[parser] = { status: 'FAILED' };
            continue;
        }

        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const min = Math.min(...validTimes);
        const max = Math.max(...validTimes);
        const median = validTimes.sort((a, b) => a - b)[Math.floor(validTimes.length / 2)];

        stats_summary[parser] = {
            status: 'SUCCESS',
            avg: avg.toFixed(2),
            min,
            max,
            median,
            textLength: textResults[parser]?.length || 0
        };
    }

    // Print results table
    console.log('Parser               | Avg (ms) | Min (ms) | Max (ms) | Median | Text Length | Status');
    console.log('-'.repeat(95));
    
    for (const [parser, stat] of Object.entries(stats_summary)) {
        if (stat.status === 'FAILED') {
            console.log(`${parser.padEnd(20)} | ${' '.repeat(8)} | ${' '.repeat(8)} | ${' '.repeat(8)} | ${' '.repeat(6)} | ${' '.repeat(11)} | FAILED`);
        } else {
            console.log(
                `${parser.padEnd(20)} | ` +
                `${String(stat.avg).padStart(8)} | ` +
                `${String(stat.min).padStart(8)} | ` +
                `${String(stat.max).padStart(8)} | ` +
                `${String(stat.median).padStart(6)} | ` +
                `${String(stat.textLength).padStart(11)} | ` +
                `${stat.status}`
            );
        }
    }

    // Speed comparison
    console.log('\n' + '='.repeat(80));
    console.log('SPEED COMPARISON');
    console.log('='.repeat(80) + '\n');

    const baseline = stats_summary['pdf-parse'];
    if (baseline?.status === 'SUCCESS') {
        for (const [parser, stat] of Object.entries(stats_summary)) {
            if (parser === 'pdf-parse' || stat.status === 'FAILED') continue;
            
            const speedup = (baseline.avg / stat.avg).toFixed(2);
            const faster = speedup > 1 ? 'FASTER' : 'SLOWER';
            const percent = ((Math.abs(speedup - 1)) * 100).toFixed(1);
            
            console.log(`${parser} is ${speedup}x ${faster} than pdf-parse (${percent}% ${faster.toLowerCase()})`);
        }
    }

    // Text comparison
    console.log('\n' + '='.repeat(80));
    console.log('TEXT EXTRACTION COMPARISON');
    console.log('='.repeat(80) + '\n');

    const baseText = textResults['pdf-parse'];
    if (baseText) {
        console.log(`pdf-parse baseline: ${baseText.length} characters`);
        
        for (const [parser, text] of Object.entries(textResults)) {
            if (parser === 'pdf-parse' || !text) continue;
            
            const lengthDiff = text.length - baseText.length;
            const identical = baseText === text;
            
            console.log(`\n${parser}:`);
            console.log(`  Length: ${text.length} characters (${lengthDiff >= 0 ? '+' : ''}${lengthDiff})`);
            console.log(`  Identical to pdf-parse: ${identical ? 'YES' : 'NO'}`);
            
            if (!identical) {
                // Show first difference
                let firstDiff = -1;
                const minLen = Math.min(baseText.length, text.length);
                for (let i = 0; i < minLen; i++) {
                    if (baseText[i] !== text[i]) {
                        firstDiff = i;
                        break;
                    }
                }
                
                if (firstDiff > -1) {
                    console.log(`  First difference at character ${firstDiff}:`);
                    console.log(`    pdf-parse: "${baseText.substring(firstDiff, firstDiff + 50)}..."`);
                    console.log(`    ${parser}: "${text.substring(firstDiff, firstDiff + 50)}..."`);
                }
            }
        }
    }

    // Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(80) + '\n');

    const successfulParsers = Object.entries(stats_summary)
        .filter(([_, stat]) => stat.status === 'SUCCESS')
        .sort((a, b) => parseFloat(a[1].avg) - parseFloat(b[1].avg));

    if (successfulParsers.length > 0) {
        const [fastest, fastestStats] = successfulParsers[0];
        console.log(`🏆 Fastest parser: ${fastest} (${fastestStats.avg}ms average)`);
        
        if (fastest !== 'pdf-parse') {
            const speedup = (parseFloat(baseline.avg) / parseFloat(fastestStats.avg)).toFixed(1);
            console.log(`\n✨ Switching to ${fastest} would give you ${speedup}x speedup!`);
            console.log(`   Current: ${baseline.avg}ms → Improved: ${fastestStats.avg}ms`);
        }
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node compare_parsers.js <pdf-file-path> [runs]');
        console.log('\nExample:');
        console.log('  node compare_parsers.js ../taleoftwocities.pdf');
        console.log('  node compare_parsers.js ../taleoftwocities.pdf 5');
        console.log('\nNote: This script requires poppler-utils to be installed on your system.');
        console.log('      On Ubuntu/Debian: sudo apt-get install poppler-utils');
        console.log('      On macOS: brew install poppler');
        process.exit(1);
    }

    const pdfPath = args[0];
    const runs = args[1] ? parseInt(args[1]) : 3;

    if (!fs.existsSync(pdfPath)) {
        console.error(`Error: PDF file not found: ${pdfPath}`);
        process.exit(1);
    }

    try {
        await compareParsers(pdfPath, runs);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
