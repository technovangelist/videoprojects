import ollama, json, sys
from sklearn.metrics.pairwise import cosine_similarity


if __name__ == "__main__":
  with open('embeddedSubtitles.json', 'r') as f:
      embedded_subtitles = json.load(f)

  question=' '.join(sys.argv[1:])

  embedded_prompt = ollama.embeddings(model='nomic-embed-text', prompt=question)['embedding']

  similarities=[]
  
  for e in embedded_subtitles:
    cosineSimilarity = cosine_similarity([embedded_prompt], [e['embed']])[0][0]
    similarities.append({"subtitle": e, "similarity": cosineSimilarity})

  output = sorted(similarities, key=lambda x: x["similarity"], reverse=True)[:50]

  counts = {}  
  for o in output:
    videoID = o["subtitle"]["videoID"]
    counts[videoID] = counts.get(videoID, 0) + 1
    
  for videoID, count in counts.items():
    first = next((o for o in output if o["subtitle"]["videoID"] == videoID), None)
    if first:
      print("\n", first["similarity"])
      print(count, "matches")
      print(first["subtitle"]["videoTitle"])
      print("https://YouTube.com/watch?v=" + videoID)