#!/bin/bash
# Convenient wrapper to run PDF hasher with virtual environment

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment not found"
    echo "Run: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
    exit 1
fi

echo "Using virtual environment Python..."
.venv/bin/python pdf_hasher_content_only.py "$@"
