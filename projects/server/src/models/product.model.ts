import {
  IsIn,
  IsOptional,
  MaxLength
} from 'class-validator';
import {
  Field,
  Float,
  Int,
  ObjectType,
  registerEnumType
} from 'type-graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { BaseModel } from './@model';
import {
  ProductType,
  productTypes
} from './product.def';
import { User } from './user.model';


registerEnumType(productTypes, { name: 'ProductType' });

@Entity()
@ObjectType()
export class Product extends BaseModel {

  @PrimaryGeneratedColumn('increment')
  @Field(type => Int)
  id!: number;

  @Column('varchar', { length: 25 })
  @Field(type => productTypes)
  @IsIn(Object.values(productTypes))
  type!: ProductType;

  @ManyToOne(type => User)
  @Field(type => User, { nullable: true })
  author?: User;

  @Column({ length: 256, unique: true, nullable: true })
  @Field({ nullable: true, description: 'article\'s URI component' })
  @IsOptional()
  @MaxLength(256)
  uri?: string;

  @Column({ length: 256 })
  @Field()
  title!: string;

  @Column({ length: 512, nullable: true })
  @Field({ nullable: true, description: 'short description for product' })
  @IsOptional()
  @MaxLength(512)
  description?: string;

  @Column({ length: 512, nullable: true })
  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(512)
  link?: string;

  @Column('float', { nullable: true })
  @Field(type => Float, { nullable: true })
  price?: number;

  @Column('simple-array', { default: '' })
  @Field(type => [ String ])
  thumbnailURLs!: string[];

  @Column('simple-array', { default: '' })
  @Field(type => [ String ])
  tags!: string[];

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
