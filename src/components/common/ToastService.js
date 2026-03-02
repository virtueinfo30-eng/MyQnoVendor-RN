import React, { createRef } from 'react';

/**
 * ToastService — imperative singleton.
 *
 * SETUP (once, in your root component / App.js):
 *   import { CustomToast, ToastService } from './src/components/common';
 *   // Inside your JSX (at the very top-level, outside any ScrollView):
 *   <CustomToast ref={ToastService.toastRef} />
 *
 * USAGE (anywhere in the app):
 *   ToastService.show({ message: 'Done!', type: 'success' });
 *   ToastService.show({ message: 'Oops!', type: 'error', duration: 4000 });
 *   ToastService.show({ message: 'Heads up', type: 'warning' });
 *   ToastService.show({ message: 'FYI', type: 'info' });
 *   ToastService.hide(); // dismiss early
 */
const ToastService = {
  toastRef: createRef(),

  /**
   * @param {{ message: string, type?: 'success'|'error'|'warning'|'info', duration?: number }} options
   */
  show({ message, type = 'info', duration = 3000 }) {
    if (ToastService.toastRef?.current?.show) {
      ToastService.toastRef.current.show({ message, type, duration });
    } else {
      console.warn(
        '[ToastService] Toast ref not attached. Make sure <CustomToast ref={ToastService.toastRef} /> is rendered at the root level.',
      );
    }
  },

  hide() {
    ToastService.toastRef?.current?.hide?.();
  },
};

export default ToastService;
