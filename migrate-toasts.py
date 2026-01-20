#!/usr/bin/env python3
"""
Bulk migration script to replace alert() calls with toast notifications
"""

import os
import re
import subprocess

# Get all .tsx files with alert() calls
result = subprocess.run(
    ['find', '/Users/arun/Documents/applizor-softech-erp/frontend/app', '-name', '*.tsx', '-type', 'f', '-exec', 'grep', '-l', 'alert(', '{}', ';'],
    capture_output=True,
    text=True
)

files = result.stdout.strip().split('\n')
files = [f for f in files if f]  # Remove empty strings

print(f"Found {len(files)} files with alert() calls")

for filepath in files:
    print(f"\nProcessing: {filepath}")
    
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original_content = content
        
        # Check if already has useToast import
        has_use_toast = 'useToast' in content
        
        if not has_use_toast:
            # Add imports after 'use client' or at the top
            if "'use client'" in content:
                content = content.replace(
                    "'use client';",
                    "'use client';\n\nimport { useToast } from '@/hooks/useToast';\nimport { LoadingSpinner } from '@/components/ui/LoadingSpinner';"
                )
            else:
                # Add at top after existing imports
                import_pattern = r"(import .*?;\n)+"
                match = re.search(import_pattern, content)
                if match:
                    insert_pos = match.end()
                    content = content[:insert_pos] + "\nimport { useToast } from '@/hooks/useToast';\nimport { LoadingSpinner } from '@/components/ui/LoadingSpinner';\n" + content[insert_pos:]
            
            # Add const toast = useToast(); after component declaration
            # Look for export default function ComponentName()
            component_pattern = r"(export default function \w+\([^)]*\) \{)"
            match = re.search(component_pattern, content)
            if match:
                insert_pos = match.end()
                content = content[:insert_pos] + "\n    const toast = useToast();" + content[insert_pos:]
        
        # Replace alert calls
        # Success patterns
        content = re.sub(r"alert\('([^']*successfully[^']*)'\)", r"toast.success('\1')", content, flags=re.IGNORECASE)
        content = re.sub(r'alert\("([^"]*successfully[^"]*)"\)', r'toast.success("\1")', content, flags=re.IGNORECASE)
        content = re.sub(r"alert\('([^']*created[^']*)'\)", r"toast.success('\1')", content, flags=re.IGNORECASE)
        content = re.sub(r"alert\('([^']*updated[^']*)'\)", r"toast.success('\1')", content, flags=re.IGNORECASE)
        content = re.sub(r"alert\('([^']*saved[^']*)'\)", r"toast.success('\1')", content, flags=re.IGNORECASE)
        content = re.sub(r"alert\('([^']*deleted[^']*)'\)", r"toast.success('\1')", content, flags=re.IGNORECASE)
        
        # Error patterns
        content = re.sub(r"alert\(([^)]*error[^)]*)\)", r"toast.error(\1)", content, flags=re.IGNORECASE)
        content = re.sub(r"alert\(([^)]*[Ff]ailed[^)]*)\)", r"toast.error(\1)", content, flags=re.IGNORECASE)
        content = re.sub(r"alert\('([^']*[Ff]ailed[^']*)'\)", r"toast.error('\1')", content)
        content = re.sub(r'alert\("([^"]*[Ff]ailed[^"]*)"\)', r'toast.error("\1")', content)
        
        # Warning patterns
        content = re.sub(r"alert\('Please ([^']*)'\)", r"toast.warning('Please \1')", content)
        content = re.sub(r"alert\('Select ([^']*)'\)", r"toast.warning('Select \1')", content)
        
        # Generic remaining alerts -> info
        content = re.sub(r"alert\('([^']*)'\)", r"toast.info('\1')", content)
        content = re.sub(r'alert\("([^"]*)"\)', r'toast.info("\1")', content)
        
        # Only write if changed
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"  ✓ Updated")
        else:
            print(f"  - No changes needed")
            
    except Exception as e:
        print(f"  ✗ Error: {e}")

print(f"\n✓ Migration complete!")
print(f"Processed {len(files)} files")
