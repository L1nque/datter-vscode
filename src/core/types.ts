export type DatterNodeType = 
    | 'string'
    | 'number'
    | 'boolean'
    | 'object'
    | 'array'
    | 'enum'
    | 'date';

export interface DatterNode {
  name: string;
  type: DatterNodeType;
  datterHint?: string;
  isOptional: boolean;
  children?: DatterNode[];
  arrayType?: DatterNode;
  enumValues?: (string | number)[];
  originalType: string;
}