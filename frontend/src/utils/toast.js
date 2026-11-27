import { toast as sonnerToast } from 'sonner';

const activeToasts = new Set();
const TOAST_DURATION = 4000;

const showToast = (type, message, description = '') => {
  if (!message) return;
  const toastKey = `${type}:${message}:${description}`;

  // Prevent duplicate toasts within dismissal window
  if (activeToasts.has(toastKey)) return;
  activeToasts.add(toastKey);

  setTimeout(() => {
    activeToasts.delete(toastKey);
  }, TOAST_DURATION);

  const opts = {
    duration: TOAST_DURATION,
    dismissible: true,
    description: description || undefined,
    onDismiss: () => activeToasts.delete(toastKey),
    onAutoClose: () => activeToasts.delete(toastKey)
  };

  switch (type) {
    case 'success':
      sonnerToast.success(message, opts);
      break;
    case 'error':
      sonnerToast.error(message, opts);
      break;
    case 'warning':
      sonnerToast.warning(message, opts);
      break;
    case 'info':
    default:
      sonnerToast.info(message, opts);
      break;
  }
};

export const toast = {
  success: (message, description) => showToast('success', message, description),
  error: (message, description) => showToast('error', message, description),
  warning: (message, description) => showToast('warning', message, description),
  info: (message, description) => showToast('info', message, description)
};

export default toast;
