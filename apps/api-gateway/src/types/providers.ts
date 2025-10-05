export type SupabaseOperationType =
  | 'create_table'
  | 'query'
  | 'insert'
  | 'update'
  | 'delete';

export type SupabaseOperation = {
  type: SupabaseOperationType;
  payload: any;
};
