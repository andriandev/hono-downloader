export interface ResJSONTypes<T = any> {
  statusCode?: number;
  data?: T;
  [key: string]: any;
}

export interface LayoutTypes {
  meta?: string;
  title?: string;
  children?: string;
}
