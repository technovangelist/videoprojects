import Ollama from "npm:ollama";
import { ChromaClient } from "npm:chromadb";
import { models, questions } from "./config.ts";

const client = new ChromaClient({ path: "http://localhost:8000" });

for await (const q of questions) {
  console.log(`\n\n\n\n\n\n\n\n\n\n\nxxxxxxxxxxxxxxxxxx\n${q}`);
  for await (const model of models) {
    const collection = await client.getOrCreateCollection({
      name: `${model.name}-without-questions`,
    });
    const embedresponse = await Ollama.embed({
      model: model.model,
      input: `${model.qprefix}${q}`,
    });
    const embedquestion = embedresponse.embeddings[0];
    const topinput = await collection.query({
      queryEmbeddings: embedquestion,
      nResults: 10,
    });
    const topinputdocs = topinput.documents[0].join("\n");

    const result = await Ollama.generate({
      model: "granite3-dense:8b",
      prompt:
        `DOCUMENT:\n${topinputdocs}\n\nQUESTION:\n${q}\n\nINSTRUCTIONS:\Answer the users QUESTION using the DOCUMENT text above. Keep your answer ground in the facts of the DOCUMENT. If the DOCUMENT doesn't contain the facts to answer the QUESTION return {NONE}. Your response should only include the answer. Do not provide any further explanation.`,
      stream: false,
    });

    let acceptedanswer = "\n\nNO ANSWER\n\n";

    if (!result.response.includes("{NONE}") && result.response.length > 5) {
      acceptedanswer =
        `Answer:\n\n${result.response}\n\nDocuments:\n\n${topinputdocs}`;
    }
    console.log(
      `\n\n\n\n\n\nModel:\n${model.name}\nQuestion:\n${q}\n${acceptedanswer}\n\n\n\n\n\n`,
    );
  }
}
