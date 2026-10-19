import { useEffect, useState } from "react";

const formularioInicial = {
  motivo: "",
  diagnostico: "",
  tratamiento: "",
  observaciones: "",
};

export default function FormularioConsulta({
  cita,
  onGuardar,
  onCancelar,
  guardando = false,
}) {
  const [datos, setDatos] = useState(formularioInicial);
  const [error, setError] = useState("");

  useEffect(() => {
    setDatos(formularioInicial);
    setError("");
  }, [cita?.id]);

  function actualizarCampo(e) {
    const { name, value } = e.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError("");

    if (!cita?.id) {
      setError("Selecciona una cita antes de registrar la consulta.");
      return;
    }

    if (!datos.diagnostico.trim()) {
      setError("Ingresa el diagnóstico de la consulta.");
      return;
    }

    try {
      await onGuardar?.({
        cita_id: cita.id,
        motivo: datos.motivo.trim(),
        diagnostico: datos.diagnostico.trim(),
        tratamiento: datos.tratamiento.trim(),
        observaciones: datos.observaciones.trim(),
      });
    } catch (err) {
      setError(err?.message || "No se pudo guardar la consulta.");
    }
  }

  return (
    <form className="formulario-consulta" onSubmit={manejarEnvio}>
      <div className="form-section-heading">
        <h2>Registrar consulta</h2>
        <p>
          Paciente:{" "}
          <strong>
            {cita?.paciente?.nombre_completo ||
              cita?.nombre_paciente ||
              "No seleccionado"}
          </strong>
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="motivo">Motivo de consulta</label>
        <input
          id="motivo"
          name="motivo"
          value={datos.motivo}
          onChange={actualizarCampo}
          placeholder="Motivo de la atención"
        />
      </div>

      <div className="form-field">
        <label htmlFor="diagnostico">
          Diagnóstico <span className="required-mark">*</span>
        </label>
        <textarea
          id="diagnostico"
          name="diagnostico"
          rows={4}
          value={datos.diagnostico}
          onChange={actualizarCampo}
          placeholder="Describe el diagnóstico..."
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="tratamiento">Tratamiento indicado</label>
        <textarea
          id="tratamiento"
          name="tratamiento"
          rows={3}
          value={datos.tratamiento}
          onChange={actualizarCampo}
          placeholder="Tratamiento o indicaciones..."
        />
      </div>

      <div className="form-field">
        <label htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows={3}
          value={datos.observaciones}
          onChange={actualizarCampo}
          placeholder="Notas adicionales..."
        />
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        {onCancelar && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={guardando || !cita?.id}
        >
          {guardando ? "Guardando..." : "Guardar consulta"}
        </button>
      </div>
    </form>
  );
}
