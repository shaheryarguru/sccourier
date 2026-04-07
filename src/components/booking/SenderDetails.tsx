'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, Building2, CreditCard, MapPin, ArrowRight } from 'lucide-react';
import { Input, Select, Button, Card, CardHeader, CardTitle } from '@/components/ui';
import { SenderSchema, type SenderForm } from '@/lib/validators/booking';
import { EMIRATES } from '@/lib/utils/constants';

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  defaultValues?: Partial<SenderForm>;
  onNext:         (data: SenderForm) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SenderDetails({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SenderForm>({
    resolver:      zodResolver(SenderSchema),
    defaultValues: {
      country:         'UAE',
      save_as_default: false,
      ...defaultValues,
    },
  });

  const emirate = watch('emirate');

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Sender Details</CardTitle>
        <p className="text-sm font-body text-text-secondary mt-1">
          Your information — this is where the shipment will be collected from.
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit(onNext)} className="space-y-5 mt-2" noValidate>
        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder=" "
            required
            icon={<User className="size-4" />}
            error={errors.full_name?.message}
            {...register('full_name')}
          />
          <Input
            label="Phone (UAE)"
            placeholder=" "
            type="tel"
            required
            icon={<Phone className="size-4" />}
            helperText="e.g. 0501234567 or +971 50 123 4567"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Email Address"
            placeholder=" "
            type="email"
            icon={<Mail className="size-4" />}
            helperText="Optional — for booking confirmation"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Company Name"
            placeholder=" "
            icon={<Building2 className="size-4" />}
            error={errors.company_name?.message}
            {...register('company_name')}
          />
          <Input
            label="Emirates ID"
            placeholder=" "
            icon={<CreditCard className="size-4" />}
            helperText="Format: 784-XXXX-XXXXXXX-X (optional)"
            error={errors.emirates_id?.message}
            {...register('emirates_id')}
          />
        </div>

        {/* Pickup address */}
        <div className="border-t border-border pt-5 space-y-4">
          <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
            Pickup Address
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Address Line 1"
                placeholder=" "
                required
                icon={<MapPin className="size-4" />}
                error={errors.address_line_1?.message}
                {...register('address_line_1')}
              />
            </div>
            <Input
              label="Address Line 2"
              placeholder=" "
              error={errors.address_line_2?.message}
              {...register('address_line_2')}
            />
            <Input
              label="City"
              placeholder=" "
              required
              error={errors.city?.message}
              {...register('city')}
            />
            <Select
              options={EMIRATES}
              label="Emirate"
              required
              value={emirate ?? ''}
              onChange={v => setValue('emirate', v as string, { shouldValidate: true })}
              error={errors.emirate?.message}
            />
            <Input
              label="Postal Code"
              placeholder=" "
              error={errors.postal_code?.message}
              {...register('postal_code')}
            />
          </div>
        </div>

        {/* Save as default */}
        <div className="flex items-center gap-2.5 pt-1">
          <input
            id="save_default"
            type="checkbox"
            className="size-4 rounded border-border accent-primary"
            {...register('save_as_default')}
          />
          <label htmlFor="save_default" className="text-sm font-body text-text-secondary cursor-pointer">
            Save as my default sender address for future bookings
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md" rightIcon={<ArrowRight className="size-4" />}>
            Continue to Receiver
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default SenderDetails;
