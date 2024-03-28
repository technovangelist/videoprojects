import ollama from 'ollama';

const prompt = "why is the sky blue";

const output = await ollama.generate({ model: "llama2", prompt: "why is the sky blue?", stream: true })
const context: number[] = [];

for await (const part of output) {
  if (part.done === true) {
    console.log(`first generate complete`);
    context.push(...part.context);
  }
}

const output2 = await ollama.generate({ model: "llama2", prompt: "can it be another?", context: context });
console.log(`output with context\n\n${output2.response}\n\noutput complete\n`);


const output3 = await ollama.generate({ model: "llama2", prompt: "can it be another?" });
console.log(`output without context\n\n${output3.response}\n\noutput complete`);
