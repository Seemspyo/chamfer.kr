import { Integral } from '@chamfer/util/dist/type-def';
import {
  Arg,
  Authorized,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver
} from 'type-graphql';
import { Connection } from 'typeorm';
import { AuthStrategyKoa } from '../../../lib/auth-strategy/auth-strategy-koa';
import { GQLPermissionError } from '../../errors';
import {
  adminUsers,
  allUsers,
  UserRole,
  userRoles
} from '../../models/user.def';
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
export class UserUpdateInput {

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  password?: string;

  @Field(type => [ userRoles ], { nullable: true })
  roles?: UserRole[]

}

@InputType()
export class UserCreateInput extends UserUpdateInput {

  @Field()
  email!: string;

  @Field()
  username!: string;

  @Field()
  password!: string;

}

@ObjectType()
export class UserListData extends ListData<User> {

  @Field(type => [ User ])
  data!: User[];

}

@Resolver(of => User)
export class UserResolver {

  constructor(
    private auth: AuthStrategyKoa,
    private connection: Connection
  ) { }

  @Query(returns => User, { nullable: true })
  me(
    @Ctx() { user }: GQLContext
  ) {
    if (!user) {

      return null;
    }

    return this.connection
    .createQueryBuilder(User, 'user')
    .setParameters({ id: user.id, false: 0 })
    .where('user.id = :id AND user.deleted = :false')
    .getOne();
  }

  @Authorized(adminUsers)
  @Query(returns => UserListData)
  async getUserList(
    @Arg('search', { defaultValue: {} }) search: ListSearch,
    @Arg('paging', { nullable: true }) paging?: Paging
  ): Promise<UserListData> {
    const query = this.connection.createQueryBuilder(User, 'user')
                                 .where('user.deleted = :false', { false: 0 });

    applySearch(query, search);

    if (paging) {
      applyPagination(query, paging);
    }

    const [ data, total ] = await query.getManyAndCount();

    return { total, data }
  }

  @Mutation(returns => User)
  createUser(
    @Ctx() { user: currentUser }: GQLContext,
    @Arg('input') input: UserCreateInput
  ) {
    const isAdmin = Boolean(currentUser?.roles.some(role => adminUsers.includes(role as any)));

    if (!(input.roles?.length && isAdmin)) {

      throw new GQLPermissionError('cannot assign roles of user');
    }

    if (input.roles?.includes(userRoles.deus)) {

      throw new GQLPermissionError('role deus cannot be assigned via API');
    }

    if (!input.roles.length) {
      input.roles = [ userRoles.common ]
    }

    input.password = this.auth.cipher.SHAEncrypt(input.password);

    const repo = this.connection.getRepository(User);

    const user = Object.assign(repo.create(), input);

    return repo.save(user);
  }

  @Authorized(allUsers)
  @Mutation(returns => User)
  async updateUser(
    @Ctx() { user }: Integral<GQLContext>,
    @Arg('id', { description: 'id of user' }) id: string,
    @Arg('input') input: UserUpdateInput
  ) {
    const repo = this.connection.getRepository(User);

    const
    updateOther = user.id !== id,
    isDeus = user.roles.includes(userRoles.deus),
    isAdmin = Boolean(user.roles.some(role => adminUsers.includes(role as any)));

    // only admins can update others
    if (updateOther && !isAdmin) {

      throw new GQLPermissionError();
    }

    // only admins can alter other's roles
    if (input.roles && !isAdmin) {

      throw new GQLPermissionError();
    }

    if (input.roles?.includes(userRoles.deus)) {

      throw new GQLPermissionError('deus cannot be created via API');
    }

    const targetUser = await repo.createQueryBuilder('user')
                                 .setParameters({ id, false: 0 })
                                 .where('user.id = :id AND user.deleted = :false')
                                 .getOneOrFail();

    // deus should not be updated by others
    if (updateOther && targetUser.roles.includes(userRoles.deus)) {

      throw new GQLPermissionError();
    }

    // only deus can update other admins
    if (updateOther && !isDeus && targetUser.roles.some(role => adminUsers.includes(role as any))) {

      throw new GQLPermissionError();
    }

    Object.assign(targetUser, input);

    return await repo.save(targetUser);
  }

  @Authorized(allUsers)
  @Mutation(returns => Boolean)
  async deleteUser(
    @Ctx() { user }: Integral<GQLContext>,
    @Arg('id', { description: 'id of user' }) id: string
  ) {
    const targetUser = await this.connection.createQueryBuilder(User, 'user')
                                            .setParameters({ id, false: 0 })
                                            .where('user.id = :id AND user.deleted = :false')
                                            .getOne();

    if (!targetUser) {

      return false;
    }

    if (targetUser.roles.some(role => adminUsers.includes(role as any))) {

      throw new GQLPermissionError('admins cannot be deleted');
    }

    if (user.id !== id && !user.roles.some(role => adminUsers.includes(role as any))) {

      throw new GQLPermissionError('cannot delete others');
    }

    const now = Date.now();

    Object.assign(targetUser, {
      email: `${ now.toString(16) }.${ this.auth.cipher.SHAEncrypt(targetUser.email) }`,
      username: `${ now.toString(16) }.${ this.auth.cipher.SHAEncrypt(targetUser.username) }`,
      deleted: true
    });

    await this.connection.getRepository(User).save(targetUser);

    return true;
  }

}
