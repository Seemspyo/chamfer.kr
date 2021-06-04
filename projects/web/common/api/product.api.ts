import { Injectable } from '@angular/core';
import {
  ListSearch,
  Paging,
  Product,
  ProductCreateInput,
  ProductListData,
  ProductUpdateInput
} from '@chamfer/server';
import { GQLClient } from 'common/graphql/client';
import { HTTP_STATE_EXPLICIT } from 'common/http-transfer';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { makeUniqueKey } from './make-unique-key';
import { GQLFieldOf } from './selection';


export const PRODUCT_FIELDS = [
  'id',
  'type',
  'uri',
  'title',
  'description',
  'link',
  'price',
  'thumbnailURLs',
  'tags',
  'locked',
  'createdAt',
  'lastUpdatedAt'
] as const;

@Injectable()
export class ProductAPI {

  constructor(
    private graphql: GQLClient
  ) { }

  public getProductList(search?: ListSearch, paging?: Paging, withLocked?: boolean, select: GQLFieldOf<Omit<Product, 'author'>> = PRODUCT_FIELDS) {
    const query = gql`
      query ($search: ListSearch, $paging: Paging, $withLocked: Boolean) {
        data: getProductList(search: $search, paging: $paging, withLocked: $withLocked) {
          total
          data {
            ${ select.join('\n') }
          }
        }
      }
    `;

    return this.graphql.query<{ data: ProductListData }>(query, { search, paging, withLocked }, { params: { [ HTTP_STATE_EXPLICIT ]: makeUniqueKey(search, paging, withLocked, select) } }).pipe(
      map(res => res.data)
    );
  }

  public createProduct(input: ProductCreateInput, select: GQLFieldOf<Product> = PRODUCT_FIELDS) {
    const query = gql`
      mutation ($input: ProductCreateInput!) {
        product: createProduct(input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ product: Product }>(query, { input }).pipe(
      map(res => res.product)
    );
  }

  public updateProduct(id: number, input: ProductUpdateInput, select: GQLFieldOf<Product> = PRODUCT_FIELDS) {
    const query = gql`
      mutation ($id: Int!, $input: ProductUpdateInput!) {
        product: updateProduct(id: $id, input: $input) {
          ${ select.join('\n') }
        }
      }
    `;

    return this.graphql.query<{ product: Product }>(query, { id, input }).pipe(
      map(res => res.product)
    );
  }

  public deleteProduct(id: number) {
    const query = gql`
      mutation ($id: Int!) {
        result: deleteProduct(id: $id)
      }
    `;

    return this.graphql.query<{ result: boolean }>(query, { id }).pipe(
      map(res => res.result)
    );
  }

}
