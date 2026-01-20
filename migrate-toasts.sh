#!/bin/bash

# Bulk migration script to replace alert() with toast notifications
# This script adds imports and replaces alert calls

FILES=$(grep -rl "alert(" /Users/arun/Documents/applizor-softech-erp/frontend/app --include="*.tsx")

for file in $FILES; do
    echo "Processing: $file"
    
    # Check if file already has useToast import
    if ! grep -q "useToast" "$file"; then
        # Add imports after 'use client' or at the top
        if grep -q "'use client'" "$file"; then
            sed -i '' "/^'use client';$/a\\
import { useToast } from '@/hooks/useToast';\\
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
" "$file"
        else
            sed -i '' "1i\\
import { useToast } from '@/hooks/useToast';\\
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';\\

" "$file"
        fi
        
        # Add const toast = useToast(); after component declaration
        sed -i '' "s/export default function \(.*\)() {/export default function \1() {\\
    const toast = useToast();/g" "$file"
    fi
    
    # Replace alert calls with toast
    sed -i '' "s/alert('\([^']*\)')/toast.success('\1')/g" "$file"
    sed -i '' 's/alert("\([^"]*\)")/toast.success("\1")/g' "$file"
    sed -i '' "s/alert(\([^)]*error[^)]*\))/toast.error(\1)/g" "$file"
    sed -i '' "s/alert(\([^)]*Failed[^)]*\))/toast.error(\1)/g" "$file"
    sed -i '' "s/alert(\([^)]*failed[^)]*\))/toast.error(\1)/g" "$file"
done

echo "Migration complete!"
