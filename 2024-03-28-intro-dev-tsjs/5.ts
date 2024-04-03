import ollama from 'ollama';
import imgb64 from 'image-to-base64';

const img = await imgb64('./mh.jpg')
const output3 = await ollama.generate({model: "llava", prompt: "Describe this picture", images: [img]})
console.log(output3.response);