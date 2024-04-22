# Build RAG with Python

[![Watch the video](https://img.youtube.com/vi/GxLoMquHynY/maxresdefault.jpg)](https://youtu.be/GxLoMquHynY)

1. Get started by installing the requirements: `pip install -r requirements.txt`
2. Make sure you have the models listed in config.ini. so for nomic-embed-text, run `ollama pull nomic-embed-text`. Update the config to show whatever models you want to use.
3. Then run ChromaDB in a separate terminal: `chroma run --host localhost --port 8000 --path ../vectordb-stores/chromadb`
4. Edit the list of docs in `sourcedocs.txt`
5. Import the docs: `python3 import.py`
6. Perform a search: `python3 search.py <yoursearch>`


Some folks on Windows seem to have issues with installing this. I guess the install package names are different there. Try `pip install python-magic-bin` to get the magic stuff working.