# Quick Reference: File Editing in This Codespace

## Problem Identified ❌

The `replace_string_in_file` tool sometimes fails to persist changes in this codespace environment.

## Solution ✅

Use our new `safe_replace.py` script for all file edits.

## Quick Start

```bash
# Single replacement
python scripts/safe_replace.py <file_path> '<old_string>' '<new_string>'

# Example
python scripts/safe_replace.py src/App.jsx "const oldVar" "const newVar"

# After any edit, verify changes persisted
git diff <file_path>
```

## Real World Examples

### Update a constant
```bash
python scripts/safe_replace.py src/config/constants.js \
  "export const API_KEY = 'old'" \
  "export const API_KEY = 'new'"
```

### Fix a bug in component
```bash
python scripts/safe_replace.py src/features/bible/BibleStudy.jsx \
  "const buggyLine = true;" \
  "const buggyLine = false;"
```

### Multi-file workflow
```bash
# 1. Make multiple changes
python scripts/safe_replace.py file1.jsx "old1" "new1"
python scripts/safe_replace.py file2.jsx "old2" "new2"

# 2. Verify all changes
git diff

# 3. Build and test
npm run build

# 4. Commit if successful
git add -A && git commit -m "Your message" && git push
```

## What The Script Does

✓ Finds exact string match  
✓ Replaces only the first occurrence  
✓ Writes with filesystem sync (ensures persistence)  
✓ **Verifies** the change persisted  
✓ Reports success or failure  
✓ Recovers original if verification fails  

## Troubleshooting

### "Old string not found"
- Check exact spelling, spacing, and newlines
- Strings are case-sensitive
- Try: `grep "part of string" <file>`

### "Verification failed"  
- File permissions issue? Check: `ls -la <file>`
- Rare: Close VS Code and reopen, try again
- Last resort: Manual edit in VS Code

## For Larger Edits

If you need to replace many lines or multiple sections, create a Python script:

```python
#!/usr/bin/env python3
# my_edit_script.py
import os

def edit_file():
    with open('src/App.jsx', 'r') as f:
        content = f.read()
    
    # Make multiple changes
    content = content.replace("old1", "new1")
    content = content.replace("old2", "new2")
    content = content.replace("old3", "new3")
    
    with open('src/App.jsx', 'w') as f:
        f.write(content)
    
    print("✓ Changes made")

if __name__ == '__main__':
    edit_file()
```

Then run:
```bash
python my_edit_script.py
git diff
npm run build
```

## Full Documentation

See `PERSISTENCE_FIX.md` for detailed information about:
- Root cause analysis
- Implementation details
- Best practices
- Future improvements

---

**TL;DR**: Use `python scripts/safe_replace.py` for all file edits. It just works.
