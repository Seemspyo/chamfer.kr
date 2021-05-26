import { UserInputError } from 'apollo-server-errors';
import { validateOrReject } from 'class-validator';
import { BeforeInsert, BeforeUpdate } from 'typeorm';


export class BaseModel {

  @BeforeInsert()
  @BeforeUpdate()
  async validate() {
    try {

      await validateOrReject(this);

    } catch (errors) {
      const map: Record<string, any> = {}

      for (const { property, value } of errors) {
        map[property] = value;
      }

      throw new UserInputError('invalid input', map);
    }
  }

}
