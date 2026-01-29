#!/usr/bin/env python3
"""
Safe file replacement script that ensures changes persist in codespaces.
Works around VS Code editor sync issues by directly manipulating files and verifying changes.

Usage:
    python scripts/safe_replace.py <file_path> <old_string> <new_string> [--verify]

Example:
    python scripts/safe_replace.py src/App.jsx "const oldVar" "const newVar"
"""

import sys
import os
from pathlib import Path

def safe_replace(file_path, old_string, new_string, verify=True):
    """
    Safely replace content in a file with verification.
    
    Args:
        file_path: Path to the file to modify
        old_string: Exact string to find and replace
        new_string: String to replace with
        verify: Whether to verify the change was applied
        
    Returns:
        bool: True if successful, False otherwise
    """
    
    # Resolve path
    abs_path = Path(file_path).resolve()
    
    if not abs_path.exists():
        print(f"❌ File not found: {file_path}")
        return False
    
    # Read original content
    try:
        with open(abs_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
    except Exception as e:
        print(f"❌ Failed to read file: {e}")
        return False
    
    # Check if old string exists
    if old_string not in original_content:
        print(f"❌ Old string not found in {file_path}")
        print(f"   Searched for: {old_string[:100]}...")
        return False
    
    # Perform replacement
    new_content = original_content.replace(old_string, new_string, 1)
    
    # Check if replacement would change anything
    if new_content == original_content:
        print(f"⚠️  Replacement would produce no change")
        return False
    
    # Write back with explicit sync
    try:
        fd = os.open(abs_path, os.O_WRONLY | os.O_TRUNC)
        try:
            os.write(fd, new_content.encode('utf-8'))
            os.fsync(fd)
        finally:
            os.close(fd)
    except Exception as e:
        print(f"❌ Failed to write file: {e}")
        return False
    
    # Verify the change persisted
    if verify:
        try:
            with open(abs_path, 'r', encoding='utf-8') as f:
                verified_content = f.read()
            
            if new_string not in verified_content:
                print(f"❌ Verification failed: Change did not persist")
                # Attempt recovery
                with open(abs_path, 'w', encoding='utf-8') as f:
                    f.write(original_content)
                return False
            
            # Count occurrences
            old_count = original_content.count(old_string)
            new_count = verified_content.count(new_string)
            
            print(f"✓ Successfully replaced in {file_path}")
            print(f"  - Changed: 1 occurrence")
            print(f"  - New string count: {new_count}")
            print(f"  - Old string remaining: {old_count - 1}")
            return True
            
        except Exception as e:
            print(f"❌ Verification read failed: {e}")
            return False
    
    return True


def main():
    if len(sys.argv) < 4:
        print("Usage: python safe_replace.py <file_path> <old_string> <new_string> [--verify]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    old_string = sys.argv[2]
    new_string = sys.argv[3]
    verify = '--verify' in sys.argv or '--no-verify' not in sys.argv
    
    success = safe_replace(file_path, old_string, new_string, verify=verify)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
