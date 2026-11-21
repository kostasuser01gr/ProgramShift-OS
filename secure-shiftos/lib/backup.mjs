import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
const MAGIC = Buffer.from('PSBK1');
const SCRYPT = { N: 1<<15, r: 8, p: 1, maxmem: 64*1024*1024 };
function pass(password) { if (typeof password !== 'string' || password.length < 16) throw new Error('Passphrase must contain at least 16 characters'); }
function derive(password,salt) { return scryptSync(password,salt,32,SCRYPT); }
export function encryptXlsx(xlsx,password) {
  pass(password);
  const data=Buffer.from(xlsx);
  if (!data.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04]))) throw new Error('Not a valid XLSX ZIP header');
  const salt=randomBytes(16), nonce=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',derive(password,salt),nonce); cipher.setAAD(MAGIC);
  return Buffer.concat([MAGIC,salt,nonce,cipher.update(data),cipher.final(),cipher.getAuthTag()]);
}
export function decryptXlsx(ciphertext,password) {
  pass(password); const data=Buffer.from(ciphertext);
  if(data.length<53 || !data.subarray(0,5).equals(MAGIC)) throw new Error('Invalid backup');
  const salt=data.subarray(5,21),nonce=data.subarray(21,33),tag=data.subarray(-16);
  const cipher=createDecipheriv('aes-256-gcm',derive(password,salt),nonce);
  cipher.setAAD(MAGIC); cipher.setAuthTag(tag);
  const clear=Buffer.concat([cipher.update(data.subarray(33,-16)),cipher.final()]);
  if(!clear.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04]))) throw new Error('Invalid XLSX after decryption');
  return clear;
}
