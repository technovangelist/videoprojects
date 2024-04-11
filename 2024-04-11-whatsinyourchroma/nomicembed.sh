#!/bin/bash
prompt="$*"
curl -s http://localhost:11434/api/embeddings -d "{\"model\": \"nomic-embed-text\", \"prompt\": \"$prompt\"}" | jq -c '.embedding' | pbcopy

echo "embedding added to clipboard"