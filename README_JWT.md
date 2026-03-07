# Autenticação JWT com Chaves Assimétricas

Este projeto utiliza autenticação JWT com chaves RSA assimétricas. O token JWT é validado no frontend usando a chave pública.

## Configuração Inicial

### 1. Gerar Par de Chaves

Execute o script para gerar o par de chaves RSA:

```bash
node scripts/generate_keys.js
```

Isso criará:
- `keys/private_key.pem` - Chave privada (NUNCA commitar no git!)
- `keys/public_key.pem` - Chave pública
- `src/config/public_key.json` - Chave pública em formato JSON para o frontend
- `keys/generate_token.js` - Script para gerar tokens JWT

### 2. Instalar Dependências

```bash
npm install
```

A biblioteca `jose` será instalada para validação de JWT no frontend.

## Gerando Tokens JWT

Para gerar um token JWT para um usuário:

```bash
node keys/generate_token.js <username>
```

Exemplo:
```bash
node keys/generate_token.js admin
```

O script irá:
1. Gerar um token JWT assinado com a chave privada
2. Mostrar o token no console
3. Fornecer o comando para definir o cookie no navegador

## Usando o Token no Navegador

Após gerar o token, você pode defini-lo como cookie no navegador:

### Via Console do Navegador

```javascript
document.cookie = "jwt_token=SEU_TOKEN_AQUI; path=/; max-age=2592000; SameSite=Strict";
```

### Via Script

O script `generate_token.js` já fornece o comando completo para copiar e colar.

## Como Funciona

1. **Geração de Token (Local)**: 
   - Você gera o token localmente usando a chave privada
   - O token contém informações do usuário (username, etc.)

2. **Armazenamento**:
   - O token é armazenado em um cookie chamado `jwt_token`
   - O cookie tem validade de 30 dias por padrão

3. **Validação (Frontend)**:
   - O frontend lê o token do cookie
   - Valida a assinatura usando a chave pública
   - Verifica se o token não expirou
   - Se válido, permite acesso às rotas protegidas

4. **Rotas Protegidas**:
   - O componente `ProtectedRoute` valida o JWT automaticamente
   - Se inválido, redireciona para `/login`

## Estrutura do Token

O token JWT contém:
- `username`: Nome do usuário
- `iat`: Data de criação (timestamp)
- `exp`: Data de expiração (timestamp)

## Segurança

⚠️ **IMPORTANTE**:
- A chave privada (`private_key.pem`) NUNCA deve ser commitada no git
- Mantenha a chave privada segura e local
- A chave pública pode ser compartilhada (já está no código do frontend)
- Tokens expiram automaticamente após 30 dias (configurável no script)

## Troubleshooting

### Token não encontrado
- Verifique se o cookie `jwt_token` está definido
- Verifique se o cookie não expirou

### Token inválido
- Verifique se o token foi gerado com a chave privada correta
- Verifique se a chave pública no frontend corresponde à chave privada usada

### Erro ao validar
- Verifique se a biblioteca `jose` está instalada
- Verifique se o arquivo `src/config/public_key.json` existe e está correto
