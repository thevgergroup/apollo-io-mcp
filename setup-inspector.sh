#!/bin/bash

echo "Setting up MCP Inspector for Apollo.io MCP Server"
echo ""

# Check if .env exists and has API key
if [ -f .env ]; then
    source .env
    if [ -n "$APOLLO_API_KEY" ] && [ "$APOLLO_API_KEY" != "put-your-key-here" ]; then
        echo "Found API key in .env file"
        
        # Update the inspector config with the actual API key
        sed -i.bak "s/your-api-key-here/$APOLLO_API_KEY/g" mcp-inspector.json
        rm mcp-inspector.json.bak 2>/dev/null || true
        
        echo "Updated mcp-inspector.json with your API key"
        echo ""
        echo "You can now run the MCP Inspector:"
        echo "   npm run inspector"
        echo ""
        echo "Or use CLI mode:"
        echo "   npm run inspector:cli"
        echo ""
        echo "The inspector will open at: http://localhost:6274"
        echo ""
        echo "Available commands:"
        echo "   - List tools: npm run inspector:cli -- --method tools/list"
        echo "   - Test company search: npm run inspector:cli -- --method tools/call --tool-name apollo_search_companies --tool-arg query='education technology' --tool-arg per_page=5"
        echo ""
    else
        echo "Please set your APOLLO_API_KEY in the .env file first"
        echo "   Edit .env and replace 'put-your-key-here' with your actual API key"
        exit 1
    fi
else
    echo ".env file not found"
    echo "   Please create .env file with your Apollo.io API key:"
    echo "   cp env.example .env"
    echo "   Then edit .env and add your actual API key"
    exit 1
fi

