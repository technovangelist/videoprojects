import ollama from 'ollama';

const prompt = "why is the sky blue";

const output = await ollama.generate({ model: "llama2", prompt: prompt })

console.log(output)
