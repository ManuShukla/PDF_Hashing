# PDF Parser Comparison

## Quick Summary

When running `npm start`, you'll be asked to choose between two PDF parsers:

```
1. pdf-parse   - Pure JavaScript, slower (~1700ms)
2. pdftotext   - Native C library, faster (~800ms, 2.1x speedup)
```

## Performance Results

### Using pdf-parse (Option 1)
- **Total Time**: ~1600ms
- **Parsing Time**: ~1500ms (93%)
- **Hashing Time**: ~100ms (7%)
- **Advantages**: No system dependencies, pure JavaScript
- **Disadvantages**: Slower, higher CPU usage

### Using pdftotext (Option 2)
- **Total Time**: ~850ms
- **Parsing Time**: ~750ms (88%)
- **Hashing Time**: ~100ms (12%)
- **Advantages**: 2.1x faster, native C performance
- **Disadvantages**: Requires poppler-utils installed

## Installation

### pdf-parse
Already included in package.json:
```bash
npm install  # Already done
```

### pdftotext (poppler-utils)

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

**Check if installed:**
```bash
which pdftotext
pdftotext -v
```

## Recommendation

**Use pdftotext (Option 2)** if:
- ✅ You have sudo access to install system packages
- ✅ Performance is important (2.1x faster)
- ✅ You're processing many PDFs
- ✅ You want better text extraction quality

**Use pdf-parse (Option 1)** if:
- ✅ You can't install system packages
- ✅ Portability is more important than speed
- ✅ You're only processing a few PDFs
- ✅ You want zero system dependencies

## Hash Comparison

The parsers extract text slightly differently, resulting in **different hashes** for the same PDF:

### pdf-parse hash:
```
cf4a1009726a9c30a8ee56c79f011f8e4790c9ef0a57be9ee79e1f05c61248df...
```
- Extracted: 649,975 characters
- Removes more whitespace
- Example: "ofTwoCities" (words joined)

### pdftotext hash:
```
c0d02b70eacc017be5b41a7ba33b7d02d4ce0c82ab6981156f61aaed3d464702...
```
- Extracted: 761,807 characters
- Preserves more whitespace
- Example: "of Two Cities" (proper spacing)

## Important Note

**Once you choose a parser, stick with it!** Different parsers produce different hashes for the same PDF content. If you store hashes with pdf-parse, you must continue using pdf-parse for deduplication to work correctly.

## Standalone Comparison Tool

To compare both parsers without storing hashes:

```bash
node compare_parsers.js ../taleoftwocities.pdf
```

This will show:
- Performance metrics for both parsers
- Text extraction quality
- Speed comparison
- Recommendations

## Example Output

```
================================================================================
PERFORMANCE RESULTS
================================================================================
Parser               | Avg (ms) | Min (ms) | Max (ms) | Median | Text Length
--------------------------------------------------------------------------------
pdf-parse            |  1697.67 |     1539 |     1992 |   1562 |      649975
pdftotext-command    |   797.00 |      781 |      806 |    804 |      761807

================================================================================
SPEED COMPARISON
================================================================================
pdftotext-command is 2.13x FASTER than pdf-parse (113.0% faster)
```

## Technical Details

### pdf-parse
- **Implementation**: Pure JavaScript
- **Library**: pdf-parse npm package
- **How it works**: Parses PDF structure in Node.js
- **Speed**: Moderate (JavaScript parsing overhead)
- **Text quality**: Good, but joins some words

### pdftotext
- **Implementation**: Native C library (poppler)
- **Command**: System command via child_process
- **How it works**: Calls `pdftotext` command
- **Speed**: Fast (native C performance)
- **Text quality**: Excellent, preserves proper spacing

## Code Changes

The parser selection is implemented in `pdf_hasher_node.js`:

```javascript
// Constructor now accepts parser parameter
constructor(dbConfig, includeMetadata = false, algorithm = 'blake2b', parser = 'pdf-parse')

// generateHashFromContent uses selected parser
if (this.parser === 'pdftotext') {
    const { stdout } = await execPromise(`pdftotext "${filePath}" -`);
    text = stdout;
} else {
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    text = pdfData.text;
}
```

## Best Practice

1. **Choose once**: Pick a parser and stick with it for consistency
2. **Store choice**: Document which parser you're using
3. **Test first**: Run `compare_parsers.js` to verify performance
4. **Consider scale**: For large-scale operations, pdftotext is worth the setup time
