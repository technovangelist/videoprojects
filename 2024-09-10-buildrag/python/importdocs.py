import chromadb
from functions import readtextfiles, chunksplitter, getembedding




chromaclient = chromadb.HttpClient(host="localhost", port=8000)
textdocspath = "../../scripts"
text_data = readtextfiles(textdocspath)

collection = chromaclient.get_or_create_collection(name="buildragwithpython", metadata={"hnsw:space": "cosine"}  )
if any(collection.name == collectionname for collection in chromaclient.list_collections()):
  chromaclient.delete_collection("buildragwithpython")

for filename, text in text_data.items():
  chunks = chunksplitter(text)
  embeds = getembedding(chunks)
  chunknumber = list(range(len(chunks)))
  ids = [filename + str(index) for index in chunknumber]
  metadatas = [{"source": filename} for index in chunknumber]
  collection.add(ids=ids, documents=chunks, embeddings=embeds, metadatas=metadatas)

