import json

PORTAS_PATH = "src/data/scripts/portas_novo.json"
CONSOLIDADO_PATH = "src/data/scripts/consolidado.json"

# Carrega os dados dos dois arquivos
with open(PORTAS_PATH, "r", encoding="utf-8") as f:
    portas = json.load(f)

with open(CONSOLIDADO_PATH, "r", encoding="utf-8") as f:
    consolidado = json.load(f)

# Cria um set com tuplas (lat, long, name) já existentes no consolidado
existentes = {
    (item.get("lat"), item.get("long"), item.get("name"))
    for item in consolidado
}

# Filtra apenas os itens novos (que não estão no consolidado por lat+long+name)
novos = [
    item for item in portas
    if (item.get("lat"), item.get("long"), item.get("name")) not in existentes
]

print(f"Total de itens em portas_novo.json: {len(portas)}")
print(f"Total de itens em consolidado.json: {len(consolidado)}")
print(f"Itens novos a adicionar: {len(novos)}")

# Adiciona os novos itens ao consolidado e salva
if novos:
    consolidado.extend(novos)
    with open(CONSOLIDADO_PATH, "w", encoding="utf-8") as f:
        json.dump(consolidado, f, ensure_ascii=False, indent=2)
    print(f"Consolidado atualizado! Total final: {len(consolidado)}")
else:
    print("Nenhum item novo para adicionar.")
