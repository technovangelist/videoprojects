export const questions = [
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
export const models: Model[] = [
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
  // {
  //   name: "llama3.2", 
  //   model: "llama3.2",
  //   qprefix: "",
  //   dprefix: "",
  // }, 
  // {
  //   name: "llama3.1", 
  //   model: "llama3.1",
  //   qprefix: "",
  //   dprefix: "",
  // }, 
  // {
  //   name: "mistral", 
  //   model: "mistral",
  //   qprefix: "",
  //   dprefix: "",
  // }
];

export const scripts = [
  "videoscript.txt",
  "videoscript2.txt",
  "videoscript3.txt",
  "videoscript4.txt",
];
