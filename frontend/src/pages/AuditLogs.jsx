import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonRows } from "../components/ui/Skeleton";
import AccessDenied from "../components/AccessDenied";
import { usePermission } from "../context/PermissionContext";
import { getAuditLogs } from "../core/Audit";
import { formatDateTime, humanizeAction } from "../utils/format";

/** Tono del Badge según la acción registrada. */
const toneForAction = (action) => {
  switch (action) {
    case "create":
      return "ok";
    case "update":
      return "info";
    case "delete":
      return "danger";
    case "change_status":
      return "accent";
    case "anonymize":
      return "warn";
    default:
      return "neutral";
  }
};

/** Serializa el valor guardado en el log, que puede llegar como string o como objeto. */
const stringifyValue = (value) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

function AuditLogs() {
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermission();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        pageSize: 50,
      };

      if (filterEntityType !== "all") {
        filters.entityType = filterEntityType;
      }

      const response = await getAuditLogs(filters);
      setAuditLogs(response.data || []);
      // El controller responde { data, pagination }, no el { meta: { pagination } }
      // que devuelven los endpoints estándar de Strapi.
      setTotalPages(response.pagination?.pageCount || 1);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterEntityType]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  if (!permissionsLoading && !hasPermission("VIEW_AUDIT_LOGS")) {
    return (
      <AppLayout title="Registros de auditoría">
        <AccessDenied />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Registros de auditoría"
      description="Historial de cambios en proyectos y documentos."
      actions={
        <Button variant="secondary" onClick={() => navigate("/coordinator/dashboard")}>
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Volver
        </Button>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-line bg-danger-wash px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.8} />
          {error}
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Select
            id="audit-entity-type"
            label="Tipo de entidad"
            value={filterEntityType}
            onChange={(e) => {
              setFilterEntityType(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="project">Proyectos</option>
            <option value="document">Documentos</option>
            <option value="user">Usuarios</option>
          </Select>
        </div>
      </Card>

      <Card padded={false}>
        {loading ? (
          <div className="p-6">
            <SkeletonRows count={6} />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ScrollText}
              title="No hay registros de auditoría"
              description="Cuando se registren cambios en proyectos o documentos aparecerán aquí."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                    <th className="px-4 py-3 font-medium">Entidad</th>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {/* El endpoint de auditoría devuelve registros planos, no el
                      envoltorio { id, attributes } de Strapi. Leerlos como
                      `log.attributes.x` rompía la página en cuanto había un
                      registro. */}
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-line align-top transition-colors hover:bg-surface-2"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={toneForAction(log.action)}>{humanizeAction(log.action)}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-content">{log.entityType}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted">ID: {log.entityId}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {log.userId || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <details>
                          <summary className="cursor-pointer list-none text-sm font-medium text-accent">
                            Ver cambios
                          </summary>
                          <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-surface-2 p-3 text-xs text-muted">
                            {log.oldValue && (
                              <div className="mb-2">
                                <p className="font-medium text-content">Anterior:</p>
                                <pre className="whitespace-pre-wrap break-words font-mono">
                                  {stringifyValue(log.oldValue)}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div>
                                <p className="font-medium text-content">Nuevo:</p>
                                <pre className="whitespace-pre-wrap break-words font-mono">
                                  {stringifyValue(log.newValue)}
                                </pre>
                              </div>
                            )}
                            {!log.oldValue && !log.newValue && <p>Sin detalles registrados.</p>}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4">
              <p className="text-sm text-muted">
                Página <span className="tabular text-content">{currentPage}</span> de{" "}
                <span className="tabular text-content">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </AppLayout>
  );
}

export default AuditLogs;
