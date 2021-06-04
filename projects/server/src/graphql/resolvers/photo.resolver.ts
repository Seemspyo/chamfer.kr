import { Integral } from '@chamfer/util/dist/type-def';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root
} from 'type-graphql';
import { Connection } from 'typeorm';
import { Photo } from '../../models/photo.model';
import { adminUsers } from '../../models/user.def';
import { User } from '../../models/user.model';
import { GQLContext } from '../@graphql';
import {
  applyPagination,
  applySearch,
  ListData,
  ListSearch,
  Paging
} from './@resolver';


@InputType()
export class PhotoUpdateInput {

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  resourceURL?: string;

  @Field({ nullable: true })
  active?: boolean;

}

@InputType()
export class PhotoCreateInput extends PhotoUpdateInput {

  @Field()
  name!: string;

  @Field()
  resourceURL!: string;

}

@ObjectType()
export class PhotoListData extends ListData<Photo> {

  @Field(type => [ Photo ])
  data!: Photo[];

}

@Resolver(of => Photo)
export class PhotoResolver {

  constructor(
    private connection: Connection
  ) { }

  @Query(returns => PhotoListData)
  async getPhotoList(
    @Arg('search', { defaultValue: {} }) search: ListSearch,
    @Arg('paging', { nullable: true }) paging?: Paging
  ): Promise<PhotoListData> {
    const query = this.createBasicSelectQuery()
                      .where('photo.active = :true');

    applySearch(query, search);

    if (paging) {
      applyPagination(query, paging);
    }

    const [ data, total ] = await query.getManyAndCount();

    return { total, data }
  }

  @Authorized(adminUsers)
  @Query(returns => PhotoListData)
  async getPhotoListAll(
    @Arg('search', { defaultValue: {} }) search: ListSearch,
    @Arg('paging', { nullable: true }) paging?: Paging
  ): Promise<PhotoListData> {
    const query = this.createBasicSelectQuery();

    applySearch(query, search);

    if (paging) {
      applyPagination(query, paging);
    }

    const [ data, total ] = await query.getManyAndCount();

    return { total, data }
  }

  @Authorized(adminUsers)
  @Mutation(returns => Photo)
  createPhoto(
    @Ctx() { user }: Integral<GQLContext>,
    @Arg('input') input: PhotoCreateInput
  ) {
    const photo = Object.assign(new Photo(), {
      ...input,
      author: user
    });

    return this.connection.getRepository(Photo).save(photo);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Photo)
  async updatePhoto(
    @Arg('id', type => Int, { description: 'id of banner' }) id: number,
    @Arg('input') input: PhotoUpdateInput
  ) {
    const photo = await this.createBasicSelectQuery()
                            .where('photo.id = :id', { id })
                            .getOneOrFail();

    Object.assign(photo, input);

    return await this.connection.getRepository(Photo).save(photo);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Boolean)
  async deletePhoto(
    @Arg('id', type=> Int, { description: 'id of banner' }) id: number
  ) {
    const result = await this.connection.getRepository(Photo)
                                        .delete(id);

    return Boolean(result.affected);
  }

  private createBasicSelectQuery() {

    return this.connection
    .createQueryBuilder(Photo, 'photo')
    .setParameters({ true: 1, false: 0 })
    .leftJoin('photo.author', 'author', 'author.deleted = :false')
    .addSelect([ 'author.id' ]);
  }

  @FieldResolver(type => User, { nullable: true })
  author(@Root() { author }: Photo) {
    if (!author) {

      return null;
    }

    return this.connection
    .createQueryBuilder(User, 'user')
    .setParameters({ id: author.id, false: 0 })
    .where('user.id = :id AND user.deleted = :false')
    .getOne();
  }

}
