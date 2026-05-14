import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { User, CreateUserRequest, UpdateUserRequest, Page } from "@/types";

export const usersApi = {
  list(params?: { page?: number; size?: number; sort?: string }): Promise<Page<User>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));
    if (params?.sort) query.set("sort", params.sort);
    const qs = query.toString();
    return apiGet<Page<User>>(`/users${qs ? `?${qs}` : ""}`);
  },

  getById(id: string): Promise<User> {
    return apiGet<User>(`/users/${id}`);
  },

  create(data: CreateUserRequest): Promise<User> {
    return apiPost<User>("/users", data);
  },

  update(id: string, data: UpdateUserRequest): Promise<User> {
    return apiPut<User>(`/users/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/users/${id}`);
  },
};
