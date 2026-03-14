import json

CONSOLIDADO_PATH = "src/data/consolidado.json"

with open(CONSOLIDADO_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

total_original = len(data)

# Mantém apenas itens que tenham name ou description não vazios
limpo = [
    item for item in data
    if (item.get("name") and item["name"].strip()) or
       (item.get("description") and item["description"].strip())
]

removidos_sem_info = [
    item for item in data
    if not ((item.get("name") and item["name"].strip()) or
            (item.get("description") and item["description"].strip()))
]

# Remove duplicados por (name, description), mantendo se tiver imagem
vistos = {}  # chave (name, description) -> True se já vimos um sem imagem
final = []
removidos_duplicados = []

for item in limpo:
    name = (item.get("name") or "").strip()
    desc = (item.get("description") or "").strip()
    chave = (name, desc)
    tem_imagem = bool(item.get("imageUrl") or item.get("image_key"))

    if tem_imagem:
        # Itens com imagem são sempre mantidos
        final.append(item)
    else:
        if chave not in vistos:
            # Primeiro sem imagem com essa chave, mantém
            vistos[chave] = True
            final.append(item)
        else:
            # Duplicado sem imagem, remove
            removidos_duplicados.append(item)

removidos_lista = removidos_sem_info + removidos_duplicados

print(f"Total original: {total_original}")
print(f"Removidos sem name/description: {len(removidos_sem_info)}")
print(f"Removidos duplicados: {len(removidos_duplicados)}")
print(f"Mantidos: {len(final)}")
print(f"Total removidos: {len(removidos_lista)}")

with open(CONSOLIDADO_PATH, "w", encoding="utf-8") as f:
    json.dump(final, f, ensure_ascii=False, indent=2)

with open("src/data/scripts/removidos_2.json", "w", encoding="utf-8") as f:
    json.dump(removidos_lista, f, ensure_ascii=False, indent=2)

print(f"✅ consolidado.json atualizado!")
print(f"✅ removidos.json salvo com {len(removidos_lista)} itens")
