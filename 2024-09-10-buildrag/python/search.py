import sys, chromadb, ollama

chromaclient = chromadb.HttpClient(host="localhost", port=8000)
collection = chromaclient.get_or_create_collection(name="buildragwithpython")

query = " ".join(sys.argv[1:])
queryembed = ollama.embed(model="nomic-embed-text", input=query)['embeddings']

relateddocs = '\n\n'.join(collection.query(query_embeddings=queryembed, n_results=10)['documents'][0])
prompt = f"{query} - Answer that question using the following text as a resource: {relateddocs}"
noragoutput = ollama.generate(model="mistral", prompt=query, stream=False)
print(f"Answered without RAG: {noragoutput['response']}")
print("---")
ragoutput = ollama.generate(model="llama3.1", prompt=prompt, stream=False)

print(f"Answered with RAG: {ragoutput['response']}")