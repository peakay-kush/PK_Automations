#!/usr/bin/env python3
"""
Fix top-level fs/path imports in API routes to use dynamic await import()
"""

import os
import re

files = [
    'src/app/api/admin/pages/route.js',
    'src/app/api/admin/pages/[id]/route.js',
    'src/app/api/admin/products/route.js',
    'src/app/api/admin/products/[id]/route.js',
    'src/app/api/admin/services/route.js',
    'src/app/api/admin/services/[id]/route.js',
    'src/app/api/admin/shipping/route.js',
    'src/app/api/admin/shipping/[id]/route.js',
    'src/app/api/admin/team/route.js',
    'src/app/api/admin/team/[id]/route.js',
    'src/app/api/admin/teams/route.js',
    'src/app/api/admin/teams/[id]/route.js',
    'src/app/api/admin/tutorials/[id]/route.js',
    'src/app/api/pages/[id]/route.js',
    'src/app/api/products/route.js',
    'src/app/api/products/[id]/route.js',
    'src/app/api/services/route.js',
    'src/app/api/services/[id]/route.js',
    'src/app/api/team/route.js',
]

def fix_file(filepath):
    """Fix a single file by converting sync fs/path to async dynamic imports"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Remove top-level fs and path imports
    content = re.sub(r"^import fs from ['\"]fs['\"];\n", "", content, flags=re.MULTILINE)
    content = re.sub(r"^import path from ['\"]path['\"];\n", "", content, flags=re.MULTILINE)
    
    # Remove const dataPath lines
    content = re.sub(r"^const dataPath = path\.join\([^)]*\);\n", "", content, flags=re.MULTILINE)
    
    # Convert function declarations to async and add dynamic imports
    # Pattern: function readXFile() { ... }
    def fix_read_function(match):
        func_name = match.group(1)
        func_body = match.group(2)
        file_key = func_name.replace('read', '').replace('File', '').lower()
        
        # Get the return value - assume it returns array from JSON
        new_body = f"""  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', '{file_key}.json');
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf8');
  try {{
    const json = JSON.parse(raw);
    return json.{file_key} || [];
  }} catch (err) {{
    return [];
  }}"""
        return f"async function {func_name}() {{\n{new_body}\n}}"
    
    content = re.sub(
        r"^function (read\w+File)\(\) \{\n((?:.*\n)*?)\}",
        fix_read_function,
        content,
        flags=re.MULTILINE
    )
    
    # Convert write functions similarly
    def fix_write_function(match):
        func_name = match.group(1)
        func_body = match.group(2)
        file_key = func_name.replace('write', '').replace('File', '').lower()
        
        new_body = f"""  const fs = await import('fs');
  const path = await import('path');
  const dataPath = path.join(process.cwd(), 'src', 'data', '{file_key}.json');
  const json = {{ {file_key}: data }};
  fs.writeFileSync(dataPath, JSON.stringify(json, null, 2));"""
        return f"async function {func_name}(data) {{\n{new_body}\n}}"
    
    content = re.sub(
        r"^function (write\w+File)\(([^)]*)\) \{\n((?:.*\n)*?)\}",
        fix_write_function,
        content,
        flags=re.MULTILINE
    )
    
    # Convert function calls to await
    content = re.sub(r"(\s+=\s+)read(\w+File)\(\)", r"\1await read\2()", content)
    content = re.sub(r"\bwrite(\w+File)\(", r"await write\1(", content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Fix all files
fixed = 0
for filepath in files:
    if os.path.exists(filepath):
        if fix_file(filepath):
            print(f"✓ Fixed: {filepath}")
            fixed += 1
        else:
            print(f"- Skipped: {filepath} (no changes)")
    else:
        print(f"✗ Not found: {filepath}")

print(f"\nFixed {fixed} files.")
