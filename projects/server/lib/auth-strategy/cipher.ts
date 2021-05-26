import {
  KeyPairKeyObjectResult,
  createCipheriv,
  createDecipheriv,
  createHmac,
  generateKeyPairSync,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
  KeyObject,
  RsaPrivateKey,
  constants
} from 'crypto';
import {
  sign,
  verify,
  SignOptions,
  VerifyOptions
} from 'jsonwebtoken';


export class Cipher {

  private keyPair: KeyPairKeyObjectResult = generateKeyPairSync('rsa', { modulusLength: 2048 });

  /**
   * @param { string } secret a salt
   */
  constructor(
    private secret: string
  ) { }

  public get publicKey(): string | Buffer {

    return this.exportKey(this.keyPair.publicKey);
  }

  public SHAEncrypt(data: string, algorithm = 'sha512'): string {

    return createHmac(algorithm, this.secret).update(data).digest('base64');
  }

  public RSAEncrypt(data: string): string {
    const key = this.getRSAKeyObject(this.keyPair.publicKey);

    return publicEncrypt(key, Buffer.from(data)).toString('base64');
  }

  public RSADecrypt(data: string): string {
    const key = this.getRSAKeyObject(this.keyPair.privateKey);

    return privateDecrypt(key, Buffer.from(data)).toString();
  }

  public AESEncrypt(key: string, data: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), iv);

    return Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]).toString('base64');
  }

  public AESDecrypt(key: string, data: string): string {
    const iv = randomBytes(16);
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key), iv);

    return Buffer.concat([
      decipher.update(data, 'base64'),
      decipher.final()
    ]).toString();
  }

  public signToken(payload: string | object | Buffer = {}, options: SignOptions = {}): string {
    if (!options.algorithm) options.algorithm = 'RS256';

    return sign(payload, this.exportKey(this.keyPair.privateKey), options);
  }

  public verifyToken<T = any>(token: string, options: VerifyOptions = {}): T {
    if (!options.algorithms || !options.algorithms.length) options.algorithms = [ 'RS256' ]

    return verify(token, this.publicKey, options) as unknown as T;
  }

  private getRSAKeyObject(key: KeyObject): RsaPrivateKey {

    return {
      key,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }
  }

  private exportKey(key: KeyObject): string | Buffer {

    return key.export({ type: 'pkcs1', format: 'pem' });
  }
  
}
