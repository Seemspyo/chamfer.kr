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
import { Brackets, Connection } from 'typeorm';
import { BannerLinkTarget, bannerLinkTargets } from '../../models/banner.def';
import { Banner } from '../../models/banner.model';
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
export class BannerUpdateInput {

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  thumbnailURL?: string;

  @Field({ nullable: true })
  thumbnailURLAlt?: string;

  @Field({ nullable: true })
  link?: string;

  @Field(type => bannerLinkTargets, { nullable: true })
  linkTargets?: BannerLinkTarget;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  startDisplayAt?: Date;

  @Field({ nullable: true })
  endDisplayAt?: Date;

}

@InputType()
export class BannerCreateInput extends BannerUpdateInput {

  @Field()
  name!: string;

  @Field()
  thumbnailURL!: string;

}

@ObjectType()
export class BannerListData extends ListData<Banner> {

  @Field(type => [ Banner ])
  data!: Banner[];

}

@Resolver(of => Banner)
export class BannerResolver {

  constructor(
    private connection: Connection
  ) { }

  @Query(returns => BannerListData)
  async getBannerList(
    @Ctx() { user }: GQLContext,
    @Arg('withActive', { defaultValue: false }) withActive: boolean,
    @Arg('search', { defaultValue: {} }) search: ListSearch,
    @Arg('paging', { nullable: true }) paging?: Paging
  ): Promise<BannerListData> {
    const query = this.createBasicSelectQuery();

    const isAdmin = Boolean(user?.roles.some(role => adminUsers.includes(role as any)));

    if (!(withActive && isAdmin)) {
      query.andWhere('banner.active = :true');
    }

    applySearch(query, search);

    if (paging) {
      applyPagination(query, paging);
    }

    const [ data, total ] = await query.getManyAndCount();

    return { total, data }
  }

  @Authorized(adminUsers)
  @Mutation(returns => Banner)
  createBanner(
    @Ctx() { user }: Integral<GQLContext>,
    @Arg('input') input: BannerCreateInput
  ) {
    const banner = Object.assign(new Banner(), {
      ...input,
      author: user
    });

    return this.connection.getRepository(Banner).save(banner);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Banner)
  async updateBanner(
    @Arg('id', { description: 'id of banner' }) id: string,
    @Arg('input') input: BannerUpdateInput
  ) {
    const banner = await this.createBasicSelectQuery()
                             .where('banner.id = :id', { id })
                             .getOneOrFail();

    Object.assign(banner, input);

    return await this.connection.getRepository(Banner).save(banner);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Boolean)
  async deleteBanner(
    @Arg('id', { description: 'id of banner' }) id: string
  ) {
    const result = await this.connection.getRepository(Banner)
                                        .delete(id);

    return Boolean(result.affected);
  }

  private createBasicSelectQuery() {
    const now = new Date();

    return this.connection
    .createQueryBuilder(Banner, 'banner')
    .setParameters({ true: 1, false: 0, now })
    .leftJoin('banner.author', 'author', 'author.deleted = :false')
    .addSelect([ 'author.id' ])
    .where(new Brackets(subQuery => subQuery.where('banner.startDisplayAt IS NULL OR banner.startDisplayAt < :now')))
    .andWhere(new Brackets(subQuery => subQuery.where('banner.endDisplayAt IS NULL OR banner.endDisplayAt > :now')));
  }

  @FieldResolver(type => User, { nullable: true })
  author(@Root() { author }: Banner) {
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
