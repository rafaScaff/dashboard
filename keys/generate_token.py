#!/usr/bin/env python3
"""
Script para gerar JWT usando a chave privada
Uso: python generate_token.py
O script pedirá o username e o tempo de expiração interativamente
"""

import sys
import time
from pathlib import Path
import jwt

def find_private_key():
    """Procura a chave privada em diferentes caminhos possíveis"""
    script_dir = Path(__file__).parent
    possible_paths = [
        script_dir / 'private_key.pem',
        script_dir.parent / 'keys' / 'private_key.pem',
        script_dir.parent.parent / 'keys' / 'private_key.pem'
    ]
    
    for path in possible_paths:
        if path.exists():
            return path
    
    print('❌ Chave privada não encontrada! Execute generate_keys.js primeiro.')
    print('   Procurou em:', [str(p) for p in possible_paths])
    sys.exit(1)

def load_private_key(key_path):
    """Carrega a chave privada do arquivo"""
    with open(key_path, 'r') as f:
        # PyJWT precisa da chave como string PEM
        return f.read()

def create_jwt(username, expiration_hours):
    """Cria um JWT assinado com a chave privada"""
    # Encontra e carrega a chave privada
    private_key_path = find_private_key()
    private_key = load_private_key(private_key_path)
    
    # Calcula o tempo de expiração
    now = int(time.time())
    expiration_seconds = expiration_hours * 60 * 60
    
    # Cria o payload
    payload = {
        'username': username,
        'iat': now,
        'exp': now + expiration_seconds
    }
    
    # Gera o token JWT
    token = jwt.encode(
        payload,
        private_key,
        algorithm='RS256'
    )
    
    return token

def main():
    """Função principal"""
    print('🔐 Gerador de Token JWT\n')
    
    # Solicita o username
    username = input('Digite o nome do usuário: ').strip()
    if not username:
        print('❌ Erro: O nome do usuário não pode estar vazio')
        sys.exit(1)
    
    # Solicita o tempo de expiração
    while True:
        expiration_input = input('Digite o tempo de expiração em horas (Enter para 720 horas = 30 dias): ').strip()
        
        if not expiration_input:
            expiration_hours = 720  # 30 dias por padrão
            break
        
        try:
            expiration_hours = int(expiration_input)
            if expiration_hours <= 0:
                print('❌ Erro: O tempo de expiração deve ser maior que 0 horas')
                continue
            break
        except ValueError:
            print('❌ Erro: O tempo de expiração deve ser um número inteiro')
            continue
    
    # Gera o token
    try:
        token = create_jwt(username, expiration_hours)
        
        print('\n✅ JWT gerado com sucesso!\n')
        print('Token:')
        print(token)
        print(f'\n📋 Usuário: {username}')
        print(f'⏰ Expiração: {expiration_hours} horas ({expiration_hours / 24:.1f} dias)')
        print('\n📋 Para usar no navegador, defina este cookie:')
        max_age = expiration_hours * 60 * 60
        print(token)
        print('\n')
        
    except Exception as e:
        print(f'❌ Erro ao gerar token: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()
