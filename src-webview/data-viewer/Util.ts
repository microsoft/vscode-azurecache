import * as Strings from '../Strings';

export function localizeDataType(type: string | undefined): string {
    switch (type) {
        case 'string':
            return Strings.StrTypeString;
        case 'list':
            return Strings.StrTypeList;
        case 'hash':
            return Strings.StrTypeHash;
        case 'set':
            return Strings.StrTypeSet;
        case 'zset':
            return Strings.StrTypeZSet;
        default:
            return Strings.StrTypeOther;
    }
}
