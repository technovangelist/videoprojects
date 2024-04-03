import ollama 

prompt = "why is the sky blue";

output = ollama.generate(model="llama2", prompt=prompt, stream=True)

for chunk in output:
  if chunk["done"] == True:
    print("First Generate Complete")
    context = chunk["context"]  
    
output2 = ollama.generate(model="llama2", prompt="can it be another?", context=context);
# print(f"output with context\n\n{output2['response']}\n\noutput complete\n");


# output3 = ollama.generate(model="llama2", prompt="can it be another?");
# print(f"output without context\n\n{output3['response']}\n\noutput complete");
