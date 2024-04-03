import ollama

prompt = "why is the sky blue";

output = ollama.generate(model="llama2", prompt=prompt)

print(output)
