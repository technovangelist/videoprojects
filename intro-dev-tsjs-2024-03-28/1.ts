import ollama from 'ollama';

const output = await ollama.generate({ model: "llama2", prompt: "" })

console.log(output)
 