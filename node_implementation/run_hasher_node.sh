#!/bin/bash

# Simple wrapper script to run the Node.js PDF hasher
# This script should be run from the node_implementation directory

echo "🚀 Running PDF Hasher (Node.js version)..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory and run
cd "$SCRIPT_DIR"
node pdf_hasher_node.js
