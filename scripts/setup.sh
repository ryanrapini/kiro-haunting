#!/bin/bash

# Haunted Home Orchestrator Setup Script
# This script helps with initial project setup

set -e

echo "🎃 Haunted Home Orchestrator Setup 🎃"
echo "======================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    
    # Source the shell config to get bun in PATH
    if [ -f "$HOME/.bashrc" ]; then
        source "$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then
        source "$HOME/.zshrc"
    fi
    
    # Check again
    if ! command -v bun &> /dev/null; then
        echo "⚠️  Bun installed but not in PATH. Please restart your terminal and run this script again."
        exit 1
    fi
fi
echo "✅ Bun $(bun -v)"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI is not installed. You'll need it for deployment."
    echo "   Install from: https://aws.amazon.com/cli/"
else
    echo "✅ AWS CLI $(aws --version | cut -d' ' -f1)"
fi

echo ""
echo "Installing dependencies..."
echo ""

# Install infrastructure dependencies
echo "📦 Installing infrastructure dependencies..."
cd infrastructure
bun install
cd ..
echo "✅ Infrastructure dependencies installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
bun install
cd ..
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
bun install
cd ..
echo "✅ Frontend dependencies installed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure AWS CLI: aws configure"
echo "2. Review infrastructure/README.md for AWS setup"
echo "3. Deploy infrastructure: cd infrastructure && bun run cdk deploy"
echo "4. Start frontend dev server: cd frontend && bun run dev"
echo ""
echo "For detailed deployment instructions, see infrastructure/DEPLOYMENT.md"
