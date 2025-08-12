// Service for address-related API calls (CRUD operations)
import { api } from "../lib/api";
import type {
  CreateAddressPayload,
  ResponseAddress,
  UpdateAddressPayload,
} from "../types/address";

export const addressService = {
  // Get all addresses
  list: () => api.get<ResponseAddress[]>("/address"),
  // Create a new address
  create: (body: CreateAddressPayload) =>
    api.post<ResponseAddress>("/address", body),
  // Update an existing address
  update: (id: number, body: UpdateAddressPayload) =>
    api.patch<ResponseAddress>(`/address/${id}`, body),
  // Delete an address by ID
  remove: (id: number) => api.delete<{ success: boolean }>(`/address/${id}`),
};
