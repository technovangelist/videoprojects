import ollama

def read_file(file_path):
    with open(file_path, 'r') as file:
        return file.read()


def split_into_chunks(text, chunk_size):
    words = text.split()
    chunks = []
    current_chunk = []

    for word in words:
        current_chunk.append(word)
        if len(current_chunk) >= chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk = []

    if current_chunk:  
        chunks.append(' '.join(current_chunk))

    return chunks

file_path = '/Users/matt/Downloads/warandpeace.txt'  #
long_string = read_file(file_path)
chunk_size = 500
chunks = split_into_chunks(long_string, chunk_size)

for i, chunk in enumerate(chunks, start=1):
    response = ollama.embeddings(model='nomic-embed-text', prompt=chunk)
    print(i)
    