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
import { GQLInvalidError, GQLPermissionError } from '../../errors';
import { Article } from '../../models/article.model';
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
export class ArticleFetchOptions {

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  onlyDraft?: boolean;

  @Field({ nullable: true })
  withDraft?: boolean;

  @Field({ nullable: true })
  withLocked?: boolean;

}

@InputType()
export class ArticleUpdateInput {

  @Field({ nullable: true })
  category?: string;

  @Field()
  title?: string;

  @Field({ nullable: true })
  uri?: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  content?: string;

  @Field({ nullable: true })
  thumbnailURL?: string;

  @Field({ nullable: true })
  isDraft?: boolean;

  @Field({ nullable: true })
  locked?: boolean;

}

@InputType()
export class ArticleCreateInput extends ArticleUpdateInput {

  @Field()
  title!: string;

  @Field()
  content!: string;

}


@ObjectType()
export class ArticleListData extends ListData<Article> {

  @Field(type => [ Article ])
  data!: Article[];

}

@Resolver(of => Article)
export class ArticleResolver {

  constructor(
    private connection: Connection
  ) { }

  @Query(returns => ArticleListData)
  async getArticleList(
    @Ctx() { user }: GQLContext,
    @Arg('options', { defaultValue: {} }) options: ArticleFetchOptions,
    @Arg('search', { defaultValue: {} }) search: ListSearch,
    @Arg('paging', { nullable: true }) paging?: Paging
  ): Promise<ArticleListData> {
    if (options.onlyDraft || options.withDraft || options.withLocked) {
      if (!user?.roles.some(role => adminUsers.includes(role as any))) {

        throw new GQLPermissionError();
      }
    }

    const query = this.createListSelectQuery(options);

    applySearch(query, search);

    if (paging) {
      applyPagination(query, paging);
    }

    const [ data, total ] = await query.getManyAndCount();

    return { total, data }
  }

  @Query(returns => Article, { nullable: true })
  async getArticle(
    @Ctx() { user }: GQLContext,
    @Arg('id', type => Int, { nullable: true }) id?: number,
    @Arg('uri', { nullable: true }) uri?: string
  ) {
    const query = this.createBasicSelectQuery();

    if (typeof id === 'number') {
      query.where('article.id = :id', { id });
    }
    else if (uri) {
      query.where('article.uri = :uri', { uri });
    }
    else {

      throw new GQLInvalidError('id or uri must provided');
    }

    const isAdmin = Boolean(user?.roles.some(role => adminUsers.includes(role as any)));

    const article = await query.getOne();

    if (!article || (!isAdmin && (article.isDraft || article.locked))) {

      return null;
    }

    return article;
  }

  @Authorized(adminUsers)
  @Mutation(returns => Article)
  createArticle(
    @Ctx() { user }: Integral<GQLContext>,
    @Arg('input') input: ArticleCreateInput
  ) {
    const article = Object.assign(new Article(), {
      ...input,
      author: user
    });

    return this.connection.getRepository(Article).save(article);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Article)
  async updateArticle(
    @Ctx() { user }: Integral<GQLContext>,
    @Arg('id', type => Int, { description: 'id of article' }) id: number,
    @Arg('input') input: ArticleUpdateInput
  ) {
    const article = await this.createBasicSelectQuery()
                              .where('article.id = :id', { id })
                              .getOneOrFail();

    Object.assign(article, input);

    if (article.author?.id !== user.id && !article.collaborators.some(c => c.id === user.id)) {
      article.collaborators.push(user);
    }

    return await this.connection.getRepository(Article).save(article);
  }

  @Authorized(adminUsers)
  @Mutation(returns => Boolean)
  async deleteArticle(
    @Arg('id', type => Int, { description: 'id of article' }) id: number
  ) {
    const result = await this.connection.getRepository(Article)
                                        .delete(id);

    return Boolean(result.affected);
  }

  private createBasicSelectQuery() {

    return this.connection
    .createQueryBuilder(Article, 'article')
    .setParameters({ true: 1, false: 0 })
    .leftJoin('article.author', 'author', 'author.deleted = :false')
    .leftJoin('article.collaborators', 'collaborator', 'collaborator.deleted = :false')
    .addSelect([ 'author.id', 'collaborator.id' ])
    .where('article.id IS NOT NULL'); // initialize where clause for utilizing
  }

  private createListSelectQuery({ category, withDraft, onlyDraft, withLocked }: ArticleFetchOptions = {}) {
    const query = this.createBasicSelectQuery()
                      .where('article.id IS NOT NULL'); // initialize where clause

    if (category) {
      query.andWhere('article.category = :category', { category: category });
    }

    if (!withDraft && !onlyDraft) {
      query.andWhere('article.isDraft = :false');
    } else if (onlyDraft) {
      query.andWhere('article.isDraft = :true');
    }

    if (!withLocked) {
      query.andWhere('article.locked = :false');
    }

    return query;
  }

  @FieldResolver(returns => User, { nullable: true })
  author(@Root() { author }: Article) {
    if (!author) {

      return null;
    }

    return this.connection
    .createQueryBuilder(User, 'user')
    .setParameters({ id: author.id, false: 0 })
    .where('user.id = :id AND user.deleted = :false')
    .getOne();
  }

  @FieldResolver(returns => [ User ])
  collaborators(@Root() { collaborators }: Article) {
    if (!collaborators.length) {

      return []
    }

    return this.connection
    .createQueryBuilder(User, 'user')
    .setParameters({ ids: collaborators.map(user => user.id), true: 1, false: 0 })
    .where('user.id IN (:ids) AND user.deleted = :false')
    .getMany();
  }

}
