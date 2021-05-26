import {
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Resolver
} from 'type-graphql';
import { Connection } from 'typeorm';
import { UploadLog } from '../../models/upload.model';
import { S3 } from 'aws-sdk';
import { Inject, InjectionToken, Optional } from 'injection-js';
import { allUsers } from '../../models/user.def';
import { GQLContext } from '../@graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload';
import { GQLInvalidError } from '../../errors';
import { extname } from 'path';
import { uploadProviders } from '../../models/upload.def';
import { Integral } from '@chamfer/util/dist/type-def';


export const S3_UPLOAD_CONFIGS = new InjectionToken<string>('s3.upload-configs');

export interface S3UploadConfigs {
  bucket: string;
  originAlt?: string;
}

@Resolver(of => UploadLog)
export class UploadResolver {

  constructor(
    private connection: Connection,
    @Optional() private s3?: S3,
    @Optional() @Inject(S3_UPLOAD_CONFIGS) private configs?: S3UploadConfigs
  ) { }

  @Authorized(allUsers)
  @Mutation(returns => UploadLog)
  async singleUpload(
    @Ctx() { user, koaContext }: Integral<GQLContext>,
    @Arg('file', type => GraphQLUpload) file: FileUpload
  ) {
    if (!(this.s3 && this.configs?.bucket)) {

      throw new GQLInvalidError('upload not enabled');
    }

    const { filename, mimetype, createReadStream } = file;

    const now = new Date();

    const result = await this.s3.upload({
      Body: createReadStream(),
      Bucket: this.configs.bucket,
      ACL: 'public-read',
      Key: `uploads/${ now.getFullYear() }/${ now.getMonth() + 1 }-${ now.getDate() }/chamfer${ now.getTime().toString(16) }${ extname(filename) }`,
      ContentType: 'mimetype',
      ServerSideEncryption: 'AES256',
      ContentDisposition: 'inline'
    }).promise();

    const { origin, pathname, href } = new URL(result.Location);

    const log = Object.assign(new UploadLog(), {
      userId: user.id,
      from: koaContext.request.ip,
      provider: uploadProviders.s3,
      origin: this.configs.originAlt ?? origin,
      path: pathname.replace(`/${ this.configs.bucket }`, ''),
      mimetype,
      href
    });

    return await this.connection.getRepository(UploadLog).save(log);
  }

}
