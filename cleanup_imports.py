import os, re

files_to_check = [
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

for filepath in files_to_check:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix: remove const dataPath = path.join lines that appear before functions
    content = re.sub(r"^const dataPath = path\.join\([^)]*\);\n", "", content, flags=re.MULTILINE)
    
    # Fix: remove "async function await write" typo and replace with just "async function write"
    content = content.replace('async function await write', 'async function write')
    content = content.replace('async function await read', 'async function read')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Cleaned: {filepath}")
    else:
        print(f"- OK: {filepath}")

print("Done!")
