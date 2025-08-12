// Service for user-related API calls (get user by ID, update user)
import { api } from "../lib/api";
import type { ResponseUser, UpdateUserPayload } from "../types/user";

export const userService = {
  // Uses protected route GET /user/id/:id (JWT cookie required)
  getById: (id: number) => api.get<ResponseUser>(`/user/id/${id}`),
  // Uses protected route PUT /user/:id (JWT cookie required)
  update: (id: number, body: UpdateUserPayload) =>
    api.put<ResponseUser>(`/user/${id}`, body),
};
