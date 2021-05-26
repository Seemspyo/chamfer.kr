import { Field, ObjectType } from 'type-graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './@model';


@Entity()
@ObjectType()
export class JSONData extends BaseModel {

  @PrimaryGeneratedColumn('uuid')
  _id!: string;

  @Column({ unique: true })
  @Field()
  id!: string;

  @Column('text')
  @Field()
  data!: string;

}
