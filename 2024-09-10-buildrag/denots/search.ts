import { ChromaClient } from "chromadb";
import ollama from "ollama"

const chroma = new ChromaClient({ path: "http://localhost:8000" });
const collection = await chroma.getCollection({ name: "buildragwithts"});

const query = Deno.args.join(" ");
const queryembed = (await ollama.embed({ model: "nomic-embed-text", input: query })).embeddings[0];

const relateddocs = await collection.query({ queryEmbeddings: [queryembed], nResults: 10 });

const prompt = `${query} - Answer that question using the following text as a resource: ${relateddocs.documents[0].join("\n\n")}`;
const noRagOutput = await ollama.generate({ model: "dolphin-mistral", prompt: query, stream: false });
console.log(`Answered without RAG:\n${noRagOutput.response}\n---\n`);
const ragOutput = await ollama.generate({ model: "dolphin-mistral", prompt: prompt, stream: false });
console.log(`Answered with RAG:\n${ragOutput.response}\n---\n`);
