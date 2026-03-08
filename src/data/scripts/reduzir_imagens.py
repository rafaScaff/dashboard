import boto3
from PIL import Image
import io
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configurações
BUCKET_NAME = 'maquininha-bucket'
TARGET_SIZE_MB = 0.8  # Target de 0.8MB
MAX_WIDTH = 1920  # Largura máxima inicial
MIN_QUALITY = 50  # Qualidade mínima permitida
MAX_QUALITY = 95   # Qualidade máxima inicial

boto_access_key = ''
boto_secret_key = ''

s3 = boto3.client('s3',
    region_name='us-east-1',
    aws_access_key_id=boto_access_key,
    aws_secret_access_key=boto_secret_key
)

def resize_image(bucket, key):
    """Reduz a imagem até atingir aproximadamente 0.8MB"""
    try:
        # 1. Download da imagem para a memória
        response = s3.get_object(Bucket=bucket, Key=key)
        img_data = response['Body'].read()
        
        original_size_mb = len(img_data) / (1024 * 1024)
        
        # Se já for menor que o target, não faz nada
        if original_size_mb <= TARGET_SIZE_MB:
            print(f"⏭️  {key}: {original_size_mb:.2f}MB (já está abaixo de {TARGET_SIZE_MB}MB, pulando)")
            return
        
        img = Image.open(io.BytesIO(img_data))
        original_width, original_height = img.size
        
        # 2. Tentar diferentes combinações de qualidade e tamanho até atingir o target
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
            for width in range(MAX_WIDTH, 800, -160):  # Reduz de 160px em 160px
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
        
        # 3. Upload de volta apenas se conseguiu reduzir
        if best_buffer and best_size_mb < original_size_mb:
            best_buffer.seek(0)
            s3.put_object(Bucket=bucket, Key=key, Body=best_buffer, ContentType='image/jpeg')
            print(f"✅ {key}: {original_size_mb:.2f}MB -> {best_size_mb:.2f}MB (qualidade: {best_quality}, largura: {best_width})")
        else:
            print(f"⚠️  {key}: {original_size_mb:.2f}MB (não foi possível reduzir abaixo de {TARGET_SIZE_MB}MB sem perder muita qualidade)")
    
    except Exception as e:
        print(f"❌ Erro ao processar {key}: {e}")

def process_bucket():
    """Processa todas as imagens do bucket usando 10 threads"""
    paginator = s3.get_paginator('list_objects_v2')
    
    # Coletar todas as chaves primeiro
    keys_to_process = []
    for page in paginator.paginate(Bucket=BUCKET_NAME):
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                # Filtrar apenas JPEGs
                if key.lower().endswith(('.jpg', '.jpeg')):
                    keys_to_process.append(key)
    
    print(f"📸 Encontradas {len(keys_to_process)} imagens para processar\n")
    
    # Processar usando ThreadPoolExecutor com 10 workers
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(resize_image, BUCKET_NAME, key) for key in keys_to_process]
        
        for future in as_completed(futures):
            future.result()  # Garante que exceções sejam levantadas
    
    print(f"\n✅ Processo concluído!")

if __name__ == "__main__":
    process_bucket()