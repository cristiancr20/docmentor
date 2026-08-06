import React, { useState } from "react";
import PropTypes from "prop-types";
import { FileSpreadsheet, FileText, ScrollText } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Select } from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import { PermissionGate } from "../../components/PermissionGate";
import { errorAlert, successAlert } from "../../components/Alerts/Alerts";
import { getAdminAuditLogs, exportAuditReport } from "../../core/Admin";
import { formatDateTime, humanizeAction } from "../../utils/format";

/** Mapea la acción del log al tono del Badge: alta, baja o cambio. */
const toneForAction = (action) => {
  if (!action) return "neutral";
  if (action.includes("CREATE")) return "ok";
  if (action.includes("DELETE") || action.includes("ANONYMIZE")) return "danger";
  if (action.includes("UPDATE") || action.includes("CHANGE")) return "info";
  return "neutral";
};

/** Pestaña de auditoría: últimos 100 registros con filtro por entidad y exportación. */
const AuditTab = ({ auditLogs, setAuditLogs }) => {
  const [auditEntityFilter, setAuditEntityFilter] = useState("all");
  const [exportLoading, setExportLoading] = useState(null);

  const handleAuditFilterChange = async (entityType) => {
    setAuditEntityFilter(entityType);
    try {
      const filters = { pageSize: 100 };
      if (entityType && entityType !== "all") {
        filters.entityType = entityType;
      }
      const logs = await getAdminAuditLogs(filters);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Error filtrando logs de auditoría:", err);
      errorAlert("Error al cargar los logs de auditoría");
    }
  };

  const handleExport = async (format) => {
    try {
      setExportLoading(format);
      const filters = {};
      if (auditEntityFilter !== "all") filters.entityType = auditEntityFilter;
      await exportAuditReport(format, filters);
      successAlert(`Reporte ${format.toUpperCase()} exportado correctamente`);
    } catch (err) {
      console.error("Error exportando reporte:", err);
      errorAlert("Error al exportar el reporte de auditoría");
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <Card padded={false}>
      <div className="flex flex-col gap-4 border-b border-line p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-content">Logs de auditoría</h2>
          <p className="mt-1 text-sm text-muted">Últimos 100 registros del sistema</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Select
            id="audit-entity-filter"
            aria-label="Filtrar por entidad"
            value={auditEntityFilter}
            onChange={(e) => handleAuditFilterChange(e.target.value)}
            className="md:w-52"
          >
            <option value="all">Todas las entidades</option>
            <option value="project">Proyectos</option>
            <option value="document">Documentos</option>
            <option value="user">Usuarios</option>
          </Select>

          <PermissionGate permission="VIEW_AUDIT_LOGS">
            <Button
              variant="secondary"
              onClick={() => handleExport("pdf")}
              disabled={exportLoading !== null}
              loading={exportLoading === "pdf"}
            >
              {exportLoading !== "pdf" && <FileText className="h-4 w-4" strokeWidth={1.8} />}
              Exportar PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={exportLoading !== null}
              loading={exportLoading === "xlsx"}
            >
              {exportLoading !== "xlsx" && (
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.8} />
              )}
              Exportar XLSX
            </Button>
          </PermissionGate>
        </div>
      </div>

      {auditLogs.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={ScrollText}
            title="No hay registros de auditoría"
            description="Cuando ocurran cambios en el sistema aparecerán aquí."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Entidad</th>
                <th className="px-4 py-3 font-medium">ID entidad</th>
                <th className="px-4 py-3 font-medium">ID usuario</th>
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 100).map((log) => (
                <tr
                  key={log.id}
                  className="border-t border-line transition-colors hover:bg-surface-2"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                    {formatDateTime(log.timestamp || log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForAction(log.action)}>{humanizeAction(log.action)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-content">{log.entityType}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{log.entityId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{log.userId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

AuditTab.propTypes = {
  auditLogs: PropTypes.array.isRequired,
  setAuditLogs: PropTypes.func.isRequired,
};

export default AuditTab;
