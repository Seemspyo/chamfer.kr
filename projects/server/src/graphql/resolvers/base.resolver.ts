import { Query, Resolver } from 'type-graphql';
import { version } from '../../../package.json';
import { Connection } from 'typeorm';


@Resolver()
export class BaseResolver {

  constructor(
    private connection: Connection
  ) { }

  @Query(returns => String)
  version() {

    return version;
  }

  @Query(returns => String)
  ping() {

    return this.connection.isConnected ? 'pong' : 'ping';
  }

}
