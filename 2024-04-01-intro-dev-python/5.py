import ollama

with open('mh.jpg', 'rb') as image_file:
  img = image_file.read()
  

output3 = ollama.generate(model="llava", prompt="Describe this picture", images= [img])
print(output3['response']);