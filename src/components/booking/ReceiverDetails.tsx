'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, MapPin, ArrowRight, ArrowLeft, FileText, Copy } from 'lucide-react';
import { Input, Select, Button, Card, CardHeader, CardTitle } from '@/components/ui';
import { ReceiverSchema, type ReceiverForm, type SenderForm } from '@/lib/validators/booking';
import { EMIRATES } from '@/lib/utils/constants';

// ── Country options ───────────────────────────────────────────────────────────
const COUNTRY_OPTIONS = [
  { value: 'UAE',          label: 'United Arab Emirates (+971)' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia (+966)'         },
  { value: 'Kuwait',       label: 'Kuwait (+965)'               },
  { value: 'Qatar',        label: 'Qatar (+974)'                },
  { value: 'Bahrain',      label: 'Bahrain (+973)'              },
  { value: 'Oman',         label: 'Oman (+968)'                 },
  { value: 'Egypt',        label: 'Egypt (+20)'                 },
  { value: 'Jordan',       label: 'Jordan (+962)'               },
  { value: 'UK',           label: 'United Kingdom (+44)'        },
  { value: 'USA',          label: 'United States (+1)'          },
  { value: 'India',        label: 'India (+91)'                 },
  { value: 'Pakistan',     label: 'Pakistan (+92)'              },
  { value: 'Bangladesh',   label: 'Bangladesh (+880)'           },
  { value: 'Philippines',  label: 'Philippines (+63)'           },
  { value: 'Other',        label: 'Other'                       },
];

const COUNTRY_CODES = [
  { value: '+971', label: '+971 UAE'    },
  { value: '+966', label: '+966 KSA'    },
  { value: '+965', label: '+965 Kuwait' },
  { value: '+974', label: '+974 Qatar'  },
  { value: '+973', label: '+973 Bahrain'},
  { value: '+968', label: '+968 Oman'   },
  { value: '+962', label: '+962 Jordan' },
  { value: '+20',  label: '+20 Egypt'   },
  { value: '+44',  label: '+44 UK'      },
  { value: '+1',   label: '+1 US/CA'    },
  { value: '+91',  label: '+91 India'   },
  { value: '+92',  label: '+92 Pakistan'},
  { value: '+880', label: '+880 BD'     },
  { value: '+63',  label: '+63 PH'      },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  defaultValues?: Partial<ReceiverForm>;
  senderData?:    Partial<SenderForm>;
  onNext:         (data: ReceiverForm) => void;
  onBack:         () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ReceiverDetails({ defaultValues, senderData, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReceiverForm>({
    resolver:      zodResolver(ReceiverSchema),
    defaultValues: { phone_country_code: '+971', country: 'UAE', ...defaultValues },
  });

  const country     = watch('country');
  const emirate     = watch('emirate');
  const countryCode = watch('phone_country_code');

  // Same-as-sender quick fill
  function fillFromSender() {
    if (!senderData) return;
    const fields: Array<[keyof ReceiverForm, keyof SenderForm]> = [
      ['full_name',       'full_name'],
      ['email',           'email'],
      ['address_line_1',  'address_line_1'],
      ['address_line_2',  'address_line_2'],
      ['city',            'city'],
      ['postal_code',     'postal_code'],
    ];
    fields.forEach(([rKey, sKey]) => {
      const val = senderData[sKey];
      if (val !== undefined && val !== '') {
        setValue(rKey, val as string, { shouldValidate: false });
      }
    });
    // Country & emirate
    setValue('country',   senderData.country   ?? 'UAE');
    if (senderData.emirate) setValue('emirate', senderData.emirate);
    // Phone — reuse sender phone with UAE code
    if (senderData.phone) {
      setValue('phone',              senderData.phone);
      setValue('phone_country_code', '+971');
    }
  }

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Receiver Details</CardTitle>
            <p className="text-sm font-body text-text-secondary mt-1">
              Who is receiving the shipment?
            </p>
          </div>
          {senderData?.full_name && (
            <button
              type="button"
              onClick={fillFromSender}
              className="flex items-center gap-1.5 text-xs font-body font-medium text-primary hover:text-secondary border border-primary/20 hover:border-secondary/30 px-3 py-1.5 rounded-lg transition-all shrink-0 mt-0.5"
            >
              <Copy className="size-3" aria-hidden="true" />
              Same as sender
            </button>
          )}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onNext)} className="space-y-5 mt-2" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder=" "
            required
            icon={<User className="size-4" />}
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          {/* Phone with country code */}
          <div className="flex gap-2">
            <div className="w-36 shrink-0">
              <Select
                options={COUNTRY_CODES}
                label="Code"
                value={countryCode}
                onChange={v => setValue('phone_country_code', v as string, { shouldValidate: true })}
                error={errors.phone_country_code?.message}
              />
            </div>
            <div className="flex-1 min-w-0">
              <Input
                label="Phone"
                placeholder=" "
                type="tel"
                required
                icon={<Phone className="size-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          </div>

          <Input
            label="Email Address"
            placeholder=" "
            type="email"
            icon={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {/* Delivery address */}
        <div className="border-t border-border pt-5 space-y-4">
          <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
            Delivery Address
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
              options={COUNTRY_OPTIONS}
              label="Country"
              required
              searchable
              value={country ?? ''}
              onChange={v => setValue('country', v as string, { shouldValidate: true })}
              error={errors.country?.message}
            />
            {country === 'UAE' && (
              <Select
                options={EMIRATES}
                label="Emirate"
                value={emirate ?? ''}
                onChange={v => setValue('emirate', v as string, { shouldValidate: false })}
                error={errors.emirate?.message}
              />
            )}
            <Input
              label="Postal / ZIP Code"
              placeholder=" "
              error={errors.postal_code?.message}
              {...register('postal_code')}
            />
          </div>
        </div>

        {/* Delivery instructions */}
        <div className="border-t border-border pt-5">
          <label className="text-xs font-body font-medium text-text-secondary block mb-1.5">
            Delivery Instructions (optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
            <textarea
              placeholder="Gate code, preferred delivery time, leave at door, etc."
              rows={3}
              className="w-full pl-10 pr-4 pt-3 pb-3 text-sm font-body bg-card border border-border rounded-xl
                         focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20
                         hover:border-border-strong transition-colors placeholder:text-text-disabled resize-none"
              {...register('delivery_instructions')}
            />
            {errors.delivery_instructions && (
              <p className="text-xs text-danger mt-1">{errors.delivery_instructions.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" size="md" leftIcon={<ArrowLeft className="size-4" />} onClick={onBack}>
            Back
          </Button>
          <Button type="submit" variant="primary" size="md" rightIcon={<ArrowRight className="size-4" />}>
            Continue to Package
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ReceiverDetails;
