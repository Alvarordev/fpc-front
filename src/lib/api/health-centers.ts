import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "@/lib/api-client";
import type {
  HealthCenter,
  CreateHealthCenterRequest,
  UpdateHealthCenterRequest,
  PeruDepartment,
} from "@/types";

export const healthCentersApi = {
  list(department?: PeruDepartment): Promise<HealthCenter[]> {
    const query = department ? `?department=${department}` : "";
    return apiGet<HealthCenter[]>(`/api/health-centers${query}`);
  },

  getById(id: string): Promise<HealthCenter> {
    return apiGet<HealthCenter>(`/api/health-centers/${id}`);
  },

  getBySlug(slug: string): Promise<HealthCenter> {
    return apiGet<HealthCenter>(`/api/health-centers/slug/${slug}`);
  },

  create(data: CreateHealthCenterRequest): Promise<HealthCenter> {
    return apiPost<HealthCenter>("/api/health-centers", data);
  },

  update(id: string, data: UpdateHealthCenterRequest): Promise<HealthCenter> {
    return apiPut<HealthCenter>(`/api/health-centers/${id}`, data);
  },

  /** Deactivate (soft delete) */
  delete(id: string): Promise<void> {
    return apiDelete(`/api/health-centers/${id}`);
  },

  reactivate(id: string): Promise<HealthCenter> {
    return apiPatch<HealthCenter>(`/api/health-centers/${id}/reactivate`);
  },
};
