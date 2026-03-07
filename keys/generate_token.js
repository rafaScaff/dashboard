#!/usr/bin/env node
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
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createSign('RSA-SHA256')
    .update(signatureInput)
    .sign(privateKey, 'base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
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
console.log('\n✅ JWT gerado com sucesso!\n');
console.log('Token:');
console.log(token);
console.log('\n📋 Para usar no navegador, defina este cookie:');
console.log(`document.cookie = "jwt_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict"`);
console.log('\n');
