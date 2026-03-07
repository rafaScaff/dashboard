#!/usr/bin/env node
/**
 * Script para gerar par de chaves RSA assimétricas para JWT
 * Gera chave privada (para assinar tokens) e chave pública (para validar no frontend)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Diretório para salvar as chaves
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

console.log('🔑 Gerando par de chaves RSA...\n');

// Gera par de chaves RSA 2048 bits
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Salva chave privada (para assinar tokens)
const privateKeyPath = path.join(keysDir, 'private_key.pem');
fs.writeFileSync(privateKeyPath, privateKey);
console.log(`✅ Chave privada salva em: ${privateKeyPath}`);
console.log('   ⚠️  MANTENHA ESTA CHAVE SEGURA! Não compartilhe ou commite no git!\n');

// Salva chave pública (para validar no frontend)
const publicKeyPath = path.join(keysDir, 'public_key.pem');
fs.writeFileSync(publicKeyPath, publicKey);
console.log(`✅ Chave pública salva em: ${publicKeyPath}`);

// Cria versão JSON da chave pública para o frontend
const publicKeyJson = {
  key: publicKey,
  format: 'pem',
  type: 'spki'
};

const publicKeyJsonPath = path.join(__dirname, '..', 'src', 'config', 'public_key.json');
const configDir = path.dirname(publicKeyJsonPath);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}
fs.writeFileSync(publicKeyJsonPath, JSON.stringify(publicKeyJson, null, 2));
console.log(`✅ Chave pública (JSON) salva em: ${publicKeyJsonPath}`);

// Cria script de exemplo para gerar JWT
const generateTokenScript = `#!/usr/bin/env node
/**
 * Script de exemplo para gerar JWT usando a chave privada
 * Uso: node generate_token.js <username>
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Função para criar JWT
function createJWT(payload, privateKey) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = \`\${encodedHeader}.\${encodedPayload}\`;

  const signature = crypto.createSign('RSA-SHA256')
    .update(signatureInput)
    .sign(privateKey, 'base64url');

  return \`\${encodedHeader}.\${encodedPayload}.\${signature}\`;
}

// Lê chave privada (tenta diferentes caminhos)
const possiblePaths = [
  path.join(__dirname, 'private_key.pem'),
  path.join(__dirname, '..', 'keys', 'private_key.pem'),
  path.join(__dirname, '..', '..', 'keys', 'private_key.pem')
];

let privateKeyPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    privateKeyPath = p;
    break;
  }
}

if (!privateKeyPath) {
  console.error('❌ Chave privada não encontrada! Execute generate_keys.js primeiro.');
  console.error('   Procurou em:', possiblePaths);
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Cria payload do token
const username = process.argv[2] || 'default_user';
const payload = {
  username: username,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 dias
};

// Gera token
const token = createJWT(payload, privateKey);
console.log('\\n✅ JWT gerado com sucesso!\\n');
console.log('Token:');
console.log(token);
console.log('\\n📋 Para usar no navegador, defina este cookie:');
console.log(\`document.cookie = "jwt_token=\${token}; path=/; max-age=\${60 * 60 * 24 * 30}; SameSite=Strict"\`);
console.log('\\n');
`;

const generateTokenPath = path.join(keysDir, 'generate_token.js');
fs.writeFileSync(generateTokenPath, generateTokenScript);
fs.chmodSync(generateTokenPath, '755');
console.log(`✅ Script de exemplo para gerar tokens salvo em: ${generateTokenPath}\n`);

console.log('📝 Próximos passos:');
console.log('   1. Use a chave privada para assinar tokens JWT');
console.log('   2. A chave pública será usada no frontend para validar os tokens');
console.log('   3. Execute: node keys/generate_token.js <username> para gerar um token de exemplo\n');
