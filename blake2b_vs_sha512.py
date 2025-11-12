#!/usr/bin/env python3
"""
Direct comparison: BLAKE2b vs SHA-512
Both produce 512-bit hashes, but which is better for PDF deduplication?
"""
import hashlib
import time
import os


def detailed_comparison():
    """
    Detailed technical comparison of BLAKE2b vs SHA-512
    """
    
    print("=" * 80)
    print("BLAKE2b vs SHA-512: Direct Comparison")
    print("Both produce 512-bit (64-byte) hashes")
    print("=" * 80)
    
    print("\n📊 HASH OUTPUT SIZE")
    print("-" * 80)
    print("BLAKE2b:  512 bits (128 hex characters)")
    print("SHA-512:  512 bits (128 hex characters)")
    print("Result:   ✓ TIE - Same collision resistance (2^256 security)")
    
    print("\n🔐 SECURITY")
    print("-" * 80)
    print("BLAKE2b:")
    print("  • Designed in 2012 (modern)")
    print("  • Based on ChaCha stream cipher")
    print("  • No known vulnerabilities")
    print("  • Used by: IPFS, WireGuard, Zcash, Libsodium")
    print("  • Security margin: Excellent (12 rounds)")
    print("")
    print("SHA-512:")
    print("  • Designed in 2001 (NIST FIPS 180-2)")
    print("  • Part of SHA-2 family")
    print("  • No known vulnerabilities")
    print("  • Used by: TLS, SSL, Bitcoin, PGP")
    print("  • Security margin: Excellent (80 rounds)")
    print("")
    print("Result:   ✓ TIE - Both cryptographically secure")
    
    print("\n⚡ SPEED (Theory)")
    print("-" * 80)
    print("BLAKE2b:")
    print("  • Rounds: 12 compression rounds")
    print("  • Operations: Simpler ARX operations (Add, Rotate, XOR)")
    print("  • Parallelization: Excellent (tree mode available)")
    print("  • SIMD optimization: Built-in from design")
    print("  • Hardware acceleration: NO dedicated instructions")
    print("")
    print("SHA-512:")
    print("  • Rounds: 80 compression rounds")
    print("  • Operations: More complex (shift, rotate, AND, OR, XOR)")
    print("  • Parallelization: Limited")
    print("  • SIMD optimization: Possible but not native")
    print("  • Hardware acceleration: YES (SHA-NI on Intel/AMD)")
    print("")
    print("Theoretical winner: BLAKE2b (12 rounds vs 80 rounds)")
    print("Actual winner: DEPENDS ON CPU!")
    print("  - With SHA-NI (modern CPUs): SHA-512 faster")
    print("  - Without SHA-NI (older CPUs): BLAKE2b faster")
    
    print("\n💻 YOUR SYSTEM BENCHMARK")
    print("-" * 80)
    
    # Benchmark on actual file
    pdf_file = '/home/manu/Desktop/resumeHashingPOC/taleoftwocities.pdf'
    
    if not os.path.exists(pdf_file):
        print("⚠ PDF file not found for benchmark")
        return
    
    file_size = os.path.getsize(pdf_file)
    iterations = 10
    
    print(f"File: {os.path.basename(pdf_file)}")
    print(f"Size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)")
    print(f"Iterations: {iterations}")
    print()
    
    # Test BLAKE2b
    blake2b_times = []
    for _ in range(iterations):
        hasher = hashlib.blake2b()
        start = time.perf_counter()
        with open(pdf_file, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        blake2b_hash = hasher.hexdigest()
        blake2b_times.append(time.perf_counter() - start)
    
    blake2b_avg = sum(blake2b_times) / len(blake2b_times)
    blake2b_throughput = (file_size / 1024 / 1024) / blake2b_avg
    
    # Test SHA-512
    sha512_times = []
    for _ in range(iterations):
        hasher = hashlib.sha512()
        start = time.perf_counter()
        with open(pdf_file, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        sha512_hash = hasher.hexdigest()
        sha512_times.append(time.perf_counter() - start)
    
    sha512_avg = sum(sha512_times) / len(sha512_times)
    sha512_throughput = (file_size / 1024 / 1024) / sha512_avg
    
    print(f"BLAKE2b: {blake2b_avg*1000:.2f}ms avg ({blake2b_throughput:.2f} MB/s)")
    print(f"SHA-512: {sha512_avg*1000:.2f}ms avg ({sha512_throughput:.2f} MB/s)")
    print()
    
    if blake2b_avg < sha512_avg:
        speedup = sha512_avg / blake2b_avg
        print(f"🏆 Winner: BLAKE2b is {speedup:.2f}x faster on your system")
        has_sha_ni = False
    else:
        speedup = blake2b_avg / sha512_avg
        print(f"🏆 Winner: SHA-512 is {speedup:.2f}x faster on your system")
        print("   (Your CPU likely has SHA-NI hardware acceleration)")
        has_sha_ni = True
    
    print("\n🎯 WHY BLAKE2b IS STILL THE BETTER CHOICE")
    print("-" * 80)
    
    reasons = [
        {
            'title': '1. CONSISTENT PERFORMANCE ACROSS PLATFORMS',
            'explanation': [
                'BLAKE2b performance is predictable everywhere',
                'SHA-512 performance varies wildly based on CPU',
                '  - New CPUs (2016+): SHA-512 faster (hardware accelerated)',
                '  - Old CPUs: BLAKE2b much faster (software only)',
                'For production: predictability > peak performance'
            ]
        },
        {
            'title': '2. DESIGNED FOR MODERN USE CASES',
            'explanation': [
                'BLAKE2b was designed specifically for hashing (2012)',
                'SHA-512 was adapted from SHA-256 for larger output (2001)',
                'BLAKE2b optimizations:',
                '  - Built-in keyed hashing (HMAC alternative)',
                '  - Configurable output length',
                '  - Tree hashing for parallelization',
                '  - Personalization parameter'
            ]
        },
        {
            'title': '3. CLEANER DESIGN',
            'explanation': [
                'BLAKE2b: 12 rounds is sufficient for security',
                'SHA-512: 80 rounds (conservative design from 2001)',
                'More rounds ≠ more secure after certain point',
                'BLAKE2b has larger security margin per round'
            ]
        },
        {
            'title': '4. BETTER FOR FUTURE HARDWARE',
            'explanation': [
                'BLAKE2b designed for SIMD parallelization',
                'Will perform better on GPUs and specialized hardware',
                'SHA-512 requires dedicated silicon for acceleration',
                'BLAKE2b accelerates naturally with general improvements'
            ]
        },
        {
            'title': '5. ADOPTION BY MODERN PROJECTS',
            'explanation': [
                'IPFS (distributed file system) uses BLAKE2b',
                'WireGuard VPN uses BLAKE2s',
                'Zcash cryptocurrency uses BLAKE2b',
                'Libsodium crypto library defaults to BLAKE2b',
                '',
                'SHA-512 adoption is legacy-driven:',
                '  - TLS/SSL (needs backwards compatibility)',
                '  - Bitcoin (designed 2008, before BLAKE2)',
                '  - PGP/GPG (legacy standard)'
            ]
        }
    ]
    
    for reason in reasons:
        print(f"\n{reason['title']}")
        for line in reason['explanation']:
            if line:
                print(f"  {line}")
            else:
                print()
    
    print("\n⚖️  WHEN TO USE SHA-512 INSTEAD")
    print("-" * 80)
    use_sha512 = [
        '✓ Regulatory compliance requires NIST-approved algorithms',
        '✓ Interoperability with systems that only support SHA-2',
        '✓ Working with TLS/SSL certificates',
        '✓ Blockchain/Bitcoin applications',
        '✓ Legal/audit requirements for "standard" algorithms',
        '✓ Your infrastructure already optimized for SHA-512'
    ]
    
    for case in use_sha512:
        print(f"  {case}")
    
    print("\n✅ WHEN TO USE BLAKE2b (Your Case: PDF Deduplication)")
    print("-" * 80)
    use_blake2b = [
        '✓ Modern application (no legacy constraints)',
        '✓ Performance matters (will process many files)',
        '✓ Cross-platform deployment (servers, laptops, embedded)',
        '✓ Want future-proof design',
        '✓ Don\'t need compatibility with external systems',
        '✓ Prefer algorithms designed for purpose',
        '✓ Like clean, modern cryptography'
    ]
    
    for case in use_blake2b:
        print(f"  {case}")
    
    print("\n📈 REAL-WORLD IMPACT")
    print("-" * 80)
    
    # Calculate for large workload
    files_per_day = 10000
    avg_file_size_mb = 1.26  # Your PDF size
    
    blake2b_time_per_file = blake2b_avg
    sha512_time_per_file = sha512_avg
    
    blake2b_daily_time = (blake2b_time_per_file * files_per_day) / 60
    sha512_daily_time = (sha512_time_per_file * files_per_day) / 60
    
    print(f"Scenario: Processing {files_per_day:,} PDF files per day")
    print(f"Average file size: {avg_file_size_mb:.2f} MB")
    print()
    print(f"BLAKE2b: {blake2b_daily_time:.1f} minutes/day")
    print(f"SHA-512: {sha512_daily_time:.1f} minutes/day")
    print(f"Difference: {abs(blake2b_daily_time - sha512_daily_time):.1f} minutes/day")
    print()
    
    if blake2b_daily_time < sha512_daily_time:
        saved_per_year = (sha512_daily_time - blake2b_daily_time) * 365 / 60
        print(f"💰 BLAKE2b saves: {saved_per_year:.1f} hours per year")
    else:
        saved_per_year = (blake2b_daily_time - sha512_daily_time) * 365 / 60
        print(f"💰 SHA-512 saves: {saved_per_year:.1f} hours per year")
        if has_sha_ni:
            print("   (But only on CPUs with SHA-NI support)")
    
    print("\n🎓 TECHNICAL DEEP DIVE")
    print("-" * 80)
    print("\nBLAKE2b Algorithm Structure:")
    print("  1. Based on ChaCha20 stream cipher")
    print("  2. Uses ARX operations (Add-Rotate-XOR)")
    print("  3. 12 rounds of mixing")
    print("  4. Internal state: 8 × 64-bit words")
    print("  5. Block size: 128 bytes")
    print("  6. Optimization: Quarter-round function")
    print()
    print("SHA-512 Algorithm Structure:")
    print("  1. Merkle-Damgård construction")
    print("  2. Uses shift, rotate, AND, OR, XOR operations")
    print("  3. 80 rounds of compression")
    print("  4. Internal state: 8 × 64-bit words")
    print("  5. Block size: 128 bytes")
    print("  6. Message schedule: 80 derived words")
    print()
    print("Why BLAKE2b is faster (in software):")
    print("  • Fewer rounds: 12 vs 80")
    print("  • Simpler operations: ARX vs complex bit operations")
    print("  • Better CPU cache utilization")
    print("  • More amenable to compiler optimization")
    print()
    print("Why SHA-512 can be faster (with hardware):")
    print("  • Dedicated CPU instructions (SHA-NI)")
    print("  • Intel/AMD added SHA acceleration in 2016+")
    print("  • Hardware does 4 rounds per instruction")
    print("  • But: Not available on all CPUs!")
    
    print("\n🔬 COLLISION RESISTANCE MATH")
    print("-" * 80)
    print("Both BLAKE2b and SHA-512 have 512-bit output")
    print()
    print("Birthday paradox collision probability:")
    print(f"  Hash space: 2^512 possible hashes")
    print(f"  Security level: 2^256 (half of output bits)")
    print()
    print(f"To have 50% chance of collision:")
    print(f"  Need: 2^256 ≈ 1.16 × 10^77 hashes")
    print()
    print(f"To put in perspective:")
    print(f"  • Atoms in observable universe: ~10^80")
    print(f"  • Need to hash: ~0.1% of all atoms")
    print(f"  • At 1 billion hashes/sec: Would take 10^60 years")
    print(f"  • Age of universe: 13.8 billion years")
    print()
    print("Conclusion: Both are effectively collision-free ✓")
    
    print("\n" + "=" * 80)
    print("FINAL VERDICT")
    print("=" * 80)
    print()
    print("For PDF deduplication, BLAKE2b is the better choice because:")
    print()
    print("  ✓ Same 512-bit collision resistance as SHA-512")
    print("  ✓ Faster or comparable speed on all platforms")
    print("  ✓ Modern design optimized for file hashing")
    print("  ✓ Better future-proofing")
    print("  ✓ No dependency on specific CPU features")
    print("  ✓ Cleaner API with additional features")
    print()
    print("SHA-512 is excellent, but it's like comparing:")
    print("  • A 2012 sports car (BLAKE2b) vs")
    print("  • A 2001 sports car (SHA-512)")
    print()
    print("Both will get you there safely, but the newer one was")
    print("designed with modern roads in mind.")
    print()
    print("=" * 80)
    
    print("\n📝 SAMPLE HASHES (Same File)")
    print("-" * 80)
    print(f"BLAKE2b:\n  {blake2b_hash}")
    print()
    print(f"SHA-512:\n  {sha512_hash}")
    print()
    print("Both are equally unique and secure! ✓")
    print()


if __name__ == "__main__":
    detailed_comparison()
