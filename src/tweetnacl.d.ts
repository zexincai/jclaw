declare module 'tweetnacl' {
  export interface KeyPair {
    publicKey: Uint8Array
    secretKey: Uint8Array
  }
  export interface Sign {
    keyPair(): KeyPair
    detached(message: Uint8Array, secretKey: Uint8Array): Uint8Array
  }
  const nacl: {
    sign: Sign
  }
  export default nacl
}
