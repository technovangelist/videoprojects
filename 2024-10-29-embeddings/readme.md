This is the code for the Ollama Course video on Embeddings, released on 2024-10-31.

The code uses Deno, so make sure that is installed. You can find out more about that at https://deno.land/

The one thing you need to install is ChromaDB. You can install it with `pip install chromadb`. Then in this directory, run `chroma run --path ./db`.

If you want to use your own documents, change scripts at the bottom of config.ts.

Then run `deno --allow-read --allow-net vectorprep.ts` to create the embeddings.

- Test1: `deno --allow-read --allow-net test1.ts`
- Test2: `deno --allow-read --allow-net test2.ts`
- Test3: `deno --allow-read --allow-net test3.ts`
- Test4: `deno --allow-read --allow-net test4.ts`