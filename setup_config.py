#!/usr/bin/env python3
"""
Interactive setup script for PDF Hasher configuration
"""
import os
import sys


def get_neondb_connection():
    """Interactive prompts to get NeonDB connection details"""
    print("\n" + "="*60)
    print("PDF HASHER - NeonDB Configuration Setup")
    print("="*60)
    print("\nYou need to provide your NeonDB connection string.")
    print("You can find this in your NeonDB dashboard under 'Connection Details'")
    print("\nConnection string format:")
    print("postgresql://username:password@hostname/database?sslmode=require")
    print("\nExample:")
    print("postgresql://myuser:mypassword@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require")
    print("\n" + "-"*60)
    
    connection_string = input("\nEnter your NeonDB connection string: ").strip()
    
    if not connection_string:
        print("\n✗ Error: Connection string cannot be empty")
        return None
    
    if not connection_string.startswith('postgresql://'):
        print("\n⚠ Warning: Connection string should start with 'postgresql://'")
        confirm = input("Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            return None
    
    return connection_string


def create_env_file(connection_string):
    """Create or update .env file"""
    env_path = '.env'
    
    try:
        with open(env_path, 'w') as f:
            f.write(f"# NeonDB Connection String\n")
            f.write(f"DATABASE_URL={connection_string}\n")
        
        print(f"\n✓ Configuration saved to {env_path}")
        return True
    except Exception as e:
        print(f"\n✗ Error saving configuration: {e}")
        return False


def test_connection():
    """Test the database connection"""
    print("\n" + "-"*60)
    test = input("Would you like to test the connection now? (y/n): ").strip().lower()
    
    if test == 'y':
        print("\nTesting connection...")
        try:
            from dotenv import load_dotenv
            import psycopg2
            
            load_dotenv()
            DATABASE_URL = os.getenv('DATABASE_URL')
            
            conn = psycopg2.connect(DATABASE_URL)
            conn.close()
            
            print("✓ Connection successful!")
            return True
        except ImportError:
            print("⚠ python-dotenv not installed. Run: pip install -r requirements.txt")
            return False
        except Exception as e:
            print(f"✗ Connection failed: {e}")
            return False
    
    return None


def main():
    print("\n🚀 Welcome to PDF Hasher Setup\n")
    
    # Check if .env already exists
    if os.path.exists('.env'):
        print("⚠ Warning: .env file already exists")
        overwrite = input("Do you want to overwrite it? (y/n): ").strip().lower()
        if overwrite != 'y':
            print("\n✓ Keeping existing configuration")
            sys.exit(0)
    
    # Get connection string
    connection_string = get_neondb_connection()
    
    if not connection_string:
        print("\n✗ Setup cancelled")
        sys.exit(1)
    
    # Save to .env
    if not create_env_file(connection_string):
        sys.exit(1)
    
    # Test connection
    test_connection()
    
    # Next steps
    print("\n" + "="*60)
    print("Setup Complete! Next Steps:")
    print("="*60)
    print("\n1. Run the PDF hasher:")
    print("   python3 pdf_hasher.py")
    print("\n2. Or try the examples:")
    print("   python3 example_usage.py")
    print("\n3. View documentation:")
    print("   cat README.md")
    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Setup cancelled by user")
        sys.exit(1)
