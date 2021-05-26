import {
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
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { BaseModel } from './@model';
import { BannerLinkTarget, bannerLinkTargets } from './banner.def';
import { User } from './user.model';


registerEnumType(bannerLinkTargets, { name: 'BannerLinkTarget' });

@Entity()
@ObjectType()
export class Banner extends BaseModel {

  @PrimaryGeneratedColumn('uuid')
  @Field(type => ID)
  id!: string;

  @Column({ length: 128 })
  @Field()
  @MaxLength(128)
  name!: string;

  @ManyToOne(type => User)
  @Field(type => User, { nullable: true })
  author?: User;

  @Column({ length: 512 })
  @Field()
  @MaxLength(512)
  thumbnailURL!: string;

  @Column({ length: 512, nullable: true })
  @Field({ nullable: true, description: 'alternative thumbnail url' })
  @IsOptional()
  @MaxLength(512)
  thumbnailURLAlt?: string;

  @Column({ length: 512, nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(512)
  link?: string;

  @Column('int', { nullable: true })
  @Field(type => bannerLinkTargets, { nullable: true })
  @IsOptional()
  @IsIn(Object.values(bannerLinkTargets))
  linkTarget?: BannerLinkTarget;

  @Column({ default: false })
  @Field()
  active!: boolean;

  @Column({ nullable: true })
  @Field({ nullable: true })
  startDisplayAt!: Date;

  @Column({ nullable: true })
  @Field({ nullable: true })
  endDisplayAt!: Date;

  @CreateDateColumn()
  @Field()
  createdAt!: Date;

}
