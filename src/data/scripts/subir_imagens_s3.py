#!/usr/bin/env python3
"""
Script para fazer upload apenas das novas imagens para S3,
reduzindo o tamanho antes de enviar.
"""

import json
import boto3
import io
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

# Configurações
BUCKET_NAME = 'maquininha-bucket'
AWS_REGION = 'us-east-1'
boto_access_key = ''
boto_secret_key = ''

# Configurações de redução
TARGET_SIZE_MB = 0.8
MAX_WIDTH = 1920
MIN_QUALITY = 50
MAX_QUALITY = 95


def resize_image_bytes(img_data):
    """Reduz a imagem até atingir aproximadamente 0.8MB. Retorna os bytes finais."""
    original_size_mb = len(img_data) / (1024 * 1024)

    # Se já for menor que o target, retorna como está
    if original_size_mb <= TARGET_SIZE_MB:
        return img_data

    img = Image.open(io.BytesIO(img_data))
    original_width, original_height = img.size

    best_buffer = None
    best_size_mb = original_size_mb
    best_quality = MAX_QUALITY
    best_width = original_width

    # Primeiro, tenta apenas reduzir qualidade mantendo o tamanho original
    for quality in range(MAX_QUALITY, MIN_QUALITY - 1, -5):
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", optimize=True, quality=quality)
        buffer.seek(0)
        size_mb = len(buffer.getvalue()) / (1024 * 1024)

        if size_mb <= TARGET_SIZE_MB:
            best_buffer = buffer
            best_size_mb = size_mb
            best_quality = quality
            best_width = original_width
            break

        if size_mb < best_size_mb:
            best_buffer = buffer
            best_size_mb = size_mb
            best_quality = quality
            best_width = original_width

    # Se ainda não atingiu o target, reduz o tamanho também
    if best_size_mb > TARGET_SIZE_MB:
        for width in range(MAX_WIDTH, 800, -160):
            w_percent = width / float(original_width)
            h_size = int(float(original_height) * w_percent)
            resized_img = img.resize((width, h_size), Image.Resampling.LANCZOS)

            for quality in range(MAX_QUALITY, MIN_QUALITY - 1, -5):
                buffer = io.BytesIO()
                resized_img.save(buffer, format="JPEG", optimize=True, quality=quality)
                buffer.seek(0)
                size_mb = len(buffer.getvalue()) / (1024 * 1024)

                if size_mb <= TARGET_SIZE_MB:
                    best_buffer = buffer
                    best_size_mb = size_mb
                    best_quality = quality
                    best_width = width
                    break

                if size_mb < best_size_mb:
                    best_buffer = buffer
                    best_size_mb = size_mb
                    best_quality = quality
                    best_width = width

            if best_size_mb <= TARGET_SIZE_MB:
                break

    if best_buffer and best_size_mb < original_size_mb:
        best_buffer.seek(0)
        print(f"   🔧 Reduzido: {original_size_mb:.2f}MB -> {best_size_mb:.2f}MB (qualidade: {best_quality}, largura: {best_width})")
        return best_buffer.getvalue()
    else:
        print(f"   ⚠️  Não foi possível reduzir abaixo de {TARGET_SIZE_MB}MB")
        return img_data


def upload_image(image_path):
    """Lê a imagem, reduz e faz upload para o S3."""
    s3_client = boto3.client(
        's3',
        region_name=AWS_REGION,
        aws_access_key_id=boto_access_key,
        aws_secret_access_key=boto_secret_key
    )

    image_path = Path(image_path)
    filename = image_path.name

    try:
        # Lê a imagem original
        with open(image_path, 'rb') as f:
            img_data = f.read()

        # Reduz antes de subir
        img_data = resize_image_bytes(img_data)

        # Upload dos bytes já reduzidos
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=filename,
            Body=img_data,
            ContentType='image/jpeg'
        )
        print(f"✅ {filename} enviado com sucesso")
        return True
    except Exception as e:
        print(f"❌ Erro ao enviar {filename}: {e}")
        return False


def upload_new_images():
    """Sobe apenas as imagens listadas em novas_imagens.json usando 10 threads."""
    script_dir = Path(__file__).parent
    images_dir = script_dir / 'downloaded_images_novo'
    novas_file = script_dir / 'novas_imagens.json'

    # Carrega a lista de novas image_keys
    if not novas_file.exists():
        print("❌ Arquivo novas_imagens.json não encontrado!")
        return

    with open(novas_file, 'r', encoding='utf-8') as f:
        novas_keys = json.load(f)

    print(f"📝 {len(novas_keys)} novas image_keys encontradas em novas_imagens.json")

    # Monta a lista de arquivos que existem no disco
    image_files = []
    not_found = 0
    for key in novas_keys:
        # Tenta encontrar o arquivo com extensões comuns
        found = False
        for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            filepath = images_dir / f"{key}{ext}"
            if filepath.exists():
                image_files.append(filepath)
                found = True
                break
        if not found:
            not_found += 1

    print(f"📸 {len(image_files)} imagens encontradas no disco")
    if not_found:
        print(f"⚠️  {not_found} imagens não encontradas no disco (já podem ter sido enviadas)")

    if not image_files:
        print("Nenhuma imagem para enviar.")
        return

    print(f"🚀 Iniciando upload com 10 threads...\n")

    success = 0
    errors = 0

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(upload_image, img): img for img in image_files}
        for future in as_completed(futures):
            if future.result():
                success += 1
            else:
                errors += 1

    print(f"\n{'='*60}")
    print(f"📊 RESUMO")
    print(f"{'='*60}")
    print(f"✅ Enviados com sucesso: {success}")
    print(f"❌ Erros: {errors}")
    print(f"📸 Total processado: {len(image_files)}")
    print(f"\n✅ Processo concluído!")


if __name__ == "__main__":
    upload_new_images()
