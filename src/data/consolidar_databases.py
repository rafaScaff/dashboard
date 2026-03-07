import json
import os

def padronizar_entrada(entrada, origem_arquivo):
    """
    Padroniza uma entrada e remove campos vazios.
    """
    padronizada = {}
    
    # Adiciona campos apenas se existirem no arquivo original ou tiverem valor padrão significativo
    if "daterecorded" in entrada and entrada["daterecorded"]:
        padronizada["daterecorded"] = entrada["daterecorded"]
    
    if "originalfilepath" in entrada and entrada["originalfilepath"]:
        padronizada["originalfilepath"] = entrada["originalfilepath"]
    
    if "panoid" in entrada and entrada["panoid"]:
        padronizada["panoid"] = entrada["panoid"]
    
    # Coordenadas sempre são importantes, mas só adiciona se forem diferentes de 0
    lat = entrada.get("lat", 0.0)
    long = entrada.get("long", 0.0)
    if lat != 0.0:
        padronizada["lat"] = lat
    if long != 0.0:
        padronizada["long"] = long
    
    # Origin sempre adiciona (tem valor padrão)
    padronizada["origin"] = entrada.get("origin", origem_arquivo)
    
    if "name" in entrada and entrada["name"]:
        padronizada["name"] = entrada["name"]
    
    if "ocr" in entrada and entrada["ocr"] and len(entrada["ocr"]) > 0:
        padronizada["ocr"] = entrada["ocr"]
    
    if "description" in entrada and entrada["description"]:
        padronizada["description"] = entrada["description"]
    
    if "macro" in entrada and entrada["macro"]:
        padronizada["macro"] = entrada["macro"]
    
    if "submacro" in entrada and entrada["submacro"]:
        padronizada["submacro"] = entrada["submacro"]
    
    if "styleUrl" in entrada and entrada["styleUrl"]:
        padronizada["styleUrl"] = entrada["styleUrl"]
    
    if "imageUrl" in entrada and entrada["imageUrl"]:
        padronizada["imageUrl"] = entrada["imageUrl"]
    
    # Adiciona source_file para rastreabilidade
    padronizada["source_file"] = origem_arquivo
    
    return padronizada

def consolidar_databases():
    """
    Consolida os arquivos JSON em um único arquivo padronizado.
    """
    # Caminhos dos arquivos
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    arquivos = {
        "database_panos.json": "panos",
        "database_photos.json": "photos",
        "database.json": "database",
        "portas.json": "portas"
    }
    
    consolidado = []
    
    # Processa cada arquivo
    for nome_arquivo, origem in arquivos.items():
        caminho_arquivo = os.path.join(base_dir, nome_arquivo)
        
        if not os.path.exists(caminho_arquivo):
            print(f"⚠️  Arquivo não encontrado: {nome_arquivo}")
            continue
        
        print(f"📂 Processando {nome_arquivo}...")
        
        try:
            with open(caminho_arquivo, 'r', encoding='utf-8') as f:
                dados = json.load(f)
            
            # Se for uma lista, processa cada item
            if isinstance(dados, list):
                for entrada in dados:
                    entrada_padronizada = padronizar_entrada(entrada, origem)
                    consolidado.append(entrada_padronizada)
            else:
                # Se for um objeto único, adiciona diretamente
                entrada_padronizada = padronizar_entrada(dados, origem)
                consolidado.append(entrada_padronizada)
            
            print(f"   ✓ {len(dados) if isinstance(dados, list) else 1} entradas processadas")
            
        except json.JSONDecodeError as e:
            print(f"   ✗ Erro ao decodificar JSON: {e}")
        except Exception as e:
            print(f"   ✗ Erro ao processar arquivo: {e}")
    
    # Salva o arquivo consolidado
    caminho_consolidado = os.path.join(base_dir, "consolidado.json")
    
    print(f"\n💾 Salvando arquivo consolidado...")
    try:
        with open(caminho_consolidado, 'w', encoding='utf-8') as f:
            json.dump(consolidado, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Arquivo consolidado criado com sucesso!")
        print(f"   📊 Total de entradas: {len(consolidado)}")
        print(f"   📁 Localização: {caminho_consolidado}")
        
    except Exception as e:
        print(f"✗ Erro ao salvar arquivo consolidado: {e}")

if __name__ == "__main__":
    consolidar_databases()
