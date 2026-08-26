/* =========================================================
   CONFIG
   Replace this with your deployed Google Apps Script Web App URL.
   See the setup guide for how to get this.
   ========================================================= */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz4k-n-7X64ZeSsXL52whc-jlFn1qtLwTC4GYYPa4Fs8q3HASoQIsgcMgNhCmoPqPWR/exec";

/* =========================================================
   ELEMENT REFERENCES
   ========================================================= */
const form = document.getElementById("booking-form");
const submitBtn = document.getElementById("submit-btn");
const btnLabel = submitBtn.querySelector(".btn-label");
const formErrorBanner = document.getElementById("form-error-banner");
const formErrorText = document.getElementById("form-error-text");

const appointmentGrid = document.querySelector(".appointment-grid");
const appointmentCards = document.querySelectorAll(".appointment-card");
const appointmentHiddenInput = document.getElementById("appointment-value");
const appointmentErrorEl = document.getElementById("error-appointment");

const successModal = document.getElementById("success-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");

// Key used to remember form data in memory if a submission fails,
// so the student doesn't have to retype everything.
let lastFailedFormData = null;

/* =========================================================
   FOOTER YEAR
   ========================================================= */
document.getElementById("year").textContent = new Date().getFullYear();

/* =========================================================
   APPOINTMENT CARD PICKER
   ========================================================= */
appointmentCards.forEach((card) => {
  card.addEventListener("click", () => {
    appointmentCards.forEach((c) => {
      c.classList.remove("is-selected");
      c.setAttribute("aria-checked", "false");
    });
    card.classList.add("is-selected");
    card.setAttribute("aria-checked", "true");
    appointmentHiddenInput.value = card.dataset.value;
    clearFieldError("appointment", appointmentErrorEl, appointmentGrid);
  });
});

/* =========================================================
   VALIDATION HELPERS
   ========================================================= */
function setFieldError(fieldWrapperEl, errorEl, message) {
  fieldWrapperEl.classList.add("has-error");
  errorEl.textContent = message;
}

function clearFieldError(fieldName, errorEl, fieldWrapperEl) {
  if (errorEl) errorEl.textContent = "";
  if (fieldWrapperEl) fieldWrapperEl.classList.remove("has-error");
}

function validateStudentName(value) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "الرجاء إدخال اسم الطالب";
  if (trimmed.length < 3) return "الاسم يجب أن يكون 3 أحرف على الأقل";
  return "";
}

function validateAge(value) {
  if (value.trim() === "") return "الرجاء إدخال السن";
  const age = Number(value);
  if (Number.isNaN(age)) return "الرجاء إدخال رقم صحيح";
  if (age < 10 || age > 25) return "الرجاء إدخال سن مناسب لطالب الثانوية (10-25)";
  return "";
}

function validateGrade(value) {
  if (!value) return "الرجاء اختيار الصف الدراسي";
  return "";
}

function validateAppointment(value) {
  if (!value) return "الرجاء اختيار موعد الشرح";
  return "";
}

function validatePhone(value) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "الرجاء إدخال رقم الهاتف";
  // Accepts Egyptian mobile numbers (01xxxxxxxxx) or general international format.
  const egyptianMobile = /^01[0125][0-9]{8}$/;
  const generalPhone = /^\+?[0-9]{9,14}$/;
  const cleaned = trimmed.replace(/[\s-]/g, "");
  if (!egyptianMobile.test(cleaned) && !generalPhone.test(cleaned)) {
    return "رقم الهاتف غير صحيح، تأكد من كتابته بشكل صحيح";
  }
  return "";
}

/* =========================================================
   LIVE VALIDATION (on blur) for a smoother experience
   ========================================================= */
function attachLiveValidation(inputId, errorId, validatorFn) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(errorId);
  const wrapper = input.closest(".form-field");
  input.addEventListener("blur", () => {
    const message = validatorFn(input.value);
    if (message) {
      setFieldError(wrapper, errorEl, message);
    } else {
      clearFieldError(inputId, errorEl, wrapper);
    }
  });
  input.addEventListener("input", () => {
    if (wrapper.classList.contains("has-error")) {
      const message = validatorFn(input.value);
      if (!message) clearFieldError(inputId, errorEl, wrapper);
    }
  });
}

attachLiveValidation("student-name", "error-student-name", validateStudentName);
attachLiveValidation("student-age", "error-student-age", validateAge);
attachLiveValidation("student-phone", "error-student-phone", validatePhone);

document.getElementById("student-grade").addEventListener("change", (e) => {
  const wrapper = e.target.closest(".form-field");
  const errorEl = document.getElementById("error-student-grade");
  const message = validateGrade(e.target.value);
  if (message) setFieldError(wrapper, errorEl, message);
  else clearFieldError("grade", errorEl, wrapper);
});

/* =========================================================
   FULL FORM VALIDATION (on submit)
   ========================================================= */
