import json
from pathlib import Path

# Caminhos dos arquivos
script_dir = Path(__file__).parent
overpass_file = script_dir / 'overpass.json'
consolidado_file = script_dir / 'consolidado.json'

def adicionar_overpass():
    """Adiciona os prédios do overpass.json ao consolidado.json"""
    
    # 1. Ler overpass_usp.json
    print("📖 Lendo overpass_usp.json...")
    with open(overpass_file, 'r', encoding='utf-8') as f:
        overpass = json.load(f)
    
    print(f"   Encontrados {len(overpass)} prédios")
    
    # 2. Ler consolidado.json
    print("📖 Lendo consolidado.json...")
    with open(consolidado_file, 'r', encoding='utf-8') as f:
        consolidado = json.load(f)
    
    print(f"   Consolidado atual tem {len(consolidado)} itens")
    
    # 3. Converter prédios para o formato do consolidado
    print("🔄 Convertendo prédios para o formato do consolidado...")
    novos_itens = []
    
    for predio in overpass:
        # Converter para o formato do consolidado
        item = {
            "name": predio.get("nome", ""),
            "lat": predio.get("latitude"),
            "long": predio.get("longitude"),
            "description": predio.get("tags", ""),
            "source_file": "overpass"
        }
        
        # Adicionar apenas se tiver coordenadas válidas
        lat = item["lat"]
        long = item["long"]
        if lat is not None and long is not None:
            # Validar coordenadas
            if -90 <= lat <= 90 and -180 <= long <= 180:
                novos_itens.append(item)
            else:
                print(f"   ⚠️  Pulando {predio.get('nome', 'sem nome')} - coordenadas inválidas ({lat}, {long})")
        else:
            print(f"   ⚠️  Pulando {predio.get('nome', 'sem nome')} - sem coordenadas")
    
    print(f"   {len(novos_itens)} prédios válidos para adicionar")
    
    # 4. Adicionar ao consolidado
    print("➕ Adicionando ao consolidado...")
    consolidado.extend(novos_itens)
    
    # 5. Salvar consolidado atualizado
    print("💾 Salvando consolidado.json...")
    with open(consolidado_file, 'w', encoding='utf-8') as f:
        json.dump(consolidado, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Concluído! Consolidado agora tem {len(consolidado)} itens")
    print(f"   Adicionados {len(novos_itens)} novos itens com source_file='overpass'")

if __name__ == "__main__":
    adicionar_overpass()
