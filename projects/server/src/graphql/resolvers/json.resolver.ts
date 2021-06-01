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
    
    return this.connection.getRepository(JSONData).findOne({ id });
  }

  @Authorized(adminUsers)
  @Mutation(returns => JSONData)
  async setJSONData(
    @Arg('id') id: string,
    @Arg('data') data: string
  ) {
    const repo = this.connection.getRepository(JSONData);

    let json = await repo.findOne({ id });

    if (json) {
      json.data = data;
    } else {
      json = Object.assign(repo.create(), { id, data });
    }

    return repo.save(json);
  }

}
