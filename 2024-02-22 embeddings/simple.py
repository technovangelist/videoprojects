import ollama

out = ollama.embeddings(model="nomic-embed-text", prompt="hi hi")

print(out)