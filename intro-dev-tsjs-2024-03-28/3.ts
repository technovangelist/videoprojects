import ollama from 'ollama';

const prompt = "why is the sky blue";

const output = await ollama.generate({ model: "llama2", prompt: prompt, stream: true })

console.log(output)

// for await (const part of output) {
  // console.log(part)
//   process.stdout.write(part.response)
//   if (part.done === true) {
//     console.log(`\nstats: ${(part.eval_count / (part.eval_duration / 1000000000)).toFixed(2)} tokens per second`)  }
// }
