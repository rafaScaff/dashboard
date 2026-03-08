import json
import re
from pathlib import Path

# Caminho do arquivo
script_dir = Path(__file__).parent.parent
consolidado_file = script_dir / 'consolidado.json'

def decodificar_unicode_escapado(texto):
    """Decodifica sequências Unicode escapadas incorretamente como \\u00e9"""
    if not isinstance(texto, str):
        return texto
    
    # Quando o JSON é carregado, \\u00e9 vira \u00e9 (string literal)
    # Precisamos encontrar padrões \uXXXX e convertê-los para os caracteres corretos
    def substituir_unicode(match):
        codigo_hex = match.group(1)  # Pega os 4 dígitos hexadecimais
        try:
            # Converte o código hexadecimal para o caractere Unicode
            codigo_decimal = int(codigo_hex, 16)
            return chr(codigo_decimal)
        except (ValueError, OverflowError):
            return match.group(0)  # Retorna o original se não conseguir converter
    
    # Substitui \uXXXX pelo caractere correspondente
    # Isso funciona tanto para \u00e9 (quando já foi processado pelo JSON) 
    # quanto para casos onde ainda está como string literal
    texto_corrigido = re.sub(r'\\u([0-9a-fA-F]{4})', substituir_unicode, texto)
    
    return texto_corrigido

def limpar_item(item):
    """Limpa um item do JSON recursivamente"""
    if isinstance(item, dict):
        return {chave: limpar_item(valor) for chave, valor in item.items()}
    elif isinstance(item, list):
        return [limpar_item(elemento) for elemento in item]
    elif isinstance(item, str):
        return decodificar_unicode_escapado(item)
    else:
        return item

def limpar_consolidado():
    """Limpa caracteres Unicode encodados incorretamente no consolidado.json"""
    
    print("📖 Lendo consolidado.json...")
    with open(consolidado_file, 'r', encoding='utf-8') as f:
        consolidado = json.load(f)
    
    print(f"   Encontrados {len(consolidado)} itens")
    
    # Contar quantos caracteres Unicode escapados existem antes
    conteudo_original = json.dumps(consolidado, ensure_ascii=False)
    padroes_encontrados = len(re.findall(r'\\u[0-9a-fA-F]{4}', conteudo_original))
    print(f"   Encontrados {padroes_encontrados} padrões Unicode escapados")
    
    if padroes_encontrados == 0:
        print("✅ Nenhum caractere Unicode escapado encontrado. Arquivo já está limpo!")
        return
    
    print("🧹 Limpando caracteres Unicode escapados...")
    
    # Limpar recursivamente todos os itens
    consolidado_limpo = limpar_item(consolidado)
    
    # Verificar quantos foram corrigidos
    conteudo_limpo = json.dumps(consolidado_limpo, ensure_ascii=False)
    padroes_restantes = len(re.findall(r'\\u[0-9a-fA-F]{4}', conteudo_limpo))
    padroes_corrigidos = padroes_encontrados - padroes_restantes
    
    print(f"   Corrigidos {padroes_corrigidos} padrões Unicode")
    
    # Salvar backup antes de modificar
    backup_file = consolidado_file.with_suffix('.json.backup')
    print(f"💾 Criando backup em {backup_file.name}...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(consolidado, f, ensure_ascii=False, indent=2)
    
    # Salvar arquivo limpo
    print("💾 Salvando consolidado.json limpo...")
    with open(consolidado_file, 'w', encoding='utf-8') as f:
        json.dump(consolidado_limpo, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Concluído! {padroes_corrigidos} caracteres Unicode foram corrigidos")
    print(f"   Backup salvo em: {backup_file.name}")

if __name__ == "__main__":
    limpar_consolidado()
