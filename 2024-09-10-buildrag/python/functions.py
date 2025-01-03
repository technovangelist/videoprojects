import os
import re
import ollama
import chromadb

def readtextfiles(path):
  text_contents = {}
  directory = os.path.join(path)

  for filename in os.listdir(directory):
    if filename.endswith(".txt"):
      file_path = os.path.join(directory, filename)

      with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

      text_contents[filename] = content

  return text_contents

def chunksplitter(text, chunk_size=100):
  words = re.findall(r'\S+', text)

  chunks = []
  current_chunk = []
  word_count = 0

  for word in words:
    current_chunk.append(word)
    word_count += 1

    if word_count >= chunk_size:
      chunks.append(' '.join(current_chunk))
      current_chunk = []
      word_count = 0

  if current_chunk:
    chunks.append(' '.join(current_chunk))

  return chunks

def getembedding(chunks):
  embeds = ollama.embed(model="nomic-embed-text", input=chunks)
  return embeds.get('embeddings', [])


def get_collection_names(chroma_client: chromadb.Client) -> list[str]:
  collections = chroma_client.list_collections()
  if collections is None or len(collections) == 0:
    return []
  if hasattr(collections[0], 'name'):
    return [collection.name for collection in collections]
  else:
    return [collection for collection in collections]