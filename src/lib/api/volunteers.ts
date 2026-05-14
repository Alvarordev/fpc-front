import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { Volunteer, CreateVolunteerRequest, UpdateVolunteerRequest } from "@/types";

export const volunteersApi = {
  list(): Promise<Volunteer[]> {
    return apiGet<Volunteer[]>("/api/volunteers");
  },

  getById(id: string): Promise<Volunteer> {
    return apiGet<Volunteer>(`/api/volunteers/${id}`);
  },

  create(data: CreateVolunteerRequest): Promise<Volunteer> {
    return apiPost<Volunteer>("/api/volunteers", data);
  },

  update(id: string, data: UpdateVolunteerRequest): Promise<Volunteer> {
    return apiPut<Volunteer>(`/api/volunteers/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/api/volunteers/${id}`);
  },
};
