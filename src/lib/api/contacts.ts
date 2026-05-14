import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";
import type { Contact, CreateContactRequest, UpdateContactRequest } from "@/types";

export const contactsApi = {
  list(): Promise<Contact[]> {
    return apiGet<Contact[]>("/api/contacts");
  },

  getById(id: string): Promise<Contact> {
    return apiGet<Contact>(`/api/contacts/${id}`);
  },

  create(data: CreateContactRequest): Promise<Contact> {
    return apiPost<Contact>("/api/contacts", data);
  },

  update(id: string, data: UpdateContactRequest): Promise<Contact> {
    return apiPut<Contact>(`/api/contacts/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiDelete(`/api/contacts/${id}`);
  },
};
