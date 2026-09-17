import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Mail, Save } from "lucide-react";
import Card, { CardHeader } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input, { Select } from "../../components/ui/Input";
import { PermissionGate } from "../../components/PermissionGate";
import { errorAlert, successAlert } from "../../components/Alerts/Alerts";
import { getSettings, createSetting, updateSetting, setActualEmail } from "../../core/Admin";

/** Pestaña de configuración: correos SMTP, retención de logs y respaldos. */
const SettingsTab = ({ settings, setSettings }) => {
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [retentionDays, setRetentionDays] = useState(1825);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("Semanal");
  const [configSaving, setConfigSaving] = useState(false);

  // El primer registro de settings guarda la configuración global; los campos se
  // resincronizan cada vez que la lista cambia (carga inicial y tras guardar).
  useEffect(() => {
    const configRecord = settings[0];
    if (!configRecord) return;

    const attrs = configRecord.attributes || {};
    if (attrs.audit_log_retention_days) {
      setRetentionDays(attrs.audit_log_retention_days);
    }
    if (attrs.backup_enabled !== null && attrs.backup_enabled !== undefined) {
      setBackupEnabled(attrs.backup_enabled);
    }
    if (attrs.backup_frequency) {
      setBackupFrequency(attrs.backup_frequency);
    }
  }, [settings]);

  const handleSaveSmtpEmail = async (e) => {
    e.preventDefault();
    if (!smtpEmail) return;

    try {
      setSmtpSaving(true);
      await createSetting({ email_notifications: smtpEmail });
      successAlert("Email creado correctamente");
      setSmtpEmail("");
      const refreshed = await getSettings();
      setSettings(refreshed);
    } catch (err) {
      console.error("Error creando email SMTP:", err);
      errorAlert("Error al guardar el correo");
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSetActualEmail = async (emailId) => {
    try {
      await setActualEmail(settings, emailId);
      setSettings((prev) =>
        prev.map((s) => ({
          ...s,
          attributes: { ...s.attributes, isActual: s.id === emailId },
        }))
      );
      successAlert("Email actualizado correctamente");
    } catch (err) {
      console.error("Error actualizando email actual:", err);
      errorAlert("Error al actualizar el correo");
    }
  };

  const handleSaveConfig = async () => {
    if (retentionDays < 1825) {
      errorAlert("La retención mínima es de 1825 días (5 años) por normativa");
      return;
    }

    try {
      setConfigSaving(true);
      const configData = {
        audit_log_retention_days: parseInt(retentionDays),
        backup_enabled: backupEnabled,
        backup_frequency: backupFrequency,
      };

      const configRecord = settings[0];
      if (configRecord) {
        await updateSetting(configRecord.id, configData);
      } else {
        await createSetting(configData);
      }
      successAlert("Configuración guardada correctamente");
      const refreshed = await getSettings();
      setSettings(refreshed);
    } catch (err) {
      console.error("Error guardando configuración:", err);
      errorAlert("Error al guardar la configuración");
    } finally {
      setConfigSaving(false);
    }
  };

  const smtpEmails = settings.filter((s) => s.attributes?.email_notifications);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2" padded={false}>
        <div className="p-6">
          <CardHeader
            title="Configuración de correo (SMTP)"
            description="Correos desde los que se envían las notificaciones del sistema."
          />

          <form onSubmit={handleSaveSmtpEmail} className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <Input
                id="smtp-email"
                label="Nuevo correo"
                type="email"
                placeholder="correo@ejemplo.com"
                value={smtpEmail}
                onChange={(e) => setSmtpEmail(e.target.value)}
              />
            </div>
            <Button type="submit" loading={smtpSaving}>
              {!smtpSaving && <Mail className="h-4 w-4" strokeWidth={1.8} />}
              {smtpSaving ? "Guardando…" : "Agregar correo"}
            </Button>
          </form>
        </div>

        {smtpEmails.length > 0 ? (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Correo electrónico</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {smtpEmails.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-line transition-colors hover:bg-surface-2"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-content">
                      {s.attributes.email_notifications}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={s.attributes.isActual ? "ok" : "neutral"}>
                        {s.attributes.isActual ? "En uso" : "No en uso"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.attributes.isActual ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetActualEmail(s.id)}
                        >
                          Volver actual
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="border-t border-line px-6 py-5 text-sm text-muted">
            No hay correos registrados.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Retención de datos" />
        <Input
          id="retention-days"
          label="Días de retención de logs de auditoría"
          type="number"
          min={1825}
          value={retentionDays}
          onChange={(e) => setRetentionDays(e.target.value)}
          hint="Mínimo 1825 días (5 años) por normativa de auditoría."
        />
      </Card>

      <Card>
        <CardHeader title="Respaldo (backup)" />
        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-content">
            <input
              type="checkbox"
              checked={backupEnabled}
              onChange={(e) => setBackupEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-accent"
            />
            Respaldos automáticos habilitados
          </label>

          <Select
            id="backup-frequency"
            label="Frecuencia de respaldo"
            value={backupFrequency}
            onChange={(e) => setBackupFrequency(e.target.value)}
            disabled={!backupEnabled}
          >
            <option value="Diario">Diario</option>
            <option value="Semanal">Semanal</option>
            <option value="Mensual">Mensual</option>
          </Select>
        </div>
      </Card>

      <div className="lg:col-span-2">
        <PermissionGate permission="MANAGE_SETTINGS">
          <Button onClick={handleSaveConfig} loading={configSaving} size="lg">
            {!configSaving && <Save className="h-4 w-4" strokeWidth={1.8} />}
            {configSaving ? "Guardando…" : "Guardar configuración"}
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
};

SettingsTab.propTypes = {
  settings: PropTypes.array.isRequired,
  setSettings: PropTypes.func.isRequired,
};

export default SettingsTab;
