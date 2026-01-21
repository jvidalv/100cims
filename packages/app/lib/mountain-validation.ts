import { IntlShape } from "react-intl";

export type MountainFormData = {
  name: string;
  location: string;
  height: string;
  latitude: string;
  longitude: string;
};

export type MountainValidationResult =
  | { valid: true; data: { name: string; location: string; height: number; latitude: number; longitude: number } }
  | { valid: false; error: string };

/**
 * Validates mountain form data and returns parsed numeric values if valid
 */
export function validateMountainForm(
  form: MountainFormData,
  intl: IntlShape
): MountainValidationResult {
  if (!form.name.trim()) {
    return {
      valid: false,
      error: intl.formatMessage({ defaultMessage: "Name is required" }),
    };
  }

  if (!form.location.trim()) {
    return {
      valid: false,
      error: intl.formatMessage({ defaultMessage: "Location is required" }),
    };
  }

  const height = Number(form.height);
  if (!form.height.trim() || isNaN(height) || height < 0 || height > 10000) {
    return {
      valid: false,
      error: intl.formatMessage({
        defaultMessage: "Height must be between 0 and 10,000 meters",
      }),
    };
  }

  const latitude = Number(form.latitude);
  if (!form.latitude.trim() || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: intl.formatMessage({
        defaultMessage: "Latitude must be between -90 and 90",
      }),
    };
  }

  const longitude = Number(form.longitude);
  if (!form.longitude.trim() || isNaN(longitude) || longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: intl.formatMessage({
        defaultMessage: "Longitude must be between -180 and 180",
      }),
    };
  }

  return {
    valid: true,
    data: {
      name: form.name.trim(),
      location: form.location.trim(),
      height,
      latitude,
      longitude,
    },
  };
}
