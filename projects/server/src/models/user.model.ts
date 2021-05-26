import {
  IsEmail,
  IsIn,
  IsOptional,
  MaxLength
} from 'class-validator';
import {
  Field,
  ID,
  ObjectType,
  registerEnumType
} from 'type-graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  Brackets,
  Column,
  CreateDateColumn,
  Entity,
  getConnection,
  PrimaryGeneratedColumn
} from 'typeorm';
import { GQLDuplicationError } from '../errors';
import { BaseModel } from './@model';
import {
  UserProvider,
  userProviders,
  UserRole,
  userRoles
} from './user.def';


registerEnumType(userProviders, { name: 'UserProvider' });
registerEnumType(userRoles, { name: 'UserRole' });

@Entity()
@ObjectType()
export class User extends BaseModel {

  @PrimaryGeneratedColumn('uuid')
  @Field(type => ID)
  id!: string;

  @Column()
  @Field()
  @IsEmail({ ignore_max_length: true })
  email!: string;

  @Column()
  @Field()
  username!: string;

  @Column({ length: 1024, select: false, nullable: true }) // social login don't have passwords
  @IsOptional()
  @MaxLength(1024)
  password?: string;

  @Column('int')
  @Field(type => userProviders)
  @IsIn(Object.values(userProviders))
  provider!: UserProvider;

  @Column('set', { enum: Object.values(userRoles) })
  @Field(type => [ userRoles ])
  @IsIn(Object.values(userRoles), { each: true })
  roles!: UserRole[];

  @CreateDateColumn()
  @Field()
  joinedAt!: Date;

  @Column({ default: false, select: false })
  deleted!: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  async checkUnique() {
    const { id = 'newbie', email, username, provider } = this;

    const query = getConnection()
                  .createQueryBuilder(User, 'user')
                  .select('user.id')
                  .setParameters({ id, email, username, provider })
                  .where('user.id != :id AND user.provider = :provider')
                  .andWhere(new Brackets(subQuery => {
                    subQuery
                    .where('user.email = :email')
                    .orWhere('user.username = :username');
                  }));

    const dupUser = await query.getOne();

    if (dupUser) {
      const props: Record<string, string> = {}

      if (dupUser.email === email) {
        props.email = email;
      }

      if (dupUser.username === username) {
        props.username = username;
      }

      throw new GQLDuplicationError(props);
    }
  }

}
