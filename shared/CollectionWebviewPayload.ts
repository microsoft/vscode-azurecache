import { CollectionElement } from './CollectionElement';

export interface CollectionWebviewPayload {
    data: CollectionElement[];
    hasMore: boolean;
}
