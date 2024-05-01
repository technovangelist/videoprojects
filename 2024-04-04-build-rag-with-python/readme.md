# Build RAG with Python

[![Watch the video](https://img.youtube.com/vi/GxLoMquHynY/maxresdefault.jpg)](https://youtu.be/GxLoMquHynY)

1. Install the magic tools:
  - **Debian/Ubuntu**`: `sudo apt-get install libmagic1` 
  - **Windows**: You'll need DLLs for libmagic. @julian-r maintains a pypi package with the DLLs, you can fetch it with: `pip install python-magic-bin`
  - **Mac**: `brew install libmagic`
2. Get started by installing the requirements: `pip install -r requirements.txt`
3. Make sure you have the models listed in config.ini. so for nomic-embed-text, run `ollama pull nomic-embed-text`. Update the config to show whatever models you want to use.
4. Then run ChromaDB in a separate terminal: `chroma run --host localhost --port 8000 --path ../vectordb-stores/chromadb`
5. Edit the list of docs in `sourcedocs.txt`
6. Import the docs: `python3 import.py`
7. Perform a search: `python3 search.py <yoursearch>`

