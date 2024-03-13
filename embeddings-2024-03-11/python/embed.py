import re, glob, ollama, json, os
from typing import List
import xml.etree.ElementTree as ET

def time_to_seconds(time):
  hours, minutes, seconds = [int(x) for x in time.split(":")]
  total_seconds = hours * 3600 + minutes * 60 + seconds
  return total_seconds


def chunk_subtitles(subs, chunk_size, chunk_overlap):
    max_subs = len(subs) - 1
    i = 0
    chunked_subs = []

    while i < (max_subs - chunk_size):
        index = i
        start = subs[index]['start']
        text = ' '.join([sub['text'] for sub in subs[i:i+chunk_size]])

        chunked_subs.append({
            "start": start,
            "text": text,
            "embed": [],
            "videoID": subs[index]["videoID"],
            "videoTitle": subs[index]["videoTitle"]
        })

        i = i + chunk_size - chunk_overlap

    return chunked_subs

def get_title_and_id(filename):
    title = ""
    id = ""
    file = os.path.splitext(os.path.basename(filename))[0]
    regex = r"(.*?)\s+\[(.*?)\]\..*?"
    matches = re.match(regex, file)

    if matches and len(matches.groups()) >= 2:
        title = matches.group(1)
        id = matches.group(2)

    return {'title': title, 'id': id}

def parse_xml(xmlstring, id, title):
    tree = ET.fromstring(xmlstring)
    elements = tree.findall('.//{http://www.w3.org/ns/ttml}p')
    subtitles = []
    for p in elements:
        text = p.text.strip()
        start = p.attrib['begin']
        subtitles.append({"start": start, "text": text, "embed": [], "videoID": id, "videoTitle": title})
    
    return subtitles

if __name__ == "__main__":
    files = glob.glob("../captions/*.ttml")
    all_subtitles = []

    for file in files:
        title, id = get_title_and_id(file).values()
        with open(file, "r") as f:
          xml_subtitles_text = f.read().replace("<br />", "")
          subtitles = parse_xml(xml_subtitles_text, id, title)
          chunked_subtitles = chunk_subtitles(subtitles, 10, 5)

          for chunk in chunked_subtitles:
              embedding = ollama.embeddings(model='nomic-embed-text', prompt = chunk["text"] )['embedding']
              chunk['embed'] = embedding

          all_subtitles += [chunk]

          
          with open('embeddedSubtitles.json','w') as f:
              f.write(json.dumps(all_subtitles, indent=2))              