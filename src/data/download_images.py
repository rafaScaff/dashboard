#!/usr/bin/env python3
"""
Script para baixar todas as imagens das imageUrl do arquivo consolidado.json
e adicionar image_key ao arquivo
"""

import json
import os
import requests
from urllib.parse import urlparse, unquote
import time
from pathlib import Path
import hashlib

def sanitize_filename(name):
    """Remove caracteres inválidos do nome do arquivo"""
    if not name:
        return "unnamed"
    # Remove caracteres inválidos para nome de arquivo
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '_')
    # Limita o tamanho do nome
    if len(name) > 100:
        name = name[:100]
    return name.strip()

def get_file_extension_from_url(url):
    """Tenta determinar a extensão do arquivo pela URL ou Content-Type"""
    parsed = urlparse(url)
    path = unquote(parsed.path)
    
    # Tenta pegar extensão da URL
    if '.' in path:
        ext = path.split('.')[-1].lower()
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']:
            return f'.{ext}'
    
    return '.jpg'  # Default

def download_image(url, filepath, timeout=30):
    """Baixa uma imagem de uma URL"""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            f.write(response.content)
        return True, None
    except requests.exceptions.RequestException as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)

def generate_image_key(image_url):
    """Gera uma chave única para a imagem baseada na URL"""
    return hashlib.md5(image_url.encode()).hexdigest()

def main():
    # Caminhos dos arquivos
    script_dir = Path(__file__).parent
    json_file = script_dir / 'consolidado.json'
    output_dir = script_dir / 'downloaded_images'
    
    # Cria o diretório de saída
    output_dir.mkdir(exist_ok=True)
    print(f"📁 Diretório de saída: {output_dir}")
    
    # Lê o arquivo JSON
    print(f"📖 Lendo arquivo: {json_file}")
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {json_file}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Erro ao ler JSON: {e}")
        return
    
    print(f"✅ {len(data)} entradas encontradas no arquivo")
    
    # Primeiro passo: adicionar image_key a todas as entradas com imageUrl
    print("\n🔑 Adicionando image_key às entradas...")
    entries_updated = 0
    entries_with_images = []
    
    for entry in data:
        image_url = entry.get('imageUrl')
        if image_url:
            # Gera image_key se não existir
            if 'image_key' not in entry:
                entry['image_key'] = generate_image_key(image_url)
                entries_updated += 1
            entries_with_images.append(entry)
    
    print(f"✅ {entries_updated} entradas atualizadas com image_key")
    print(f"🖼️  {len(entries_with_images)} entradas com imageUrl encontradas")
    
    # Salva o arquivo atualizado
    if entries_updated > 0:
        print(f"💾 Salvando arquivo atualizado...")
        backup_file = json_file.with_suffix('.json.backup')
        if not backup_file.exists():
            print(f"📋 Criando backup: {backup_file}")
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Arquivo salvo com image_key adicionado")
    
    if not entries_with_images:
        print("⚠️  Nenhuma imagem para baixar!")
        return
    
    # Estatísticas
    success_count = 0
    error_count = 0
    skipped_count = 0
    errors = []
    
    # Baixa cada imagem
    print("\n🚀 Iniciando download das imagens...\n")
    
    for index, entry in enumerate(entries_with_images, 1):
        image_url = entry.get('imageUrl')
        image_key = entry.get('image_key')
        name = entry.get('name', f'image_{index}')
        
        if not image_url:
            skipped_count += 1
            continue
        
        # Usa image_key como nome do arquivo
        if not image_key:
            image_key = generate_image_key(image_url)
            entry['image_key'] = image_key
        
        # Determina extensão
        ext = get_file_extension_from_url(image_url)
        filename = f"{image_key}{ext}"
        filepath = output_dir / filename
        
        # Verifica se já existe
        if filepath.exists():
            print(f"⏭️  [{index}/{len(entries_with_images)}] Já existe: {filename}")
            skipped_count += 1
            continue
        
        print(f"⬇️  [{index}/{len(entries_with_images)}] Baixando: {name[:50]}... (key: {image_key})")
        
        # Tenta baixar
        success, error = download_image(image_url, filepath)
        
        if success:
            print(f"   ✅ Sucesso: {filename}")
            success_count += 1
        else:
            print(f"   ❌ Erro: {error}")
            error_count += 1
            errors.append({
                'name': name,
                'image_key': image_key,
                'url': image_url,
                'error': error
            })
            # Remove arquivo parcial se existir
            if filepath.exists():
                filepath.unlink()
        
        # Pequeno delay para não sobrecarregar o servidor
        time.sleep(0.1)
    
    # Salva o arquivo novamente caso tenha adicionado image_keys durante o download
    if entries_updated > 0:
        print(f"\n💾 Salvando arquivo final com todos os image_keys...")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Arquivo salvo")
    
    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO DO DOWNLOAD")
    print("="*60)
    print(f"✅ Sucesso: {success_count}")
    print(f"❌ Erros: {error_count}")
    print(f"⏭️  Ignorados (já existem): {skipped_count}")
    print(f"📁 Total de imagens: {len(entries_with_images)}")
    print(f"🔑 image_keys adicionados: {entries_updated}")
    print(f"📂 Diretório: {output_dir}")
    
    if errors:
        print(f"\n⚠️  {len(errors)} erros encontrados:")
        error_file = output_dir / 'download_errors.json'
        with open(error_file, 'w', encoding='utf-8') as f:
            json.dump(errors, f, ensure_ascii=False, indent=2)
        print(f"   Erros salvos em: {error_file}")
    
    print("\n✅ Processo concluído!")

if __name__ == "__main__":
    main()
