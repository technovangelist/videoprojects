#!/bin/bash

# Concatenate all arguments to form the prompt text
prompt="$*"

# Use the prompt in the curl command, parse the embedding to be on one line with jq, then save to a file
curl -s http://localhost:11434/api/embeddings -d "{\"model\": \"nomic-embed-text\", \"prompt\": \"$prompt\"}" | jq -c '.embedding' > embedding.txt

# Output a custom message
echo "Embedding saved to embedding.txt."
