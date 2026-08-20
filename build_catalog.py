# -*- coding: utf-8 -*-
"""
Rebuild ElyaShop static data from catalog.json / catalog_ru.json.

Usage:
    python build_catalog.py catalog_ru.json
"""
import json, math, sys
from pathlib import Path

CHUNK_SIZE=100
src=Path(sys.argv[1] if len(sys.argv)>1 else "catalog_ru.json")
if not src.exists():
    raise SystemExit(f"File not found: {src}")

root=Path(__file__).resolve().parent
data_dir=root/"data"
chunks=data_dir/"chunks"
chunks.mkdir(parents=True,exist_ok=True)

# clear old chunks
for p in chunks.glob("*.json"):
    p.unlink()

catalog=json.loads(src.read_text(encoding="utf-8"))
index=[]

for chunk_no in range(math.ceil(len(catalog)/CHUNK_SIZE)):
    chunk=catalog[chunk_no*CHUNK_SIZE:(chunk_no+1)*CHUNK_SIZE]
    (chunks/f"{chunk_no:04d}.json").write_text(
        json.dumps(chunk,ensure_ascii=False,separators=(",",":")),
        encoding="utf-8"
    )
    for offset,item in enumerate(chunk):
        imgs=item.get("images") or []
        index.append({
            "id":item.get("goods_id",""),
            "title":item.get("title",""),
            "price":item.get("price",""),
            "sizes":item.get("sizes",""),
            "image_count":item.get("image_count",len(imgs)),
            "first_image":imgs[0] if imgs else "",
            "chunk":chunk_no,
            "offset":offset,
        })

(data_dir/"index.json").write_text(
    json.dumps(index,ensure_ascii=False,separators=(",",":")),
    encoding="utf-8"
)
print(f"Built {len(catalog)} products into {math.ceil(len(catalog)/CHUNK_SIZE)} chunks.")
