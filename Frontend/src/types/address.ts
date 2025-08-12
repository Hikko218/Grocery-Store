export type AddressType = "SHIPPING" | "BILLING";

export type ResponseAddress = {
  id: number;
  userId: number;
  type: AddressType;
  isDefault: boolean;
  name: string | null;
  street: string;
  street2: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone: string | null;
  createdAt: string;
};

export type CreateAddressPayload = {
  type: AddressType;
  isDefault?: boolean;
  name?: string | null;
  street: string;
  street2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
};

export type UpdateAddressPayload = Partial<CreateAddressPayload>;
