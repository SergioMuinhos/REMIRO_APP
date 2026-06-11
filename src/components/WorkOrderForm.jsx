import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash, Info, Users, ShieldAlert, Award, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function WorkOrderForm({ initialData, onSave, onBack }) {
  // Setup initial states
  const [header, setHeader] = useState({
    lugarTrabajo: '',
    cliente: '',
    descripcionTrabajo: '',
    proyectoNo: '',
    pagina: '1 de 1',
    fecha: new Date().toISOString().split('T')[0] // Default to today
  });

  // Table rows for parts inspected
  const [rows, setRows] = useState([
    {
      referencia: '',
      loteGuia: '',
      numeroEtiqueta: '',
      fechaProduccion: '',
      cantidadInspeccionada: '',
      cantidadOk: '',
      nokD: [0, 0, 0, 0, 0], // D1 to D5
      rwRW: [0, 0, 0, 0, 0], // RW1 to RW5
      showDefects: false // Toggle section on mobile
    }
  ]);

  // Defect descriptions
  const [defectsDesc, setDefectsDesc] = useState({
    nok: ['', '', '', '', ''],
    rw: ['', '', '', '', '']
  });

  // Supervision & Signatures
  const [signatures, setSignatures] = useState({
    responsableDirecto: '',
    asistenteSupervision: '',
    cliente: '',
    observaciones: ''
  });

  // Workers / Collaborators
  const [workers, setWorkers] = useState([
    {
      codigoColaborador: '',
      horas: '8H',
      nombreTrabajador: '',
      entradaHora: '14',
      entradaMinuto: '00',
      salidaHora: '22',
      salidaMinuto: '00'
    }
  ]);

  // Collapsible sections state
  const [collapsed, setCollapsed] = useState({
    header: false,
    inspections: false,
    defects: true, // Collapsed by default
    workers: false,
    signatures: false
  });

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      if (initialData.header) setHeader({ ...initialData.header });
      if (initialData.rows) setRows(initialData.rows.map(r => ({ ...r, showDefects: false })));
      if (initialData.defectsDesc) setDefectsDesc({ ...initialData.defectsDesc });
      if (initialData.signatures) setSignatures({ ...initialData.signatures });
      if (initialData.workers) setWorkers(initialData.workers.map(w => ({ ...w })));
    }
  }, [initialData]);

  // Toggle sections
  const toggleSection = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Header handlers
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setHeader(prev => ({ ...prev, [name]: value }));
  };

  // Row handlers
  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        referencia: prev[prev.length - 1]?.referencia || '', // Pre-fill with last reference for ease of entry
        loteGuia: '',
        numeroEtiqueta: '',
        fechaProduccion: prev[prev.length - 1]?.fechaProduccion || '',
        cantidadInspeccionada: '',
        cantidadOk: '',
        nokD: [0, 0, 0, 0, 0],
        rwRW: [0, 0, 0, 0, 0],
        showDefects: false
      }
    ]);
  };

  const removeRow = (index) => {
    if (rows.length === 1) return; // Keep at least one row
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setRows(prev => prev.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleRowSubCountChange = (rowIndex, subField, subIndex, value) => {
    setRows(prev => prev.map((row, i) => {
      if (i === rowIndex) {
        const list = [...row[subField]];
        list[subIndex] = Number(value) || 0;
        return { ...row, [subField]: list };
      }
      return row;
    }));
  };

  // Worker handlers
  const addWorker = () => {
    setWorkers(prev => [
      ...prev,
      {
        codigoColaborador: '',
        horas: '8H',
        nombreTrabajador: '',
        entradaHora: '14',
        entradaMinuto: '00',
        salidaHora: '22',
        salidaMinuto: '00'
      }
    ]);
  };

  const removeWorker = (index) => {
    if (workers.length === 1) return;
    setWorkers(prev => prev.filter((_, i) => i !== index));
  };

  const handleWorkerChange = (index, field, value) => {
    setWorkers(prev => prev.map((w, i) => {
      if (i === index) {
        return { ...w, [field]: value };
      }
      return w;
    }));
  };

  // Defects description handlers
  const handleDefectDescChange = (type, index, value) => {
    setDefectsDesc(prev => {
      const list = [...prev[type]];
      list[index] = value;
      return { ...prev, [type]: list };
    });
  };

  // Signature handlers
  const handleSignatureChange = (e) => {
    const { name, value } = e.target;
    setSignatures(prev => ({ ...prev, [name]: value }));
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    // Auto-calculate totals
    let totalRevisado = 0;
    let totalNok = 0;
    let totalRecuperadas = 0;

    rows.forEach(r => {
      totalRevisado += Number(r.cantidadInspeccionada || 0);
      
      // Nok totals is sum of D1 to D5
      const nokSum = r.nokD.reduce((a, b) => a + b, 0);
      // Rework totals is sum of RW1 to RW5
      const rwSum = r.rwRW.reduce((a, b) => a + b, 0);

      // Fallback if user didn't fill D1-D5 but has discrepancy
      const discrepancy = Math.max(0, Number(r.cantidadInspeccionada || 0) - Number(r.cantidadOk || 0));
      
      totalNok += nokSum > 0 ? nokSum : discrepancy;
      totalRecuperadas += rwSum;
    });

    const reportData = {
      id: initialData?.id || Date.now().toString(),
      header,
      rows,
      defectsDesc,
      signatures,
      workers,
      totals: {
        revisado: totalRevisado,
        nok: totalNok,
        recuperadas: totalRecuperadas
      }
    };

    onSave(reportData);
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {/* Form Navigator Header */}
      <div className="form-header">
        <button type="button" className="btn-back" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="section-title">
          {initialData ? 'Editar Parte de Trabajo' : 'Nuevo Parte de Trabajo'}
        </h2>
      </div>

      {/* 1. SECCIÓN CABECERA */}
      <div className="form-section">
        <div className="form-section-title" onClick={() => toggleSection('header')} style={{ cursor: 'pointer', userSelect: 'none' }}>
          <FileText size={18} color="var(--primary)" />
          <span>Datos de Cabecera</span>
          <span style={{ marginLeft: 'auto' }}>
            {collapsed.header ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </span>
        </div>
        
        {!collapsed.header && (
          <div className="form-grid">
            <div className="form-group">
              <label>Lugar de Trabajo</label>
              <input
                type="text"
                name="lugarTrabajo"
                placeholder="Ej. BENTELER VALLADARES"
                className="form-control"
                value={header.lugarTrabajo}
                onChange={handleHeaderChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Cliente</label>
              <input
                type="text"
                name="cliente"
                placeholder="Ej. PSA PEUGEOT"
                className="form-control"
                value={header.cliente}
                onChange={handleHeaderChange}
              />
            </div>
            <div className="form-group">
              <label>Descripción del Trabajo</label>
              <input
                type="text"
                name="descripcionTrabajo"
                placeholder="Ej. REVISIÓN UPPEE SHELL"
                className="form-control"
                value={header.descripcionTrabajo}
                onChange={handleHeaderChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Proyecto Nº</label>
              <input
                type="text"
                name="proyectoNo"
                placeholder="Código del proyecto"
                className="form-control"
                value={header.proyectoNo}
                onChange={handleHeaderChange}
              />
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                name="fecha"
                className="form-control"
                value={header.fecha}
                onChange={handleHeaderChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Página</label>
              <input
                type="text"
                name="pagina"
                className="form-control"
                value={header.pagina}
                onChange={handleHeaderChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. SECCIÓN TABLA DE INSPECCIÓN (FILAS DINÁMICAS) */}
      <div className="form-section">
        <div className="form-section-title" onClick={() => toggleSection('inspections')} style={{ cursor: 'pointer', userSelect: 'none' }}>
          <Info size={18} color="var(--secondary)" />
          <span>Líneas de Inspección ({rows.length})</span>
          <span style={{ marginLeft: 'auto' }}>
            {collapsed.inspections ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </span>
        </div>

        {!collapsed.inspections && (
          <div className="dynamic-list-container">
            {rows.map((row, index) => (
              <div key={index} className="dynamic-card-item">
                <div className="dynamic-card-header">
                  <span className="item-index">Línea #{index + 1}</span>
                  {rows.length > 1 && (
                    <button type="button" className="btn-remove-row" onClick={() => removeRow(index)}>
                      <Trash size={16} />
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Referencia</label>
                    <input
                      type="text"
                      placeholder="Ej. 90093093"
                      className="form-control"
                      value={row.referencia}
                      onChange={(e) => handleRowChange(index, 'referencia', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Lote / Guía</label>
                    <input
                      type="text"
                      placeholder="Lote"
                      className="form-control"
                      value={row.loteGuia}
                      onChange={(e) => handleRowChange(index, 'loteGuia', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nº Etiqueta</label>
                    <input
                      type="text"
                      placeholder="Ej. 1993587"
                      className="form-control"
                      value={row.numeroEtiqueta}
                      onChange={(e) => handleRowChange(index, 'numeroEtiqueta', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Producción</label>
                    <input
                      type="date"
                      className="form-control"
                      value={row.fechaProduccion}
                      onChange={(e) => handleRowChange(index, 'fechaProduccion', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Cant. Inspeccionada</label>
                    <input
                      type="number"
                      placeholder="90"
                      className="form-control"
                      value={row.cantidadInspeccionada}
                      onChange={(e) => handleRowChange(index, 'cantidadInspeccionada', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cantidad OK</label>
                    <input
                      type="number"
                      placeholder="90"
                      className="form-control"
                      value={row.cantidadOk}
                      onChange={(e) => handleRowChange(index, 'cantidadOk', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Sub-counts toggle button */}
                <button
                  type="button"
                  className="btn-add-row"
                  style={{ fontSize: '0.75rem', padding: '6px', borderStyle: 'solid', borderColor: 'var(--border-ui)', color: 'var(--text-main)' }}
                  onClick={() => handleRowChange(index, 'showDefects', !row.showDefects)}
                >
                  {row.showDefects ? 'Ocultar Defectos D/RW' : 'Especificar Defectos (D1-D5 / RW1-RW5)'}
                </button>

                {row.showDefects && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-nok)', fontWeight: '600', textTransform: 'uppercase' }}>
                        Defectos NOK (D1 a D5)
                      </span>
                      <div className="grid-cols-5" style={{ marginTop: '4px' }}>
                        {row.nokD.map((val, idx) => (
                          <div key={idx} className="form-group">
                            <label style={{ fontSize: '0.6rem', textAlign: 'center' }}>D{idx+1}</label>
                            <input
                              type="number"
                              className="form-control"
                              style={{ padding: '6px', textAlign: 'center' }}
                              value={val || ''}
                              onChange={(e) => handleRowSubCountChange(index, 'nokD', idx, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-rw)', fontWeight: '600', textTransform: 'uppercase' }}>
                        Defectos Retrabajados (RW1 a RW5)
                      </span>
                      <div className="grid-cols-5" style={{ marginTop: '4px' }}>
                        {row.rwRW.map((val, idx) => (
                          <div key={idx} className="form-group">
                            <label style={{ fontSize: '0.6rem', textAlign: 'center' }}>RW{idx+1}</label>
                            <input
                              type="number"
                              className="form-control"
                              style={{ padding: '6px', textAlign: 'center' }}
                              value={val || ''}
                              onChange={(e) => handleRowSubCountChange(index, 'rwRW', idx, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button type="button" className="btn-add-row" onClick={addRow}>
              <Plus size={16} />
              <span>Añadir Referencia/Línea</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. SECCIÓN DESCRIPCIÓN DE DEFECTOS (D1-D5, RW1-RW5) */}
      <div className="form-section">
        <div className="form-section-title" onClick={() => toggleSection('defects')} style={{ cursor: 'pointer', userSelect: 'none' }}>
          <ShieldAlert size={18} color="var(--color-rw)" />
          <span>Configurar Textos Defectos (D1-D5 / RW1-RW5)</span>
          <span style={{ marginLeft: 'auto' }}>
            {collapsed.defects ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </span>
        </div>

        {!collapsed.defects && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-nok)', marginBottom: '8px' }}>Descripciones de Defecto NOK</h4>
              <div className="form-grid single" style={{ gap: '10px' }}>
                {defectsDesc.nok.map((desc, idx) => (
                  <div key={idx} className="grid-time-duration" style={{ gridTemplateColumns: '40px 1fr', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>D#{idx+1}:</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Descripción del defecto NOK #${idx+1}`}
                      value={desc}
                      onChange={(e) => handleDefectDescChange('nok', idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-ui)' }} />

            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--color-rw)', marginBottom: '8px' }}>Descripciones de Defecto Retrabajado</h4>
              <div className="form-grid single" style={{ gap: '10px' }}>
                {defectsDesc.rw.map((desc, idx) => (
                  <div key={idx} className="grid-time-duration" style={{ gridTemplateColumns: '40px 1fr', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>RW#{idx+1}:</span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Descripción del defecto Retrabajado #${idx+1}`}
                      value={desc}
                      onChange={(e) => handleDefectDescChange('rw', idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SECCIÓN TRABAJADORES / COLABORADORES */}
      <div className="form-section">
        <div className="form-section-title" onClick={() => toggleSection('workers')} style={{ cursor: 'pointer', userSelect: 'none' }}>
          <Users size={18} color="var(--color-ok)" />
          <span>Fichaje de Trabajadores ({workers.length})</span>
          <span style={{ marginLeft: 'auto' }}>
            {collapsed.workers ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </span>
        </div>

        {!collapsed.workers && (
          <div className="dynamic-list-container">
            {workers.map((worker, index) => (
              <div key={index} className="dynamic-card-item" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <div className="dynamic-card-header">
                  <span className="item-index" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-ok)' }}>
                    Trabajador #{index + 1}
                  </span>
                  {workers.length > 1 && (
                    <button type="button" className="btn-remove-row" onClick={() => removeWorker(index)}>
                      <Trash size={16} />
                    </button>
                  )}
                </div>

                <div className="form-grid single" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label>Nombre del Trabajador</label>
                    <input
                      type="text"
                      placeholder="Ej. PABLO REMIRO"
                      className="form-control"
                      value={worker.nombreTrabajador}
                      onChange={(e) => handleWorkerChange(index, 'nombreTrabajador', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid-time-duration">
                    <div className="form-group">
                      <label>Cód. Colab.</label>
                      <input
                        type="text"
                        placeholder="Ej. 104"
                        className="form-control"
                        value={worker.codigoColaborador}
                        onChange={(e) => handleWorkerChange(index, 'codigoColaborador', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Entrada (HH:MM)</label>
                      <div className="time-inputs">
                        <select 
                          className="form-control" 
                          style={{ padding: '8px' }}
                          value={worker.entradaHora}
                          onChange={(e) => handleWorkerChange(index, 'entradaHora', e.target.value)}
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <span className="time-sep">:</span>
                        <select 
                          className="form-control" 
                          style={{ padding: '8px' }}
                          value={worker.entradaMinuto}
                          onChange={(e) => handleWorkerChange(index, 'entradaMinuto', e.target.value)}
                        >
                          {['00', '15', '30', '45'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Salida (HH:MM)</label>
                      <div className="time-inputs">
                        <select 
                          className="form-control" 
                          style={{ padding: '8px' }}
                          value={worker.salidaHora}
                          onChange={(e) => handleWorkerChange(index, 'salidaHora', e.target.value)}
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <span className="time-sep">:</span>
                        <select 
                          className="form-control" 
                          style={{ padding: '8px' }}
                          value={worker.salidaMinuto}
                          onChange={(e) => handleWorkerChange(index, 'salidaMinuto', e.target.value)}
                        >
                          {['00', '15', '30', '45'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Horas Totales (ej: 8H)</label>
                    <input
                      type="text"
                      placeholder="8H"
                      className="form-control"
                      value={worker.horas}
                      onChange={(e) => handleWorkerChange(index, 'horas', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn-add-row" style={{ borderColor: 'var(--color-ok)', color: 'var(--color-ok)' }} onClick={addWorker}>
              <Plus size={16} />
              <span>Añadir Fichaje Trabajador</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. SECCIÓN RESPONSABLES, FIRMAS U OBSERVACIONES */}
      <div className="form-section">
        <div className="form-section-title" onClick={() => toggleSection('signatures')} style={{ cursor: 'pointer', userSelect: 'none' }}>
          <Award size={18} color="var(--text-light)" />
          <span>Responsables y Observaciones</span>
          <span style={{ marginLeft: 'auto' }}>
            {collapsed.signatures ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </span>
        </div>

        {!collapsed.signatures && (
          <div className="form-grid single" style={{ gap: '16px' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Responsable Directo</label>
                <input
                  type="text"
                  name="responsableDirecto"
                  placeholder="Nombre responsable"
                  className="form-control"
                  value={signatures.responsableDirecto}
                  onChange={handleSignatureChange}
                />
              </div>
              <div className="form-group">
                <label>Asistente de Supervisión</label>
                <input
                  type="text"
                  name="asistenteSupervision"
                  placeholder="Nombre supervisor"
                  className="form-control"
                  value={signatures.asistenteSupervision}
                  onChange={handleSignatureChange}
                />
              </div>
              <div className="form-group">
                <label>Cliente (Firma/Nombre)</label>
                <input
                  type="text"
                  name="cliente"
                  placeholder="Firma/Nombre cliente"
                  className="form-control"
                  value={signatures.cliente}
                  onChange={handleSignatureChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Observaciones / Notas Libres</label>
              <textarea
                name="observaciones"
                rows="3"
                placeholder="Ej. Hugo ( Amarillo ) ; Pablo ( Verde )"
                className="form-control"
                value={signatures.observaciones}
                onChange={handleSignatureChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Submission Actions */}
      <div className="form-actions">
        <button type="submit" className="btn-submit">
          <span>Guardar y Generar Ficha</span>
        </button>
      </div>
    </form>
  );
}
