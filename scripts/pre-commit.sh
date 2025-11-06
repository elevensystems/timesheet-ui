#!/bin/sh
# Pre-commit hook for Prettier and ESLint

echo "🔍 Running code quality checks..."

# Run Prettier check
echo "📝 Checking code formatting..."
npm run format:check
if [ $? -ne 0 ]; then
    echo "❌ Code formatting issues found. Run 'npm run format' to fix them."
    exit 1
fi

# Run ESLint
echo "🔧 Running ESLint..."
npm run lint:fix
if [ $? -ne 0 ]; then
    echo "❌ ESLint issues found. Please fix them before committing."
    exit 1
fi

# Run TypeScript type check
echo "🔍 Checking TypeScript types..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript type errors found. Please fix them before committing."
    exit 1
fi

echo "✅ All checks passed!"
