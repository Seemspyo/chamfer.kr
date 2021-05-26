import { Field, InputType, Int, ObjectType } from 'type-graphql';
import { Brackets, SelectQueryBuilder } from 'typeorm';


@InputType()
export class ListSearch {

  @Field({ nullable: true, description: 'target property name' })
  orderBy?: string;

  @Field({ nullable: true, defaultValue: 'ASC' })
  orderDirection!: 'ASC'|'DESC';

  @Field(type => [ String ], { nullable: true, description: 'target properties to search', defaultValue: [] })
  searchTargets!: string[];

  @Field({ nullable: true })
  searchValue?: string;

}

@InputType()
export class Paging {

  @Field(type => Int, { nullable: true })
  skip?: number;

  @Field(type => Int, { nullable: true })
  take?: number;

}

@ObjectType({ isAbstract: true })
export abstract class ListData<T> {

  @Field(type => Int)
  total!: number;

  abstract data: T[];

}

export function applyPagination<T = any>(query: SelectQueryBuilder<T>, { skip, take }: Paging) {
  if (typeof skip === 'number') query.skip(skip);
  if (typeof take === 'number') query.take(take);

  return query;
}

export function applySearch<T = any>(query: SelectQueryBuilder<T>, search: ListSearch) {
  if (search.orderBy) {
    query.orderBy(`${ query.alias }.${ search.orderBy }`, search.orderDirection);
  }

  if (search.searchValue && search.searchTargets.length) {
    query
    .setParameter('searchValue', `%${ search.searchValue }%`)
    .andWhere(new Brackets(subQuery => {
      subQuery.where(`${ query.alias }.${ search.searchTargets[0] } LIKE :searchValue`);

      for (const target of search.searchTargets.slice(1)) {
        subQuery.orWhere(`${ query.alias }.${ target } LIKE :searchValue`);
      }
    }));
  }

  return query;
}