function validateForm(data) {
  const errors = {};

  const nameMsg = validateStudentName(data.studentName);
  if (nameMsg) errors.studentName = nameMsg;

  const ageMsg = validateAge(data.age);
  if (ageMsg) errors.age = ageMsg;

  const gradeMsg = validateGrade(data.grade);
  if (gradeMsg) errors.grade = gradeMsg;

  const appointmentMsg = validateAppointment(data.appointment);
  if (appointmentMsg) errors.appointment = appointmentMsg;

  const phoneMsg = validatePhone(data.phone);
  if (phoneMsg) errors.phone = phoneMsg;

  return errors;
}

function displayValidationErrors(errors) {
  const map = {
    studentName: { wrapper: document.getElementById("student-name").closest(".form-field"), error: document.getElementById("error-student-name") },
    age: { wrapper: document.getElementById("student-age").closest(".form-field"), error: document.getElementById("error-student-age") },
    grade: { wrapper: document.getElementById("student-grade").closest(".form-field"), error: document.getElementById("error-student-grade") },
    appointment: { wrapper: appointmentGrid, error: appointmentErrorEl },
    phone: { wrapper: document.getElementById("student-phone").closest(".form-field"), error: document.getElementById("error-student-phone") },
  };

  Object.entries(map).forEach(([field, { wrapper, error }]) => {
    if (errors[field]) {
      setFieldError(wrapper, error, errors[field]);
    } else {
      clearFieldError(field, error, wrapper);
    }
  });
}

/* =========================================================
   FORM SUBMISSION
   ========================================================= */
function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
  btnLabel.textContent = isLoading ? "جاري تسجيل الحجز..." : "تأكيد الحجز";
}

function showFormError(message) {
  formErrorText.textContent = message || "حدث خطأ أثناء إرسال الحجز. حاول مرة أخرى.";
  formErrorBanner.hidden = false;
}

function hideFormError() {
  formErrorBanner.hidden = true;
}

function restoreFormData(data) {
  document.getElementById("student-name").value = data.studentName || "";
  document.getElementById("student-age").value = data.age || "";
  document.getElementById("student-grade").value = data.grade || "";
  document.getElementById("student-phone").value = data.phone || "";
  document.getElementById("student-notes").value = data.notes || "";

  if (data.appointment) {
    appointmentHiddenInput.value = data.appointment;
    appointmentCards.forEach((card) => {
      const match = card.dataset.value === data.appointment;
      card.classList.toggle("is-selected", match);
      card.setAttribute("aria-checked", match ? "true" : "false");
    });
  }
}

function resetForm() {
  form.reset();
  appointmentHiddenInput.value = "";
  appointmentCards.forEach((card) => {
    card.classList.remove("is-selected");
    card.setAttribute("aria-checked", "false");
  });
  document.querySelectorAll(".form-field").forEach((f) => f.classList.remove("has-error"));
  document.querySelectorAll(".field-error").forEach((e) => (e.textContent = ""));
  appointmentGrid.classList.remove("has-error");
}

function openSuccessModal() {
  successModal.hidden = false;
  modalCloseBtn.focus();
}

function closeSuccessModal() {
  successModal.hidden = true;
}

modalCloseBtn.addEventListener("click", closeSuccessModal);
successModal.addEventListener("click", (e) => {
  if (e.target === successModal) closeSuccessModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !successModal.hidden) closeSuccessModal();
});

let isSubmitting = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return; // prevent duplicate submissions

  hideFormError();

  const formData = {
    studentName: document.getElementById("student-name").value,
    age: document.getElementById("student-age").value,
    grade: document.getElementById("student-grade").value,
    appointment: appointmentHiddenInput.value,
    phone: document.getElementById("student-phone").value,
    notes: document.getElementById("student-notes").value,
  };

  const errors = validateForm(formData);
  displayValidationErrors(errors);

  if (Object.keys(errors).length > 0) {
    // Scroll to the first error for a smoother mobile experience.
    const firstErrorField = document.querySelector(".has-error, .appointment-grid.has-error");
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  isSubmitting = true;
  setLoadingState(true);

  try {
    await submitToGoogleSheet(formData);
    isSubmitting = false;
    setLoadingState(false);
    resetForm();
    lastFailedFormData = null;
    openSuccessModal();
  } catch (err) {
    isSubmitting = false;
    setLoadingState(false);
    lastFailedFormData = formData;
    restoreFormData(formData); // keep entered data so the student doesn't retype it
    showFormError("تعذّر إرسال الحجز، يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.");
    console.error("Booking submission failed:", err);
  }
});

/* =========================================================
   GOOGLE APPS SCRIPT SUBMISSION
   Uses "text/plain" content type to avoid a CORS preflight
   request, which Google Apps Script Web Apps do not handle.
   ========================================================= */
async function submitToGoogleSheet(data) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    throw new Error("Google Apps Script URL is not configured yet.");
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Server responded with status ${response.status}`);
  }

  const result = await response.json();

  if (!result || result.status !== "success") {
    throw new Error((result && result.message) || "Unknown error from Apps Script");
  }

  return result;
}
