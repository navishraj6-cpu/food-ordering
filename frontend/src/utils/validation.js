/**
 * Password & Phone validation utilities
 */

export const validatePassword = (password = "") => {
  const pwd = String(password);
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd);

  const isValid = hasLength && hasUpper && hasNumber && hasSpecial;

  let message = "";
  if (!hasLength) {
    message = "Password must be at least 8 characters long.";
  } else if (!hasUpper) {
    message = "Password must contain at least one uppercase letter (A-Z).";
  } else if (!hasNumber) {
    message = "Password must contain at least one number (0-9).";
  } else if (!hasSpecial) {
    message = "Password must contain at least one special character (e.g. !@#$%^&*).";
  }

  return {
    isValid,
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    message,
  };
};

export const validatePhoneNumber = (phone = "") => {
  const str = String(phone || "").trim();
  if (!str) {
    return {
      isValid: false,
      message: "Phone number is required.",
    };
  }

  // Strip spaces, hyphens, and parentheses
  const clean = str.replace(/[\s\-()]/g, "");

  // Match 10-digit mobile starting with 6-9, optionally prefixed by +91 or 91 or 0
  const isMatch = /^(?:\+?91|0)?[6-9]\d{9}$/.test(clean);

  if (!isMatch) {
    return {
      isValid: false,
      message: "Please enter a valid 10-digit mobile number (e.g. 9876543210).",
    };
  }

  const standard10 = clean.slice(-10);

  return {
    isValid: true,
    message: "",
    cleanPhone: standard10,
  };
};
