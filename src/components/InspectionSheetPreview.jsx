import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, Loader } from 'lucide-react';

export default function InspectionSheetPreview({ report, onDownloadComplete }) {
  const offscreenRef = useRef(null);
  const previewRef = useRef(null);
  const [scale, setScale] = useState(0.25);
  const [isExporting, setIsExporting] = useState(false);

  // Pad main table rows to exactly 20 items (Excel Rows 10 to 29)
  const paddedRows = React.useMemo(() => {
    const original = report.rows || [];
    const targetLength = 20;
    const result = [...original];
    
    for (let i = original.length; i < targetLength; i++) {
      result.push({
        referencia: '',
        loteGuia: '',
        numeroEtiqueta: '',
        fechaProduccion: '',
        cantidadInspeccionada: '',
        cantidadOk: '',
        nokD: ['', '', '', '', ''],
        rwRW: ['', '', '', '', '']
      });
    }
    return result;
  }, [report.rows]);

  // Pad workers to exactly 7 rows (Excel Rows 37 to 43)
  const paddedWorkers = React.useMemo(() => {
    const original = report.workers || [];
    const targetLength = 7;
    const result = [...original];
    
    for (let i = original.length; i < targetLength; i++) {
      result.push({
        codigoColaborador: '',
        horas: '',
        nombreTrabajador: '',
        entradaHora: '',
        entradaMinuto: '',
        salidaHora: '',
        salidaMinuto: ''
      });
    }
    return result;
  }, [report.workers]);

  // Auto-scale the visible preview to fit the parent container's width
  useEffect(() => {
    const handleResize = () => {
      const wrapper = document.querySelector('.sheet-preview-wrapper');
      if (wrapper) {
        const wrapperWidth = wrapper.clientWidth - 32; // padding
        const newScale = Math.min(1, wrapperWidth / 1200);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [report]);

  // Handle high quality JPG generation and download
  const handleDownloadJpg = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 150));

      const captureElement = offscreenRef.current;
      if (!captureElement) {
        throw new Error('Elemento de captura no disponible');
      }

      const canvas = await html2canvas(captureElement, {
        scale: 2.5, // High resolution output
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      const link = document.createElement('a');
      const filename = `Parte_${report.header.lugarTrabajo.replace(/\s+/g, '_')}_${report.header.fecha}.jpg`;
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (error) {
      console.error('Error al generar la imagen:', error);
      alert('Error al generar la imagen JPG. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatSheetDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch(e) {}
    return dateStr;
  };

  // Helper to format worker time. Displays HH:MM if set, or ':' if empty, matching Excel default
  const formatWorkerTime = (hour, minute) => {
    if (hour && minute) {
      return `${hour}:${minute}`;
    }
    return ':';
  };

  const renderSheetMarkup = () => {
    return (
      <div className="ef-sheet">
        {/* 1. Header Row (Excel Rows 1-4) */}
        <table className="sheet-header-table">
          <tbody>
            <tr>
              <td className="logo-cell border-double-l border-double-t border-double-b">
                <span style={{ fontWeight: '800' }}>Exact</span>
                <span className="cross">×</span>
                <span style={{ fontWeight: '800' }}>Forestall</span>
              </td>
              <td className="title-cell border-double-t border-double-b">Hoja de inspección</td>
              <td className="x-cell border-double-r border-double-t border-double-b">✕</td>
            </tr>
          </tbody>
        </table>

        {/* 2. Metadata Block (Excel Rows 5-7) */}
        <table className="sheet-meta-table">
          <tbody>
            <tr>
              <td className="border-double-l" style={{ width: '40%' }}>
                <span className="meta-label">Lugar de trabajo</span>
                <span className="meta-value">{report.header.lugarTrabajo}</span>
              </td>
              <td style={{ width: '35%' }}>
                <span className="meta-label">Cliente</span>
                <span className="meta-value">{report.header.cliente}</span>
              </td>
              <td className="border-double-l" style={{ width: '10%' }}>
                <span className="meta-label">Proyecto Nº</span>
                <span className="meta-value">{report.header.proyectoNo}</span>
              </td>
              <td style={{ width: '7%' }}>
                <span className="meta-label">Página</span>
                <span className="meta-value">{report.header.pagina}</span>
              </td>
              <td className="border-double-r" style={{ width: '8%' }}>
                <span className="meta-label">Fecha</span>
                <span className="meta-value">{formatSheetDate(report.header.fecha)}</span>
              </td>
            </tr>
            <tr>
              <td className="border-double-l border-double-b" colSpan={2} style={{ height: '22px' }}>
                <span className="meta-label">Descripción del trabajo</span>
                <span className="meta-value">{report.header.descripcionTrabajo}</span>
              </td>
              <td className="border-double-r border-double-b border-double-l" colSpan={3} style={{ height: '22px' }}>
                <span className="meta-label">Fecha de Registro</span>
                <span className="meta-value">{formatSheetDate(report.header.fecha)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. Main Inspection Grid Table (Excel Rows 8-29) */}
        <table className="sheet-main-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-ref border-double-l border-double-t">Referencia</th>
              <th rowSpan={2} className="col-lote border-double-t">Lote/Guia de envio</th>
              <th rowSpan={2} className="col-etiqueta border-double-t">Número de etiqueta</th>
              <th rowSpan={2} className="col-fecha border-double-t" colSpan={2}>Fecha de producción</th>
              <th rowSpan={2} className="col-cant border-double-l border-double-t" colSpan={2}>Cantidad</th>
              <th rowSpan={2} className="col-ok border-double-r border-double-t" colSpan={2}>Cantidad OK</th>
              <th colSpan={5} className="border-double-r border-double-t" style={{ fontSize: '5.5px', padding: '1px' }}>Cantidad NOK</th>
              <th colSpan={5} className="border-double-r border-double-t" style={{ fontSize: '5.5px', padding: '1px' }}>Cantidad Retrabajada</th>
            </tr>
            <tr>
              <th className="border-double-l" style={{ fontSize: '6px', padding: '2px 0' }}>inspeccionada</th> {/* F9 label */}
              <th className="border-double-r" style={{ fontSize: '6px', padding: '2px 0' }}></th> {/* placeholder for colspan alignment */}
              <th className="col-nok-sub">D1</th>
              <th className="col-nok-sub">D2</th>
              <th className="col-nok-sub">D3</th>
              <th className="col-nok-sub">D4</th>
              <th className="col-nok-sub border-double-r">D5</th>
              <th className="col-rw-sub">RW1</th>
              <th className="col-rw-sub">RW2</th>
              <th className="col-rw-sub">RW3</th>
              <th className="col-rw-sub">RW4</th>
              <th className="col-rw-sub border-double-r">RW5</th>
            </tr>
          </thead>
          <tbody>
            {paddedRows.map((row, idx) => {
              const bottomClass = idx === 19 ? 'border-double-b' : '';
              return (
                <tr key={idx}>
                  <td className={`col-ref border-double-l font-bold text-left ${bottomClass}`} style={{ paddingLeft: '5px' }}>{row.referencia}</td>
                  <td className={`col-lote ${bottomClass}`}>{row.loteGuia}</td>
                  <td className={`col-etiqueta font-bold ${bottomClass}`}>{row.numeroEtiqueta}</td>
                  <td className={`col-fecha ${bottomClass}`} colSpan={2}>{formatSheetDate(row.fechaProduccion)}</td>
                  <td className={`col-cant font-bold border-double-l ${bottomClass}`} colSpan={2}>{row.cantidadInspeccionada}</td>
                  <td className={`col-ok border-double-r font-bold ${bottomClass}`} colSpan={2}>{row.cantidadOk}</td>
                  
                  {/* NOK D1 to D5 Cells */}
                  {row.nokD.map((dVal, dIdx) => (
                    <td 
                      key={`d-${dIdx}`} 
                      className={`${dIdx === 4 ? 'border-double-r' : ''} ${bottomClass}`}
                      style={{ color: dVal ? '#ef4444' : '#000', fontWeight: dVal ? 'bold' : 'normal' }}
                    >
                      {dVal || ''}
                    </td>
                  ))}
                  
                  {/* RW1 to RW5 Cells */}
                  {row.rwRW.map((rwVal, rwIdx) => (
                    <td 
                      key={`rw-${rwIdx}`} 
                      className={`${rwIdx === 4 ? 'border-double-r' : ''} ${bottomClass}`}
                      style={{ color: rwVal ? '#f59e0b' : '#000', fontWeight: rwVal ? 'bold' : 'normal' }}
                    >
                      {rwVal || ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 4. Bottom Layout: Split side-by-side with exact spacing and row heights */}
        <div className="sheet-bottom-layout">
          {/* Left Column (5 NOK defects, 3 Supervision rows, 5 Observaciones rows, 1 TOTAL row = 14 rows total) */}
          <div className="sheet-bottom-left">
            <table className="sheet-defects-table-nok">
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="defect-label border-double-l">Descripción del defecto NOK #{idx+1}</td>
                    <td className="defect-value border-double-r">{report.defectsDesc?.nok?.[idx] || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="sheet-staff-table">
              <tbody>
                <tr>
                  <td className="border-double-l" style={{ width: '30%', color: '#555', fontSize: '6px' }}>Responsable directo:</td>
                  <td className="border-double-r" style={{ width: '70%', fontWeight: '700' }}>{report.signatures?.responsableDirecto}</td>
                </tr>
                <tr>
                  <td className="border-double-l" style={{ color: '#555', fontSize: '6px' }}>Asistente de supervisión:</td>
                  <td className="border-double-r" style={{ fontWeight: '700' }}>{report.signatures?.asistenteSupervision}</td>
                </tr>
                <tr>
                  <td className="border-double-l" style={{ color: '#555', fontSize: '6px' }}>Cliente:</td>
                  <td className="border-double-r" style={{ fontWeight: '700' }}>{report.signatures?.cliente}</td>
                </tr>
              </tbody>
            </table>

            <div className="sheet-obs-box">
              <div className="sheet-obs-label">Observaciones:</div>
              <div className="sheet-obs-content">{report.signatures?.observaciones}</div>
            </div>

            {/* TOTAL Row (Aligned with Row 43 on the right) */}
            <div className="sheet-total-box">
              TOTAL REVISADO: {report.totals?.revisado || 0} PIEZAS // TOTAL NOK: {report.totals?.nok || 0} PIEZAS // TOTAL RECUPERADAS: {report.totals?.recuperadas || 0} PIEZAS
            </div>
          </div>

          {/* Right Column (5 RW defects, 2 Collab headers, 7 Collab data rows = 14 rows total) */}
          <div className="sheet-bottom-right">
            <table className="sheet-defects-table-rw">
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="defect-label border-double-l">Descripción del defecto Retrabajado #{idx+1}</td>
                    <td className="defect-value border-double-r">{report.defectsDesc?.rw?.[idx] || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="sheet-collab-table">
              <thead>
                <tr>
                  <th className="collab-col-code border-double-l" rowSpan={2} colSpan={2}>Código de colaborador</th>
                  <th className="collab-col-hours" rowSpan={2}>Horas</th>
                  <th className="collab-col-name" rowSpan={2} colSpan={7}>Nombre legible del trabajador:</th>
                  <th className="collab-col-time" colSpan={2}>Entrada</th>
                  <th className="collab-col-time border-double-r" colSpan={2}>Salida</th>
                </tr>
                <tr>
                  <th style={{ fontSize: '5.5px', padding: '1px' }}>Hora</th>
                  <th style={{ fontSize: '5.5px', padding: '1px' }}>Minutos</th>
                  <th style={{ fontSize: '5.5px', padding: '1px' }}>Hora</th>
                  <th className="border-double-r" style={{ fontSize: '5.5px', padding: '1px' }}>Minutos</th>
                </tr>
              </thead>
              <tbody>
                {paddedWorkers.map((worker, wIdx) => {
                  const hasWorker = worker.nombreTrabajador;
                  const bottomClass = wIdx === 6 ? 'border-double-b' : '';
                  return (
                    <tr key={wIdx}>
                      <td className={`font-bold border-double-l ${bottomClass}`} colSpan={2}>
                        {worker.codigoColaborador || ''}
                      </td>
                      <td className={`font-bold ${bottomClass}`}>
                        {worker.horas || ''}
                      </td>
                      <td className={`text-left font-bold ${bottomClass}`} colSpan={7} style={{ paddingLeft: '6px' }}>
                        {worker.nombreTrabajador || ''}
                      </td>
                      
                      {/* Entrada (HH:MM / :) */}
                      <td className={`font-bold ${bottomClass}`} colSpan={2}>
                        {formatWorkerTime(worker.entradaHora, worker.entradaMinuto)}
                      </td>
                      
                      {/* Salida (HH:MM / :) */}
                      <td className={`font-bold border-double-r ${bottomClass}`} colSpan={2}>
                        {formatWorkerTime(worker.salidaHora, worker.salidaMinuto)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Footer Page Row (Row 44) */}
        <div className="sheet-footer-row border-double-l border-double-r border-double-b">
          <div className="sheet-footer-code">
            SGQ-DOP-F010, 2025 V5R
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="offscreen-container">
        <div ref={offscreenRef}>
          {renderSheetMarkup()}
        </div>
      </div>

      <div className="sheet-preview-wrapper">
        <div 
          ref={previewRef}
          className="scaled-preview-container"
          style={{ 
            width: '1200px', 
            height: '848px', 
            transform: `scale(${scale})`,
            marginBottom: `-${848 * (1 - scale)}px`, 
            marginRight: `-${1200 * (1 - scale)}px` 
          }}
        >
          {renderSheetMarkup()}
        </div>
      </div>

      <button 
        type="button" 
        className="btn-action-modal download w-full"
        onClick={handleDownloadJpg}
        disabled={isExporting}
        style={{ marginTop: '16px' }}
      >
        {isExporting ? (
          <>
            <Loader size={18} className="animate-spin" />
            <span>Generando Imagen JPG...</span>
          </>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} />
            <span>Descargar Hoja de Inspección JPG</span>
          </span>
        )}
      </button>
    </>
  );
}
