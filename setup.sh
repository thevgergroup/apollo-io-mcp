#!/bin/bash

# Setup script for Apollo.io MCP Server

echo "Setting up Apollo.io MCP Server..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file manually:"
    echo "  cp env.example .env"
    echo "Then edit .env and add your Apollo.io API key"
    echo ""
    echo "Continuing with setup..."
else
    echo "✅ .env file found"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

echo "Setup complete!"
echo ""
echo "To run the server:"
echo "  npm run dev    # Development mode with hot reload"
echo "  npm start      # Production mode"
echo ""
echo "To run tests:"
echo "  npm test       # Run tests"
echo "  npm run test:coverage  # Run tests with coverage"
