import { api } from "../lib/api";
import type {
  CreateAddressPayload,
  ResponseAddress,
  UpdateAddressPayload,
} from "../types/address";

export const addressService = {
  list: () => api.get<ResponseAddress[]>("/address"),
  create: (body: CreateAddressPayload) =>
    api.post<ResponseAddress>("/address", body),
  update: (id: number, body: UpdateAddressPayload) =>
    api.patch<ResponseAddress>(`/address/${id}`, body),
  remove: (id: number) => api.delete<{ success: boolean }>(`/address/${id}`),
};
