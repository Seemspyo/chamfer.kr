import { IsIn } from 'class-validator';
import {
  Field,
  Int,
  ObjectType,
  registerEnumType
} from 'type-graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
import { BaseModel } from './@model';
import {
  UploadProvider,
  uploadProviders
} from './upload.def';


registerEnumType(uploadProviders, { name: 'UploadProvider' });

@Entity()
@ObjectType()
export class UploadLog extends BaseModel {

  @PrimaryGeneratedColumn('increment')
  @Field(type => Int)
  id!: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  @Field({ nullable: true, description: 'ip of uploader' })
  from?: string;

  @Column('varchar', { length: 24 })
  @Field(type => uploadProviders)
  @IsIn(Object.values(uploadProviders))
  provider!: UploadProvider;

  @Column()
  @Field()
  origin!: string;

  @Column()
  @Field()
  path!: string;

  @Column()
  @Field()
  mimetype?: string;

  @Column()
  @Field()
  href!: string;

  @CreateDateColumn()
  @Field()
  uploadAt!: Date;

}
