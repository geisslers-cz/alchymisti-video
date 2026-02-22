import type { MainProcessApi } from '../common';

declare global {
  interface Window {
    main: MainProcessApi;
  }
}
