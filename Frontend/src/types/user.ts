export type ResponseUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  role: string;
};

export type UpdateUserPayload = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  password?: string | null; // neues Passwort (optional)
};
