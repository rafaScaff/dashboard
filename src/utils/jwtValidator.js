/**
 * Utilitário para validar JWT no frontend usando chave pública RSA
 */

import publicKeyConfig from '../config/public_key.json';

/**
 * Obtém o valor de um cookie pelo nome
 */
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Valida um JWT usando a chave pública
 */
export async function validateJWT(token) {
  try {
    // Importa a biblioteca jose dinamicamente
    const { jwtVerify, importSPKI } = await import('jose');
    
    // Importa a chave pública
    const publicKey = await importSPKI(publicKeyConfig.key, 'RS256');
    
    // Verifica o token
    const { payload } = await jwtVerify(token, publicKey);
    
    // Verifica se o token não expirou
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expirado');
    }
    
    return {
      valid: true,
      payload: payload
    };
  } catch (error) {
    console.error('Erro ao validar JWT:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Obtém e valida o JWT dos cookies
 */
export async function getValidatedJWT() {
  const token = getCookie('jwt_token');
  
  if (!token) {
    return {
      valid: false,
      error: 'Token não encontrado nos cookies'
    };
  }
  
  return await validateJWT(token);
}

/**
 * Salva o token JWT nos cookies
 */
export function setJWT(token, maxAge = 60 * 60 * 24 * 30) {
  // maxAge padrão: 30 dias
  document.cookie = `jwt_token=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

/**
 * Remove o token JWT dos cookies
 */
export function clearJWT() {
  document.cookie = 'jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
}
