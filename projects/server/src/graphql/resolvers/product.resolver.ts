import { Integral } from '@chamfer/util/dist/type-def';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  FieldResolver,
  Float,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root
} from 'type-graphql';
import { Connection } from 'typeorm';
import { ProductType, productTypes } from '../../models/product.def';
import { Product } from '../../models/product.model';
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
export class ProductUpdateInput {

  @Field(type => productTypes, { nullable: true })
  type?: ProductType;

  @Field({ nullable: true })
  uri?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  link?: string;

  @Field(type => Float, { nullable: true })
  price?: number;

  @Field(type => [ String ], { nullable: true })
  thumbnailURLs?: string[];

  @Field(type => [ String ], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  locked?: boolean;

}

@InputType()
export class ProductCreateInput extends ProductUpdateInput {

  @Field(type => productTypes)
  type!: ProductType;

  @Field()
  title!: string;

}

@ObjectType()
export class ProductListData extends ListData<Product> {

  @Field(type => [ Product ])
  data!: Product[];

}

@Resolver(of => Product)
export class ProductResolver {

  constructor(
    private connection: Connection
  ) { }

  @Query(returns => ProductListData)
  async getProductList(
    @Ctx() { user }: GQLContext,
    @Arg('withLocked', { defaultValue: false }) withLocked: boolean,
    @Arg('search', { defaultValue: {} }) search: ListSearch,
    @Arg('paging', { nullable: true }) paging: Paging
  ): Promise<ProductListData> {
    const query = this.createBasicSelectQuery();

    const isAdmin = Boolean(user?.roles.some(role => adminUsers.includes(role as any)));

    if (!(withLocked && isAdmin)) {
      query.andWhere('product.locked = :false');
    }

    applySearch(query, search);

    if (paging) {
      applyPagination(query, paging);
    }

    const [ data, total ] = await query.getManyAndCount();

    return { total, data }
  }

  @Authorized(adminUsers)
  @Mutation(returns => Product)
  createProduct(
    @Ctx() { user }: Integral<GQLContext>,
    @Arg('input') input: ProductCreateInput
  ) {
    const product = Object.assign(new Product(), {
      ...input,
      author: user
    });

    return this.connection.getRepository(Product).save(product);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Product)
  async updateProduct(
    @Arg('id', type => Int, { description: 'id of product' }) id: number,
    @Arg('input') input: ProductUpdateInput
  ) {
    const product = await this.createBasicSelectQuery()
                             .where('product.id = :id', { id })
                             .getOneOrFail();

    Object.assign(product, input);

    return await this.connection.getRepository(Product).save(product);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Boolean)
  async deleteProduct(
    @Arg('id', type => Int, { description: 'id of product' }) id: number
  ) {
    const result = await this.connection.getRepository(Product)
                                        .delete(id);

    return Boolean(result.affected);
  }

  private createBasicSelectQuery() {

    return this.connection
    .createQueryBuilder(Product, 'product')
    .setParameters({ true: 1, false: 0 })
    .leftJoin('product.author', 'author', 'author.deleted = :false')
    .addSelect([ 'author.id' ])
    .where('product.id IS NOT NULL'); // initialize where clause for utilizing
  }

  @FieldResolver(type => User, { nullable: true })
  author(@Root() { author }: Product) {
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
