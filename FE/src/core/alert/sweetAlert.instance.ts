import Swal from 'sweetalert2';
import './alert.scss';

// Standard Alert Instance
export const CustomSwal = Swal.mixin({
  customClass: {
    popup: 'mf-swal-popup',
    title: 'mf-swal-title',
    htmlContainer: 'mf-swal-html',
    confirmButton: 'mf-swal-confirm-btn',
    cancelButton: 'mf-swal-cancel-btn',
  },
  buttonsStyling: false,
  reverseButtons: true,
});

// Toast Instance
export const ToastSwal = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'mf-swal-toast',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});
