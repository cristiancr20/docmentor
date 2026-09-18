import '@testing-library/jest-dom/vitest';

// Mock propio de localStorage (sustituye a jest-localstorage-mock): cada método
// es un vi.fn() espiable con un almacén en memoria por debajo, de modo que los
// tests pueden hacer `localStorage.getItem.mockImplementation(...)` y también
// usarlo como almacenamiento real. Se resetea antes de cada test.
const createLocalStorageMock = () => {
  let store = {};
  const mock = {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
  return mock;
};

const localStorageMock = createLocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

beforeEach(() => {
  // Equivalente a `resetMocks: true` de CRA: vacía el almacén y restaura la
  // implementación por defecto de cada vi.fn() (borra mockImplementation
  // y el historial de llamadas).
  localStorageMock.clear();
  for (const fn of [
    localStorageMock.getItem,
    localStorageMock.setItem,
    localStorageMock.removeItem,
    localStorageMock.clear,
    localStorageMock.key,
  ]) {
    fn.mockReset();
  }
});
