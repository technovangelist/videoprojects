# Build RAG with Python

[![Watch the video](https://img.youtube.com/vi/GxLoMquHynY/maxresdefault.jpg)](https://youtu.be/GxLoMquHynY)

1. Get started by installing the requirements: `pip install -f requirements.txt`
2. Then run ChromaDB in a separate terminal: `chroma run --host localhost --port 8000 --path ../vectordb-stores/chromadb`
3. Edit the list of docs in `sourcedocs.txt`
4. Import the docs: `python3 import.py`
5. Perform a search: `python3 search.py <yoursearch>`