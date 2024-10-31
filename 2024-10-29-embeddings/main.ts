import Ollama from "npm:ollama";
import { ChromaClient } from "npm:chromadb";

const goal: "topdoc"|"answer" = "answer" 

const questions = [
  "What is n8n?",
  "How do I install n8n with docker compose?",
  "How do I run n8n on my Mac?",
  "what is the downside of using n8n with docker compose on the mac?",
  "which install method is better on the mac if I want to use the GPU?",
  "What is companion?",
  "What does GIK make?",
  "What images are on the wall?",
  "What does Oktava make?",
  "What is the blobs directory for?",
  "What is the manifests folder for?",
  "how do I trigger a workflow from a webhook?",
  "What is a registry?",
];
type Model = {
  name: string;
  model: string;
  qprefix: string;
  dprefix: string;
};
const models: Model[] = [
  {
    name: "nomic",
    model: "nomic-embed-text",
    qprefix: "",
    dprefix: "",
  },
  {
    name: "prefixed-nomic",
    model: "nomic-embed-text",
    qprefix: "search_query: ",
    dprefix: "search_document: ",
  },
  {
    name: "mxbai",
    model: "mxbai-embed-large",
    qprefix: "",
    dprefix: "",
  },
  {
    name: "prefixed-mxbai",
    model: "mxbai-embed-large",
    qprefix: "Represent this sentence for searching relevant passages: ",
    dprefix: "",
  },
  {
    name: "all-minilm",
    model: "all-minilm",
    qprefix: "",
    dprefix: "",
  },
  {
    name: "snowflake-arctic",
    model: "snowflake-arctic-embed",
    qprefix: "",
    dprefix: "",
  },
  {
    name: "prefixed-snowflake-arctic",
    model: "snowflake-arctic-embed",
    qprefix: "Represent this sentence for searching relevant passages: ",
    dprefix: "",
  },
  {
    name: "bge",
    model: "bge-large",
    qprefix: "",
    dprefix: "",
  },
];
const client = new ChromaClient({ path: "http://localhost:8000" });

const scripts = [
  "videoscript.txt",
  "videoscript2.txt",
  "videoscript3.txt",
  "videoscript4.txt",
];

const sourceScriptLines: string[] = [];
for (const script of scripts) {
  const sourceScript = Deno.readTextFileSync(script);
  sourceScriptLines.push(
    ...(sourceScript.split("\n").filter((line) => line.trim().length > 0)),
  );
}

sourceScriptLines.push(...questions);

for await (const model of models) {
  try {
    await client.deleteCollection({ name: model.name });
  } catch (_error) {
    console.log(`Collection ${model.name} did not exist`);
  }
  const collection = await client.getOrCreateCollection({
    name: model.name,
    metadata: { "hnsw:space": "cosine" },
  });

  const embeddings: { source: string; embed: number[] }[] = [];
  for await (const line of sourceScriptLines) {
    const embedresponse = await Ollama.embed({
      model: model.model,
      input: `${model.dprefix}${line}`,
    });
    embeddings.push({ source: line, embed: embedresponse.embeddings[0] });
  }
  const embeds = embeddings.map((e) => e.embed);
  const docs = embeddings.map((e) => e.source);
  const ids = docs.map((_, index) => `${model.name}-${index}`);
  await collection.add({ ids: ids, embeddings: embeds, documents: docs });
}

for await (const q of questions) {
  console.log(`\n\n\n\n\n\n\n\n\n\n\nxxxxxxxxxxxxxxxxxx\n${q}`);
  for await (const model of models) {
    const collection = await client.getOrCreateCollection({ name: model.name });
    const embedresponse = await Ollama.embed({
      model: model.model,
      input: `${model.qprefix}${q}`,
    });
    const embedquestion = embedresponse.embeddings[0];
    const topinput = await collection.query({
      queryEmbeddings: embedquestion,
      nResults: 5,
    });
    const topinputdocs = topinput.documents[0].filter((d) => !(d?.includes(q)))
      .join("\n");

    const result = await Ollama.generate({
      model: "x/llama3.2-vision",
      prompt:
        `${q} Answer as brief and concisely as possible. Use only the following information to generate an answer: ${topinputdocs}`,
      stream: false,
    });

    console.log(
      `\n\n\n\n\n\nModel:\n${model.name}\nQuestion:\n${q}\n\Answer:\n${result.response}\n\n\n\n\n\n\n\n`,
    );
    // console.log(`\n\n\n\n\n\nModel:\n${model.name}\nQuestion:\n${q}\n\nInput:\n${topinputdocs}\n\n\n\n\n\n\n\n`)
  }
}
