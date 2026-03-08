#!/usr/bin/env python3
"""
Script simples para fazer upload de imagens para S3
"""

import boto3
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configurações
BUCKET_NAME = 'maquininha-bucket'
AWS_REGION = 'us-east-1'
boto_access_key = ''
boto_secret_key = ''

def upload_image(image_path):
    """
    Faz upload de uma imagem para o S3
    
    Args:
        image_path: Caminho da imagem (str ou Path)
    
    Returns:
        True se sucesso, False se erro
    """
    s3_client = boto3.client(
        's3',
        region_name=AWS_REGION,
        aws_access_key_id=boto_access_key,
        aws_secret_access_key=boto_secret_key
    )
    
    image_path = Path(image_path)
    filename = image_path.name
    
    try:
        s3_client.upload_file(
            str(image_path),
            BUCKET_NAME,
            filename)
        print(f"✅ {filename} enviado com sucesso")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar {filename}: {e}")
        return False

def upload_all_images():
    """Passa por todas as imagens e faz upload usando 10 threads"""
    script_dir = Path(__file__).parent
    images_dir = script_dir / 'downloaded_images'
    
    # Lista todas as imagens
    image_files = list(images_dir.glob('*.jpg')) + \
                  list(images_dir.glob('*.jpeg')) + \
                  list(images_dir.glob('*.png')) + \
                  list(images_dir.glob('*.gif')) + \
                  list(images_dir.glob('*.webp'))
    
    print(f"📸 Encontradas {len(image_files)} imagens")
    print(f"🚀 Iniciando upload com 10 threads...\n")
    
    # Faz upload usando ThreadPoolExecutor com 10 workers
    with ThreadPoolExecutor(max_workers=10) as executor:
        # Submete todos os uploads
        futures = {executor.submit(upload_image, img): img for img in image_files}
        
        # Aguarda conclusão de cada upload
        for future in as_completed(futures):
            future.result()  # Pega o resultado (pode lançar exceção se houver erro)
    
    print(f"\n✅ Processo concluído!")

if __name__ == "__main__":
    upload_all_images()
