import ollama

prompt = "why is the sky blue";

output = ollama.generate(model="llama2", prompt=prompt, stream=True)

# print(output)

for chunk in output:
    print(chunk["response"], end='', flush=True)
    if chunk["done"] == True:
        tokens_per_second = chunk["eval_count"] / (chunk["eval_duration"] / 1000000000)
        print("\nstats: {:.2f} tokens per second".format(tokens_per_second))

