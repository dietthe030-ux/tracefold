import '@testing-library/jest-dom';

Object.defineProperty(window, 'scrollTo', { value: () => undefined, writable: true });
