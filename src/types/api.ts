// API response types for IDIT

import { Item } from "./index";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ItemsResponse extends ApiResponse<Item[]> {}

export interface ItemResponse extends ApiResponse<Item> {}

export interface CreateItemRequest {
  name: string;
  value: string;
}

export interface UpdateItemRequest {
  name?: string;
  value?: string;
}
