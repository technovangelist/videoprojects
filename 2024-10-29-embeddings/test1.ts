import Ollama from "npm:ollama";
import { ChromaClient } from "npm:chromadb";
import { questions, models, scripts } from "./config.ts";

const client = new ChromaClient({ path: "http://localhost:8000" });

for await (const q of questions) {
  console.log(`\n\n\n\n\n\n\n\n\n\n\nxxxxxxxxxxxxxxxxxx\n${q}`);
  for await (const model of models) {
    const collection = await client.getOrCreateCollection({ name: `${model.name}-with-questions` });
    const embedresponse = await Ollama.embed({
      model: model.model,
      input: `${model.qprefix}${q}`,
    });
    const embedquestion = embedresponse.embeddings[0];
    const topinput = await collection.query({
      queryEmbeddings: embedquestion,
      nResults: 2,
    });
    const topinputdocs = topinput.documents[0].filter((d) => !(d?.includes(q)))
      .join("\n");

    console.log(`\n\n\n\n\n\nModel:\n${model.name}\nQuestion:\n${q}\n\nInput:\n${topinputdocs}\n\n\n\n\n\n\n\n`)
  }
}
