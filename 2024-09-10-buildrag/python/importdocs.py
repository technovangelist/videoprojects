import chromadb
from functions import readtextfiles, chunksplitter, getembedding




chromaclient = chromadb.HttpClient(host="localhost", port=8000)
textdocspath = "../../scripts"
text_data = readtextfiles(textdocspath)

collectionname = "buildragwithpython"
# remove existing collection of the name to re-import every time
if any(collection.name == collectionname for collection in chromaclient.list_collections()):
  chromaclient.delete_collection(collectionname)
collection = chromaclient.get_or_create_collection(name=collectionname, metadata={"hnsw:space": "cosine"}  )

for filename, text in text_data.items():
  chunks = chunksplitter(text)
  embeds = getembedding(chunks)
  chunknumber = list(range(len(chunks)))
  ids = [filename + str(index) for index in chunknumber]
  metadatas = [{"source": filename} for index in chunknumber]
  collection.add(ids=ids, documents=chunks, embeddings=embeds, metadatas=metadatas)

