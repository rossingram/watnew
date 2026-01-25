#!/bin/bash

# Setup Git repository for Watnew

echo "Setting up Git repository..."

# Remove existing .git if it exists and is corrupted
if [ -d .git ]; then
    echo "Removing existing .git directory..."
    rm -rf .git
fi

# Initialize git repository
echo "Initializing git repository..."
git init

# Add all files
echo "Adding files to git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: Watnew - Financial Model Creator MVP with Stripe subscription integration"

echo ""
echo "✅ Git repository initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub (if you haven't already)"
echo "2. Run these commands to connect and push:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/watnew.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
