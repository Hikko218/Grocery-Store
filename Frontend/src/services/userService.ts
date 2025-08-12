import { api } from "../lib/api";
import type { ResponseUser, UpdateUserPayload } from "../types/user";

export const userService = {
  // nutzt die geschützte Route GET /user/id/:id (JWT-Cookie)
  getById: (id: number) => api.get<ResponseUser>(`/user/id/${id}`),
  // nutzt die geschützte Route PUT /user/:id (JWT-Cookie)
  update: (id: number, body: UpdateUserPayload) =>
    api.put<ResponseUser>(`/user/${id}`, body),
};
