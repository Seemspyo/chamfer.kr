import { MaxLength } from 'class-validator';
import { Field, Int, ObjectType } from 'type-graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { BaseModel } from './@model';
import { User } from './user.model';


@Entity()
@ObjectType()
export class Photo extends BaseModel {

  @PrimaryGeneratedColumn('increment')
  @Field(type => Int)
  id!: number;

  @ManyToOne(type => User)
  @Field(type => User, { nullable: true })
  author?: User;

  @Column({ length: 256 })
  @MaxLength(256)
  @Field()
  name!: string;

  @Column({ length: 512 })
  @Field()
  @MaxLength(512)
  resourceURL!: string;

  @Column({ default: true })
  @Field()
  active!: boolean;

  @CreateDateColumn()
  @Field()
  createdAt!: Date;

}
