import Swal from "sweetalert2";

const baseConfig = {
  confirmButtonText: "حسناً",
  cancelButtonText: "إلغاء",
  reverseButtons: true,
  customClass: {
    popup: "swal-rtl",
    confirmButton: "swal-confirm-btn",
    cancelButton: "swal-cancel-btn",
  },
};

export const swalSuccess = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig,
    icon: "success",
    title,
    text,
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
  });

export const swalError = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig,
    icon: "error",
    title,
    text,
  });

export const swalWarning = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig,
    icon: "warning",
    title,
    text,
  });

export const swalInfo = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig,
    icon: "info",
    title,
    text,
  });

export const swalConfirm = (title: string, text?: string) =>
  Swal.fire({
    ...baseConfig,
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "نعم",
    cancelButtonText: "لا",
  });
