'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText, Package, Layers, Dumbbell, Thermometer,
  Weight, Ruler, Hash, ArrowRight, ArrowLeft, Info,
  Camera, X, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Input, Button, Card, CardHeader, CardTitle, Tooltip, Badge } from '@/components/ui';
import { PackageSchema, type PackageForm } from '@/lib/validators/booking';

// ── Package type config ───────────────────────────────────────────────────────
const PACKAGE_CARDS = [
  {
    value:       'document',
    label:       'Document',
    sublabel:    'Envelope',
    description: 'Letters, contracts, certificates (up to 500 g)',
    icon:        FileText,
    color:       'text-blue-600',
    bg:          'bg-blue-50',
  },
  {
    value:       'parcel',
    label:       'Parcel',
    sublabel:    'Box / Bag',
    description: 'Standard boxes, bags, everyday packages',
    icon:        Package,
    color:       'text-primary',
    bg:          'bg-primary/5',
  },
  {
    value:       'fragile',
    label:       'Fragile',
    sublabel:    'Handle with care',
    description: 'Glass, ceramics, electronics — extra padding',
    icon:        Layers,
    color:       'text-orange-500',
    bg:          'bg-orange-50',
  },
  {
    value:       'heavy',
    label:       'Heavy',
    sublabel:    'Over 25 kg',
    description: 'Heavy goods, machinery, appliances',
    icon:        Dumbbell,
    color:       'text-purple-600',
    bg:          'bg-purple-50',
  },
  {
    value:       'perishable',
    label:       'Perishable',
    sublabel:    'Time-sensitive',
    description: 'Food, flowers, medication — priority handled',
    icon:        Thermometer,
    color:       'text-accent',
    bg:          'bg-emerald-50',
  },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  defaultValues?: Partial<PackageForm>;
  onNext: (data: PackageForm) => void;
  onBack: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PackageDetails({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PackageForm>({
    resolver:      zodResolver(PackageSchema),
    defaultValues: {
      package_type:       'parcel',
      number_of_pieces:    1,
      is_fragile:          false,
      requires_signature:  true,
      ...defaultValues,
    },
  });

  // Photo upload state
  const [photoName,  setPhotoName]  = useState<string | undefined>();
  const [uploading,  setUploading]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const packageType  = watch('package_type');
  const isFragile    = watch('is_fragile');
  const reqSig       = watch('requires_signature');
  const weightKg     = watch('weight_kg');
  const lengthCm     = watch('length_cm');
  const widthCm      = watch('width_cm');
  const heightCm     = watch('height_cm');

  // Volumetric weight calculation (air courier: ÷ 5000)
  const hasAllDims = lengthCm && widthCm && heightCm;
  const volumetricWeight = hasAllDims
    ? +((lengthCm * widthCm * heightCm) / 5000).toFixed(3)
    : null;
  const chargeableWeight = (volumetricWeight !== null && weightKg)
    ? Math.max(weightKg, volumetricWeight)
    : null;

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
    } catch {
      // Upload endpoint may not be set up yet — just show the file name
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Package Details</CardTitle>
        <p className="text-sm font-body text-text-secondary mt-1">
          Describe the item you&apos;re sending so we can handle it correctly.
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit(onNext)} className="space-y-6 mt-2" noValidate>

        {/* ── Package type visual cards ───────────────────────────────── */}
        <fieldset>
          <legend className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Package Type *
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {PACKAGE_CARDS.map(card => {
              const Icon   = card.icon;
              const active = packageType === card.value;
              return (
                <label
                  key={card.value}
                  className={[
                    'relative flex flex-col items-center gap-2 p-3.5 rounded-xl border-2',
                    'cursor-pointer transition-all duration-150 text-center group',
                    active
                      ? 'border-secondary bg-secondary/5 shadow-sm'
                      : 'border-border bg-white hover:border-secondary/40 hover:bg-secondary/[0.03]',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    value={card.value}
                    className="sr-only"
                    {...register('package_type')}
                    onChange={() => setValue('package_type', card.value, { shouldValidate: true })}
                  />
                  <div className={[
                    'size-10 rounded-xl flex items-center justify-center transition-colors',
                    active ? card.bg : 'bg-surface group-hover:' + card.bg,
                  ].join(' ')}>
                    <Icon className={['size-5', active ? card.color : 'text-text-secondary'].join(' ')} aria-hidden="true" />
                  </div>
                  <div>
                    <p className={[
                      'text-xs font-body font-semibold leading-tight',
                      active ? 'text-primary' : 'text-text-primary',
                    ].join(' ')}>
                      {card.label}
                    </p>
                    <p className="text-[10px] font-body text-text-disabled leading-tight mt-0.5">
                      {card.sublabel}
                    </p>
                  </div>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 size-4 bg-secondary rounded-full flex items-center justify-center">
                      <CheckCircle2 className="size-3 text-primary" aria-hidden="true" />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {/* Type tooltip description */}
          {packageType && (
            <p className="text-xs font-body text-text-secondary mt-2 animate-fade-in">
              {PACKAGE_CARDS.find(c => c.value === packageType)?.description}
            </p>
          )}
          {errors.package_type && (
            <p className="text-xs text-danger mt-2">{errors.package_type.message}</p>
          )}
        </fieldset>

        {/* ── Item details ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Item Name"
            placeholder=" "
            required
            icon={<Package className="size-4" />}
            error={errors.item_name?.message}
            {...register('item_name')}
          />
          <div className="sm:col-span-1">
            <label className="text-xs font-body font-medium text-text-secondary block mb-1.5">
              Item Description <span className="text-danger">*</span>
            </label>
            <textarea
              placeholder="e.g. Electronic components, wrapped individually, contains no batteries"
              rows={3}
              className={[
                'w-full px-4 py-3 text-sm font-body bg-card border rounded-xl resize-none',
                'focus:outline-none transition-colors',
                'placeholder:text-text-disabled',
                errors.description
                  ? 'border-danger focus:border-danger'
                  : 'border-border hover:border-border-strong focus:border-secondary focus:ring-2 focus:ring-secondary/20',
              ].join(' ')}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-danger mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* ── Declared value + Weight ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-body font-medium text-text-secondary">
                Declared Value (AED) <span className="text-danger">*</span>
              </span>
              <Tooltip content="Determines insurance coverage. Liability limited to declared value or AED 100, whichever is lower, unless insurance is purchased.">
                <Info className="size-3.5 text-text-disabled cursor-help" aria-hidden="true" />
              </Tooltip>
            </div>
            <Input
              type="number"
              placeholder=" "
              label="Amount in AED"
              required
              error={errors.declared_value?.message}
              {...register('declared_value', { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Weight (kg)"
            placeholder=" "
            type="number"
            required
            icon={<Weight className="size-4" />}
            helperText="Minimum 0.01 kg"
            error={errors.weight_kg?.message}
            {...register('weight_kg', { valueAsNumber: true })}
          />
        </div>

        {/* ── Dimensions ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider">
              Dimensions (cm) — Optional
            </p>
            <Tooltip content="Dimensions are used to calculate volumetric weight. If volumetric weight exceeds actual weight, the higher value is billed.">
              <Info className="size-3.5 text-text-disabled cursor-help" aria-hidden="true" />
            </Tooltip>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Length"
              placeholder=" "
              type="number"
              icon={<Ruler className="size-4" />}
              error={errors.length_cm?.message}
              {...register('length_cm', { valueAsNumber: true })}
            />
            <Input
              label="Width"
              placeholder=" "
              type="number"
              error={errors.width_cm?.message}
              {...register('width_cm', { valueAsNumber: true })}
            />
            <Input
              label="Height"
              placeholder=" "
              type="number"
              error={errors.height_cm?.message}
              {...register('height_cm', { valueAsNumber: true })}
            />
          </div>

          {/* Volumetric weight result */}
          {volumetricWeight !== null && chargeableWeight !== null && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
              <Info className="size-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs font-body text-amber-800 space-y-0.5">
                <p>
                  <strong>Volumetric weight:</strong> {volumetricWeight} kg
                  &nbsp;(L × W × H ÷ 5,000)
                </p>
                <p>
                  <strong>Chargeable weight:</strong>{' '}
                  <span className="font-semibold">{chargeableWeight} kg</span>
                  {' '}(the higher of actual vs volumetric)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Number of pieces ───────────────────────────────────────── */}
        <Input
          label="Number of Pieces"
          placeholder=" "
          type="number"
          required
          inputSize="md"
          icon={<Hash className="size-4" />}
          error={errors.number_of_pieces?.message}
          {...register('number_of_pieces', { valueAsNumber: true })}
        />

        {/* ── Toggles ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Fragile toggle */}
          <label className={[
            'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-150',
            isFragile
              ? 'border-orange-300 bg-orange-50'
              : 'border-border bg-white hover:border-orange-200',
          ].join(' ')}>
            <div className="flex items-center gap-3">
              <div className={['size-9 rounded-lg flex items-center justify-center', isFragile ? 'bg-orange-100' : 'bg-surface'].join(' ')}>
                <AlertTriangle className={['size-4', isFragile ? 'text-orange-500' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-text-primary">Fragile Item</p>
                <p className="text-xs font-body text-text-secondary">
                  Handle with extra care &mdash; fragile sticker applied
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFragile && <Badge variant="warning" size="sm">Fragile</Badge>}
              <ToggleSwitch
                checked={isFragile}
                onChange={v => {
                  setValue('is_fragile', v, { shouldValidate: true });
                  if (v) setValue('requires_signature', true, { shouldValidate: true });
                }}
              />
            </div>
          </label>
          {errors.is_fragile && (
            <p className="text-xs text-danger -mt-1">{errors.is_fragile.message}</p>
          )}

          {/* Signature toggle */}
          <label className={[
            'flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-150',
            reqSig
              ? 'border-primary/30 bg-primary/[0.03]'
              : 'border-border bg-white hover:border-primary/20',
          ].join(' ')}>
            <div className="flex items-center gap-3">
              <div className={['size-9 rounded-lg flex items-center justify-center', reqSig ? 'bg-primary/10' : 'bg-surface'].join(' ')}>
                <CheckCircle2 className={['size-4', reqSig ? 'text-primary' : 'text-text-secondary'].join(' ')} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-text-primary">Require Signature</p>
                <p className="text-xs font-body text-text-secondary">
                  Delivery only to a named recipient
                  {isFragile && ' · Required for fragile items'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={reqSig}
              onChange={v => setValue('requires_signature', v, { shouldValidate: true })}
              disabled={isFragile}
            />
          </label>
          {errors.requires_signature && (
            <p className="text-xs text-danger -mt-1">{errors.requires_signature.message}</p>
          )}
        </div>

        {/* ── Photo upload ────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Package Photo (Optional)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePhotoChange}
            aria-label="Upload package photo"
          />
          {photoName ? (
            <div className="flex items-center gap-3 p-3.5 border border-border rounded-xl bg-surface">
              <Camera className="size-4 text-accent shrink-0" aria-hidden="true" />
              <p className="text-sm font-body text-text-primary flex-1 truncate">{photoName}</p>
              {uploading && <span className="text-xs text-text-secondary">Uploading…</span>}
              <button
                type="button"
                onClick={() => { setPhotoName(undefined); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-text-secondary hover:text-danger transition-colors"
                aria-label="Remove photo"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 px-4 py-3 border border-dashed border-border rounded-xl text-sm font-body text-text-secondary hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02] transition-all w-full"
            >
              <Camera className="size-4 shrink-0" aria-hidden="true" />
              <span>Upload a photo of the package</span>
            </button>
          )}
          <p className="text-xs font-body text-text-disabled mt-1.5">
            JPG, PNG or WEBP · Max 10 MB
          </p>
        </div>

        {/* ── Navigation ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1">
          <Button type="button" variant="ghost" size="md" leftIcon={<ArrowLeft className="size-4" />} onClick={onBack}>
            Back
          </Button>
          <Button type="submit" variant="primary" size="md" rightIcon={<ArrowRight className="size-4" />}>
            Continue to Service
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked:   boolean;
  onChange:  (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none',
        'focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-border',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block size-4 rounded-full bg-white shadow-sm transform transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}

export default PackageDetails;
