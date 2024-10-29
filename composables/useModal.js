// useModal.js
import { ref } from "vue"; // Import ref for reactive variables
import { Modal } from "flowbite"; // Import the Modal class if not already imported

export default function useModal() {
  const showModal = (modalId) => {
    const defaultOptions = {
      backdrop: "static",
      backdropClasses: "bg-gray-900/50 fixed inset-0 z-40",
      closable: true,
    };
    const $modalElement = document.querySelector(`#${modalId}`);
    if ($modalElement) {
      const modal = new Modal($modalElement, defaultOptions);
      modal.show();
    }
  };
  const showClosableModal = (modalId) => {
    const $modalElement = document.querySelector(`#${modalId}`);
    if ($modalElement) {
      const modal = new Modal($modalElement);
      modal.show();
    }
  };

  const hideModal = (modalId) => {
    const $modalElement = document.querySelector(`#${modalId}`);
    if ($modalElement) {
      const modal = new Modal($modalElement);
      modal.hide();
    }
  };

  const showToast = (toastId) => {
    const toastElement = document.querySelector(`#${toastId}`);
    if (toastElement) {
      toastElement.className = "show";
    }
  };

  return {
    showModal,
    hideModal,
    showToast,
    showClosableModal,
  };
}
