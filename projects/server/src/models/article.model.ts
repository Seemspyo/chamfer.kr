import { IsOptional, MaxLength } from 'class-validator';
import { Field, Int, ObjectType } from 'type-graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { BaseModel } from './@model';
import { User } from './user.model';


@Entity()
@ObjectType()
export class Article extends BaseModel {

  @PrimaryGeneratedColumn('increment')
  @Field(type => Int)
  id!: number;

  @Column({ length: 128, nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(128)
  category?: string;

  @Column({ length: 256 })
  @Field()
  @MaxLength(256)
  title!: string;

  @ManyToOne(type => User)
  @Field(type => User, { nullable: true })
  author!: User|null;

  @ManyToMany(type => User)
  @JoinTable()
  @Field(type => [ User ], { description: 'users who modifies article except author' })
  collaborators!: User[];

  @Column({ length: 256, unique: true, nullable: true })
  @Field({ nullable: true, description: 'article\'s URI component' })
  @IsOptional()
  @MaxLength(256)
  uri?: string;

  @Column({ length: 512, nullable: true })
  @Field({ nullable: true, description: 'short description for article' })
  @IsOptional()
  @MaxLength(512)
  description?: string;

  @Column('text')
  @Field()
  content!: string;

  @Column({ length: 512, nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(512)
  thumbnailURL?: string;

  @Column({ default: false })
  @Field()
  isDraft!: boolean;

  @Column({ default: false })
  @Field()
  locked!: boolean;

  @CreateDateColumn()
  @Field()
  createdAt!: Date;

  @UpdateDateColumn()
  @Field()
  lastUpdatedAt!: Date;

}
