"""
Example usage scenarios for the PDF Hasher
"""
import os
from pdf_hasher import PDFHasher
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def example_single_file():
    """Process a single PDF file"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Processing a Single PDF File")
    print("="*60)
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    hasher = PDFHasher(DATABASE_URL)
    
    try:
        hasher.connect()
        hasher.create_table()
        
        # Process single PDF
        result = hasher.process_pdf('resume.pdf')
        
        print("\nResult Summary:")
        print(f"  Hash: {result['hash']}")
        print(f"  Stored: {'Yes' if result['stored'] else 'No (duplicate found)'}")
        
    finally:
        hasher.disconnect()


def example_multiple_files():
    """Process multiple PDF files"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Processing Multiple PDF Files")
    print("="*60)
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    hasher = PDFHasher(DATABASE_URL)
    
    pdf_files = [
        'resume1.pdf',
        'resume2.pdf',
        'resume3.pdf',
    ]
    
    try:
        hasher.connect()
        hasher.create_table()
        
        results = []
        for pdf_file in pdf_files:
            if os.path.exists(pdf_file):
                result = hasher.process_pdf(pdf_file)
                results.append(result)
        
        # Summary
        print("\nProcessing Summary:")
        print(f"  Total files: {len(results)}")
        print(f"  Newly stored: {sum(1 for r in results if r['stored'])}")
        print(f"  Duplicates: {sum(1 for r in results if not r['stored'])}")
        
    finally:
        hasher.disconnect()


def example_check_duplicate():
    """Check if a PDF is a duplicate without storing"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Check for Duplicate Without Storing")
    print("="*60)
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    hasher = PDFHasher(DATABASE_URL)
    
    try:
        hasher.connect()
        hasher.create_table()
        
        pdf_file = 'resume.pdf'
        
        # Generate hash
        file_hash = hasher.generate_hash(pdf_file)
        
        # Check if exists
        existing = hasher.check_hash_exists(file_hash)
        
        if existing:
            print("\n✓ This PDF already exists in database!")
            print(f"  Original file: {existing['file_name']}")
            print(f"  Stored on: {existing['created_at']}")
        else:
            print("\n✓ This is a new PDF (not in database)")
            print(f"  Hash: {file_hash}")
        
    finally:
        hasher.disconnect()


def example_batch_with_directory():
    """Process all PDFs in a directory"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Batch Process Directory")
    print("="*60)
    
    import glob
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    hasher = PDFHasher(DATABASE_URL)
    
    try:
        hasher.connect()
        hasher.create_table()
        
        # Find all PDFs in current directory and subdirectories
        pdf_files = glob.glob('**/*.pdf', recursive=True)
        
        print(f"\nFound {len(pdf_files)} PDF files")
        
        results = []
        for pdf_file in pdf_files:
            result = hasher.process_pdf(pdf_file)
            results.append(result)
        
        # Detailed summary
        print("\n" + "="*60)
        print("BATCH PROCESSING SUMMARY")
        print("="*60)
        print(f"Total files processed: {len(results)}")
        print(f"Successfully stored: {sum(1 for r in results if r['stored'])}")
        print(f"Duplicates found: {sum(1 for r in results if not r['stored'])}")
        
        total_size = sum(r['file_size'] for r in results)
        print(f"Total size: {total_size:,} bytes ({total_size/1024/1024:.2f} MB)")
        
    finally:
        hasher.disconnect()


def example_custom_workflow():
    """Custom workflow with manual hash generation and storage"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Custom Workflow")
    print("="*60)
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    hasher = PDFHasher(DATABASE_URL)
    
    try:
        hasher.connect()
        hasher.create_table()
        
        pdf_file = 'resume.pdf'
        
        # Step 1: Generate hash
        print("\nStep 1: Generating hash...")
        file_hash = hasher.generate_hash(pdf_file)
        
        # Step 2: Check if already exists
        print("\nStep 2: Checking for duplicates...")
        existing = hasher.check_hash_exists(file_hash)
        
        # Step 3: Store if new
        if not existing:
            print("\nStep 3: Storing new hash...")
            hasher.store_hash(pdf_file, file_hash)
            print("✓ Complete!")
        else:
            print("\nStep 3: Skipping storage (duplicate found)")
            print(f"  Already stored as: {existing['file_name']}")
        
    finally:
        hasher.disconnect()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("PDF HASHER - USAGE EXAMPLES")
    print("="*60)
    
    # Uncomment the example you want to run:
    
    # example_single_file()
    # example_multiple_files()
    # example_check_duplicate()
    # example_batch_with_directory()
    # example_custom_workflow()
    
    print("\nTo run examples, uncomment the desired function call in example_usage.py")
