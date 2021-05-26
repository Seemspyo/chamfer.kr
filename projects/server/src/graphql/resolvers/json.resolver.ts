import {
  Arg,
  Authorized,
  Mutation,
  Query,
  Resolver
} from 'type-graphql';
import { Connection } from 'typeorm';
import { JSONData } from '../../models/json.model';
import { adminUsers } from '../../models/user.def';


@Resolver(of => JSONData)
export class JSONDataResolver {

  constructor(
    private connection: Connection
  ) { }

  @Query(returns => JSONData, { nullable: true })
  getJSONData(
    @Arg('id') id: string
  ) {
    
    return this.connection.getRepository(JSONData).findOne(id);
  }

  @Authorized(adminUsers)
  @Mutation(returns => JSONData)
  setJSONData(
    @Arg('id') id: string,
    @Arg('data') data: string
  ) {
    const repo = this.connection.getRepository(JSONData);

    const json = Object.assign(repo.create(), { id, data });

    return repo.save(json);
  }

}
