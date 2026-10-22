'use client';

import React, { useEffect, useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
  stateFieldName?: string;
  districtFieldName?: string;
  talukFieldName?: string;
  villageFieldName?: string;
  panchayatFieldName?: string;
  pincodeFieldName?: string;
  disabled?: boolean;
}

export function LocationSelector({
  register,
  setValue,
  watch,
  errors,
  stateFieldName = 'state',
  districtFieldName = 'district',
  talukFieldName = 'taluk',
  villageFieldName = 'village',
  panchayatFieldName = 'panchayat',
  pincodeFieldName = 'pincode',
  disabled = false,
}: LocationSelectorProps) {
  const currentState = watch(stateFieldName) || 'Tamil Nadu';
  const currentDistrict = watch(districtFieldName) || '';
  const currentTaluk = watch(talukFieldName) || '';
  const currentPincode = watch(pincodeFieldName) || '';

  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [taluks, setTaluks] = useState<string[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingTaluks, setIsLoadingTaluks] = useState(false);

  // 1. Load All States once
  useEffect(() => {
    async function loadStates() {
      setIsLoadingStates(true);
      try {
        const res = await fetch('/api/locations?action=states');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setStates(json.data);
        }
      } catch (err) {
        console.error('Failed to load states:', err);
      } finally {
        setIsLoadingStates(false);
      }
    }
    loadStates();
  }, []);

  // 2. Load Districts whenever State changes
  useEffect(() => {
    if (!currentState) {
      setDistricts([]);
      return;
    }
    async function loadDistricts() {
      setIsLoadingDistricts(true);
      try {
        const res = await fetch(`/api/locations?action=districts&state=${encodeURIComponent(currentState)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDistricts(json.data);
        }
      } catch (err) {
        console.error('Failed to load districts:', err);
      } finally {
        setIsLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [currentState]);

  // 3. Load Taluks whenever District changes
  useEffect(() => {
    if (!currentDistrict) {
      setTaluks([]);
      return;
    }
    async function loadTaluks() {
      setIsLoadingTaluks(true);
      try {
        const res = await fetch(
          `/api/locations?action=taluks&state=${encodeURIComponent(currentState)}&district=${encodeURIComponent(
            currentDistrict
          )}`
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTaluks(json.data);
        }
      } catch (err) {
        console.error('Failed to load taluks:', err);
      } finally {
        setIsLoadingTaluks(false);
      }
    }
    loadTaluks();
  }, [currentState, currentDistrict]);

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* 1. Village Input */}
        <div>
          <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
            Village
          </label>
          <input
            type="text"
            {...register(villageFieldName)}
            placeholder="e.g. Melattur"
            disabled={disabled}
            className={`w-full px-3 py-2 text-xs rounded-lg border ${
              errors[villageFieldName]
                ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-[#E3E8DF] dark:border-stone-700'
            } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
          />
          {errors[villageFieldName] && (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>•</span> {errors[villageFieldName]?.message as string}
            </p>
          )}
        </div>

        {/* 2. Gram Panchayat Input */}
        <div>
          <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
            Gram Panchayat
          </label>
          <input
            type="text"
            {...register(panchayatFieldName)}
            placeholder="e.g. Melattur Panchayat"
            disabled={disabled}
            className={`w-full px-3 py-2 text-xs rounded-lg border ${
              errors[panchayatFieldName]
                ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-[#E3E8DF] dark:border-stone-700'
            } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
          />
          {errors[panchayatFieldName] && (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>•</span> {errors[panchayatFieldName]?.message as string}
            </p>
          )}
        </div>

        {/* 3. Taluk / Block Input with Datalist Suggestions */}
        <div>
          <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
            Taluk / Block
            {isLoadingTaluks && <Loader2 className="inline ml-1 h-3 w-3 animate-spin text-[#245C3A]" />}
          </label>
          <div className="relative">
            <input
              type="text"
              list="taluk-suggestions"
              {...register(talukFieldName)}
              placeholder="e.g. Papanasam"
              disabled={disabled}
              className={`w-full px-3 py-2 text-xs rounded-lg border ${
                errors[talukFieldName]
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-[#E3E8DF] dark:border-stone-700'
              } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
            />
            <datalist id="taluk-suggestions">
              {taluks.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          {errors[talukFieldName] && (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>•</span> {errors[talukFieldName]?.message as string}
            </p>
          )}
        </div>

        {/* 4. District Dropdown (From Package) */}
        <div>
          <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
            District *
            {isLoadingDistricts && <Loader2 className="inline ml-1 h-3 w-3 animate-spin text-[#245C3A]" />}
          </label>
          <div className="relative">
            <select
              {...register(districtFieldName)}
              disabled={disabled}
              className={`w-full px-3 py-2 text-xs rounded-lg border ${
                errors[districtFieldName]
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-[#E3E8DF] dark:border-stone-700'
              } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]`}
            >
              <option value="">-- Select District --</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              {/* Fallback if initial district is not in list */}
              {currentDistrict && !districts.includes(currentDistrict) && (
                <option value={currentDistrict}>{currentDistrict}</option>
              )}
            </select>
          </div>
          {errors[districtFieldName] && (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>•</span> {errors[districtFieldName]?.message as string}
            </p>
          )}
        </div>

        {/* 5. State Dropdown (From Package) */}
        <div>
          <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
            State *
            {isLoadingStates && <Loader2 className="inline ml-1 h-3 w-3 animate-spin text-[#245C3A]" />}
          </label>
          <select
            {...register(stateFieldName)}
            disabled={disabled}
            className={`w-full px-3 py-2 text-xs rounded-lg border ${
              errors[stateFieldName]
                ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-[#E3E8DF] dark:border-stone-700'
            } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 focus:outline-none focus:border-[#245C3A]`}
          >
            <option value="">-- Select State --</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {currentState && !states.includes(currentState) && (
              <option value={currentState}>{currentState}</option>
            )}
          </select>
          {errors[stateFieldName] && (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>•</span> {errors[stateFieldName]?.message as string}
            </p>
          )}
        </div>

        {/* 6. PIN Code Input */}
        <div>
          <label className="block text-xs font-semibold text-[#252B26] dark:text-stone-200 mb-1">
            PIN Code
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              {...register(pincodeFieldName)}
              placeholder="e.g. 614301"
              disabled={disabled}
              className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border ${
                errors[pincodeFieldName]
                  ? 'border-rose-400 dark:border-rose-600 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-[#E3E8DF] dark:border-stone-700'
              } bg-white dark:bg-stone-800 text-[#252B26] dark:text-stone-100 placeholder-[#687168] dark:placeholder-stone-400 focus:outline-none focus:border-[#245C3A]`}
            />
            <MapPin className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#687168] dark:text-stone-400" />
          </div>
          {errors[pincodeFieldName] && (
            <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>•</span> {errors[pincodeFieldName]?.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
