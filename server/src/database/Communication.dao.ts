import { QueryResult } from 'neo4j-driver';
import { ICommunication } from '../models/ICommunication';
import { IMetadata } from '../models/IMetadata';
import { IText } from '../models/IText';
import Neo4jDriver from '../utils/Neo4jDriver.js';
import { Nullable } from '../types.js';

const COMMUNICATIONS_QUERY: string = `
MATCH (l :Metadata)<-[:HAS_LETTER]-(c :Communication)
OPTIONAL MATCH (c)-[:HAS_ATTACHMENT]->(a :Metadata)
WITH l, c, collect(DISTINCT properties(a)) as attachments
OPTIONAL MATCH (l)-[:HAS_TEXT]->(v :Text {type: "variant"})

RETURN properties(c) as communication,
  properties(l) as letter,
  collect(DISTINCT properties(v)) as variants,
  attachments
`;

const COMMUNICATION_QUERY: string = `
MATCH (l :Metadata)<-[:HAS_LETTER]-(c :Communication {guid: $guid})
OPTIONAL MATCH (c)-[:HAS_ATTACHMENT]->(a :Metadata)

RETURN properties(c) as communication,
  collect(DISTINCT properties(a)) as attachments,
  properties(l) as letter
`;

const LETTER_QUERY: string = `
MATCH (l :Metadata)<-[:HAS_LETTER]-(c :Communication {guid: $guid})
RETURN properties(l) as letter
`;

const ATTACHMENTS_QUERY: string = `
MATCH (a :Metadata)<-[:HAS_ATTACHMENT]-(c :Communication {guid: $guid})
RETURN collect(DISTINCT properties(a)) as attachments
`;

export default class CommunicationDAO {
  public static async getCommunications(): Promise<ICommunication[]> {
    const communications: ICommunication[] = [];
    const result: Nullable<QueryResult> = await Neo4jDriver.runQuery(COMMUNICATIONS_QUERY);
    if (!result) return [];

    for (const record of result.records) {
      const communication: Nullable<ICommunication> = record.get('communication');
      const letter: Nullable<IMetadata> = record.get('letter');
      const variants: Nullable<IText[]> = record.get('variants');
      const attachments: Nullable<IMetadata[]> = record.get('attachments');

      if (!communication) continue;
      if (letter) letter.variants = variants ?? [];

      communication.data = JSON.stringify(communication);
      communication.letter = letter;
      communication.attachments = attachments ?? [];
      communications.push(communication);
    }

    return communications;
  }

  public static async getCommunication(communicationId: string): Promise<Nullable<ICommunication>> {
    const result: Nullable<QueryResult> = await Neo4jDriver.runQuery(COMMUNICATION_QUERY, { guid: communicationId });
    const communication: Nullable<ICommunication> = result?.records[0]?.get('communication');
    if (!communication || !result?.records[0]) return null;

    const letter: Nullable<IMetadata> = result.records[0].get('letter');
    const attachments: Nullable<IMetadata[]> = result.records[0].get('attachments');

    communication.data = JSON.stringify(communication);
    communication.attachments = attachments ?? [];
    communication.letter = letter ?? null;

    return communication;
  }

  public static async getLetter(communicationId: string): Promise<Nullable<IMetadata>> {
    const result: Nullable<QueryResult> = await Neo4jDriver.runQuery(LETTER_QUERY, { guid: communicationId });
    const letter: Nullable<IMetadata> = result?.records[0]?.get('letter');
    if (!letter) return null;

    letter.data = JSON.stringify(letter);
    return letter;
  }

  public static async getAttachments(communicationId: string): Promise<IMetadata[]> {
    const result: Nullable<QueryResult> = await Neo4jDriver.runQuery(ATTACHMENTS_QUERY, { guid: communicationId });
    const attachments: Nullable<IMetadata[]> = result?.records[0]?.get('attachment');
    if (!attachments) return [];

    return attachments.map((m: IMetadata) => ({ ...m, data: JSON.stringify(m) }));
  }
}
