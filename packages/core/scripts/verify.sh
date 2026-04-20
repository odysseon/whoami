#!/usr/bin/env bash
set -e

echo "=== WHOMI v12 VERIFICATION SUITE ==="
echo ""

echo "1. TypeScript compilation..."
npx tsc --noEmit
echo "   PASS: TypeScript compiles without errors"
echo ""

echo "2. Zero runtime dependencies..."
DEP_COUNT=$(jq '.dependencies // {} | length' package.json)
if [ "$DEP_COUNT" -eq 0 ]; then
  echo "   PASS: No runtime dependencies"
else
  echo "   FAIL: Found $DEP_COUNT runtime dependencies"
  exit 1
fi
echo ""

echo "3. No forbidden types..."
if grep -r ": any" src/ 2>/dev/null; then
  echo "   FAIL: Found 'any' type"
  exit 1
fi
if grep -r "as " src/ | grep -v "satisfies" | grep -v "asserts" 2>/dev/null; then
  echo "   FAIL: Found unsafe 'as' assertion"
  exit 1
fi
if grep -r "!" src/ | grep -v "//" | grep -v "!==" | grep -v "===" | grep -v "!=" | grep -v "export" | grep -v "import" 2>/dev/null; then
  echo "   FAIL: Found non-null assertions"
  exit 1
fi
echo "   PASS: No forbidden types found"
echo ""

echo "4. No external imports in kernel..."
EXTERNAL_IMPORTS=$(grep -r "from '[a-z-]" src/kernel/ | grep -v "from '\." | grep -v "crypto\|util\|stream\|node:" | wc -l)
if [ "$EXTERNAL_IMPORTS" -eq 0 ]; then
  echo "   PASS: Kernel has no external imports"
else
  echo "   FAIL: Kernel has external imports"
  exit 1
fi
echo ""

echo "5. Module independence (no cross-module imports)..."
for module in password oauth magiclink; do
  for other in password oauth magiclink; do
    if [ "$module" != "$other" ]; then
      if grep -r "from.*modules/$other" "src/modules/$module/" 2>/dev/null; then
        echo "   FAIL: $module imports from $other"
        exit 1
      fi
    fi
  done
done
echo "   PASS: All modules are independent"
echo ""

echo "6. No orphaned recovery module..."
if [ -d "src/modules/recovery" ]; then
  echo "   FAIL: Orphaned recovery module exists"
  exit 1
fi
echo "   PASS: No orphaned recovery module"
echo ""

echo "7. Recovery methods in password module..."
if grep -q "requestPasswordReset" src/modules/password/password.module.ts; then
  echo "   PASS: requestPasswordReset found in password module"
else
  echo "   FAIL: requestPasswordReset not found in password module"
  exit 1
fi
if grep -q "verifyPasswordReset" src/modules/password/password.module.ts; then
  echo "   PASS: verifyPasswordReset found in password module"
else
  echo "   FAIL: verifyPasswordReset not found in password module"
  exit 1
fi
echo ""

echo "8. MagicLink module exists (extensibility proof)..."
if [ -d "src/modules/magiclink" ]; then
  echo "   PASS: MagicLink module exists"
else
  echo "   FAIL: MagicLink module not found"
  exit 1
fi
echo ""

echo "9. Kernel immutability check..."
# Check that kernel doesn't reference specific auth methods
if grep -r "'password'\|'oauth'\|'magiclink'" src/kernel/ 2>/dev/null | grep -v "kind: string"; then
  echo "   FAIL: Kernel references specific auth methods"
  exit 1
fi
echo "   PASS: Kernel is generic and extensible"
echo ""

echo "10. Build verification..."
npm run build > /dev/null 2>&1
if [ -f "dist/esm/index.js" ] && [ -f "dist/cjs/index.js" ] && [ -f "dist/types/index.d.ts" ]; then
  echo "   PASS: Build outputs exist (ESM, CJS, types)"
else
  echo "   FAIL: Build outputs missing"
  exit 1
fi
echo ""

echo "11. Sub-path exports..."
for export in password oauth magiclink kernel; do
  if [ -f "dist/esm/modules/$export/index.js" ] || [ -f "dist/esm/$export/index.js" ]; then
    echo "   PASS: $export sub-path export exists"
  else
    echo "   FAIL: $export sub-path export missing"
    exit 1
  fi
done
echo ""

echo "=== ALL VERIFICATION CHECKS PASSED ==="
echo ""
echo "whoami v12 is ready for publication!"
