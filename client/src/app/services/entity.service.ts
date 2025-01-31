import { Injectable } from '@angular/core';
import { gql } from 'apollo-angular';
import { TypedDocumentNode } from '@apollo/client/core';
import { IEntity } from '../models/IEntity';
import { ApolloService } from './apollo.service';
import { Nullable } from '../../global';
import { ENTITY_CATEGORY } from '../constants/ENTITY_CATEGORY';

const GET_ALL_ENTITIES: TypedDocumentNode = gql(`
  query GetAllEntities($type: String) {
    entities(type: $type) {
      guid
      label
      type
      mentions
      remarks
    }
  }
`);
const GET_ENTITY: TypedDocumentNode = gql(`
  query GetEntityById($entityId: String!) {
    entity(id: $entityId) {
      guid
      label
      type
      data
      mentions
      remarks
      normdata {
        guid
        label
        namespace
        prefix
        wikidata
      }
      additionalLabels {
        foreName
        surname
        label
      }
      additionalInformation
      mentionedBy {
        guid
        doctype
        editor
        label
        status
        data
      }
      remarkedBy {
        guid
        doctype
        editor
        label
        status
        data
      }
    }
  }
`);

interface QueryResponse {
  entities?: IEntity[];
  entity?: IEntity;
}

@Injectable({
  providedIn: 'root',
})
export class EntityService extends ApolloService {
  public async getEntities(type?: ENTITY_CATEGORY | string): Promise<IEntity[]> {
    const variables: Record<string, Nullable<string | boolean>> = { type: type };
    const result: Nullable<QueryResponse> = await this.query<QueryResponse>(GET_ALL_ENTITIES, variables);
    return result?.entities ?? [];
  }

  public async getEntity(entityId: string): Promise<Nullable<IEntity>> {
    const variables: Record<string, string> = { entityId: entityId };
    const result: Nullable<QueryResponse> = await this.query<QueryResponse>(GET_ENTITY, variables);
    return result?.entity;
  }
}
