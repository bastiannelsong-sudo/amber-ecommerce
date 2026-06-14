/**
 * CHKUI-MOL-1
 * Presentational molecule — contact info form group.
 * Composes CheckoutFormField atoms. Pure props, no store/hook imports.
 */
import React from 'react';
import { CheckoutFormField } from '../atoms/CheckoutFormField';

interface ContactInfoFormProps {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
}

export const ContactInfoForm = ({
  email,
  firstName,
  lastName,
  phone,
  onChange,
}: ContactInfoFormProps) => {
  return (
    <div className="space-y-4">
      <CheckoutFormField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder="tu@email.com"
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CheckoutFormField
          label="Nombre"
          name="firstName"
          value={firstName}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder="Tu nombre"
          required
        />
        <CheckoutFormField
          label="Apellido"
          name="lastName"
          value={lastName}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder="Tu apellido"
          required
        />
      </div>
      <CheckoutFormField
        label="Teléfono"
        name="phone"
        type="tel"
        value={phone}
        onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        placeholder="+56 9 1234 5678"
      />
    </div>
  );
};
