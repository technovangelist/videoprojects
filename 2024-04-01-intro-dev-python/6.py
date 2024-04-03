import ollama 

msgs = [
  {"role": "system", "content": "The user will give you a concept. Explain it to a 5 year old, using descriptive imagery and interesting and fun stories."},
  { "role": "user", "content": "Quantum Physics" }
]
output = ollama.chat(model="llama2", messages=msgs )

print(output['message']['content'])