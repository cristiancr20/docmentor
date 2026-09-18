// Contrato de las consultas de lista: cada llamada pide solo las relaciones
// que leen sus consumidores (ver notes de US-006). Si alguien vuelve a poner
// `populate=*` o quita una relación que sí se usa, estos tests avisan.
import api from '../apiClient';
import { getDocumentsByProjectId } from '../Document';
import { getProjectById } from '../Projects';

vi.mock('../apiClient', () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

beforeEach(() => {
  api.get.mockReset();
  api.get.mockResolvedValue({ data: { data: [] } });
});

describe('getDocumentsByProjectId', () => {
  it('por defecto no pobla relaciones (dashboards y selector de versiones)', async () => {
    await getDocumentsByProjectId(6);

    expect(api.get).toHaveBeenCalledWith('/api/documents', {
      params: { 'filters[project][id][$eq]': 6 },
    });
  });

  it('con withRelations pide solo archivo, versión de origen y comentarios', async () => {
    await getDocumentsByProjectId(6, { withRelations: true });

    const [, config] = api.get.mock.calls[0];
    expect(config.params).toEqual({
      'filters[project][id][$eq]': 6,
      'populate[documentFile][fields][0]': 'url',
      'populate[restoredFrom][fields][0]': 'version',
      'populate[comments][fields][0]': 'correction',
      'populate[comments][fields][1]': 'quote',
    });
    expect(Object.keys(config.params)).not.toContain('populate');
  });

  it('devuelve el cuerpo de la respuesta', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 1 }] } });

    await expect(getDocumentsByProjectId(6)).resolves.toEqual({ data: [{ id: 1 }] });
  });
});

describe('getProjectById', () => {
  it('pide solo nombre y correo de tutor y estudiantes', async () => {
    api.get.mockResolvedValue({ data: { data: { id: 6 } } });

    await expect(getProjectById(6)).resolves.toEqual({ id: 6 });

    expect(api.get).toHaveBeenCalledWith('/api/projects/6', {
      params: {
        'populate[tutor][fields][0]': 'username',
        'populate[tutor][fields][1]': 'email',
        'populate[students][fields][0]': 'username',
        'populate[students][fields][1]': 'email',
      },
    });
  });
});
