import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Eye, Loader } from 'lucide-react';

export default function InspectionSheetPreview({ report, onDownloadComplete }) {
  const offscreenRef = useRef(null);
  const previewRef = useRef(null);
  const [scale, setScale] = useState(0.25);
  const [isExporting, setIsExporting] = useState(false);

  // Pad rows to exactly 20 items to match the exact visual format of the printed sheet
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

  // Pad workers to exactly 5 rows
  const paddedWorkers = React.useMemo(() => {
    const original = report.workers || [];
    const targetLength = 5;
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
        // Sheet is fixed 1200px wide
        const newScale = Math.min(1, wrapperWidth / 1200);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    // Extra timeout to ensure modal transition finished and DOM is fully laid out
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
      // Small timeout to allow browser layout engine to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      const captureElement = offscreenRef.current;
      if (!captureElement) {
        throw new Error('Elemento de captura no disponible');
      }

      // Configure html2canvas for high quality
      const canvas = await html2canvas(captureElement, {
        scale: 2.5, // High resolution (3000px width output)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Export as high quality JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Create download link
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

  // Helper to check if a row is empty (for cell rendering)
  const isRowEmpty = (row) => {
    return !row.referencia && !row.numeroEtiqueta && !row.cantidadInspeccionada;
  };

  // Helper to format date display in sheet
  const formatSheetDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // YYYY-MM-DD to DD/MM/YYYY
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch(e) {}
    return dateStr;
  };

  // Renders the HTML template representing the sheet
  const renderSheetMarkup = (isOffscreen = false) => {
    return (
      <div 
        id={isOffscreen ? 'ef-sheet-capture' : 'ef-sheet-preview'}
        className="ef-sheet"
      >
        {/* 1. Header Row */}
        <table className="sheet-header-table">
          <tbody>
            <tr>
              <td className="logo-cell">
                <span style={{ fontWeight: '800' }}>Exact</span>
                <span className="cross">×</span>
                <span style={{ fontWeight: '800' }}>Forestall</span>
              </td>
              <td className="title-cell">Hoja de inspección</td>
              <td className="x-cell">✕</td>
            </tr>
          </tbody>
        </table>

        {/* 2. Metadata Block */}
        <table className="sheet-meta-table">
          <tbody>
            <tr>
              <td style={{ width: '40%' }}>
                <span className="meta-label">Lugar de trabajo</span>
                <span className="meta-value">{report.header.lugarTrabajo}</span>
              </td>
              <td style={{ width: '35%' }}>
                <span className="meta-label">Cliente</span>
                <span className="meta-value">{report.header.cliente}</span>
              </td>
              <td style={{ width: '10%' }}>
                <span className="meta-label">Proyecto Nº</span>
                <span className="meta-value">{report.header.proyectoNo}</span>
              </td>
              <td style={{ width: '7%' }}>
                <span className="meta-label">Página</span>
                <span className="meta-value">{report.header.pagina}</span>
              </td>
              <td style={{ width: '8%' }}>
                <span className="meta-label">Fecha</span>
                <span className="meta-value">{formatSheetDate(report.header.fecha)}</span>
              </td>
            </tr>
            <tr>
              <td colSpan={5} style={{ height: '18px' }}>
                <span className="meta-label">Descripción del trabajo</span>
                <span className="meta-value">{report.header.descripcionTrabajo}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. Main Inspection Grid Table */}
        <table className="sheet-main-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-ref">Referencia</th>
              <th rowSpan={2} className="col-lote">Lote/Guía de envío</th>
              <th rowSpan={2} className="col-etiqueta">Número de etiqueta</th>
              <th rowSpan={2} className="col-fecha">Fecha de producción</th>
              <th rowSpan={2} className="col-cant">Cantidad Inspeccionada</th>
              <th rowSpan={2} className="col-ok">Cantidad OK</th>
              <th colSpan={5} style={{ fontSize: '5.5px', padding: '1px' }}>Cantidad NOK</th>
              <th colSpan={5} style={{ fontSize: '5.5px', padding: '1px' }}>Cantidad Retrabajada</th>
            </tr>
            <tr>
              <th className="col-nok-sub">D1</th>
              <th className="col-nok-sub">D2</th>
              <th className="col-nok-sub">D3</th>
              <th className="col-nok-sub">D4</th>
              <th className="col-nok-sub">D5</th>
              <th className="col-rw-sub">RW1</th>
              <th className="col-rw-sub">RW2</th>
              <th className="col-rw-sub">RW3</th>
              <th className="col-rw-sub">RW4</th>
              <th className="col-rw-sub">RW5</th>
            </tr>
          </thead>
          <tbody>
            {paddedRows.map((row, idx) => {
              const empty = isRowEmpty(row);
              return (
                <tr key={idx}>
                  <td className="text-left font-bold" style={{ paddingLeft: '5px' }}>{row.referencia}</td>
                  <td>{row.loteGuia}</td>
                  <td className="font-bold">{row.numeroEtiqueta}</td>
                  <td>{formatSheetDate(row.fechaProduccion)}</td>
                  <td className="font-bold">{row.cantidadInspeccionada}</td>
                  <td className="font-bold">{row.cantidadOk}</td>
                  
                  {/* NOK D1 to D5 Cells */}
                  {row.nokD.map((dVal, dIdx) => (
                    <td key={`d-${dIdx}`} style={{ color: dVal ? '#ef4444' : '#000', fontWeight: dVal ? 'bold' : 'normal' }}>
                      {dVal || ''}
                    </td>
                  ))}
                  
                  {/* RW1 to RW5 Cells */}
                  {row.rwRW.map((rwVal, rwIdx) => (
                    <td key={`rw-${rwIdx}`} style={{ color: rwVal ? '#f59e0b' : '#000', fontWeight: rwVal ? 'bold' : 'normal' }}>
                      {rwVal || ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 4. Bottom Layout: Defects & Workers/Signatures side-by-side */}
        <div className="sheet-bottom-layout">
          {/* Left Side: Defect descriptions & Supervision/Obs */}
          <div className="sheet-bottom-left">
            <table className="sheet-defects-table">
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="defect-label">Descripción del defecto NOK #{idx+1}</td>
                    <td className="defect-value" style={{ width: '65%' }}>{report.defectsDesc?.nok?.[idx] || ''}</td>
                  </tr>
                ))}
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="defect-label">Descripción del defecto Retrabajado #{idx+1}</td>
                    <td className="defect-value" style={{ width: '65%' }}>{report.defectsDesc?.rw?.[idx] || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="sheet-staff-table">
              <tbody>
                <tr>
                  <td style={{ width: '35%', color: '#555', fontSize: '6px' }}>Responsable directo:</td>
                  <td style={{ width: '65%', fontWeight: '700' }}>{report.signatures?.responsableDirecto}</td>
                </tr>
                <tr>
                  <td style={{ color: '#555', fontSize: '6px' }}>Asistente de supervisión:</td>
                  <td style={{ fontWeight: '700' }}>{report.signatures?.asistenteSupervision}</td>
                </tr>
                <tr>
                  <td style={{ color: '#555', fontSize: '6px' }}>Cliente:</td>
                  <td style={{ fontWeight: '700' }}>{report.signatures?.cliente}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="obs-cell">
                    <span style={{ color: '#555', fontSize: '6px', display: 'block', marginBottom: '2px' }}>Observaciones:</span>
                    <span style={{ fontSize: '8px', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                      {report.signatures?.observaciones}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right Side: Collaborators table */}
          <div className="sheet-bottom-right">
            <table className="sheet-collab-table">
              <thead>
                <tr>
                  <th className="collab-col-code" rowSpan={2}>Código de colaborador</th>
                  <th className="collab-col-hours" rowSpan={2}>Horas</th>
                  <th className="collab-col-name" rowSpan={2}>Nombre legible del trabajador:</th>
                  <th className="collab-col-time" colSpan={2}>Entrada</th>
                  <th className="collab-col-time" colSpan={2}>Salida</th>
                </tr>
                <tr>
                  <th style={{ fontSize: '5.5px', padding: '1px' }}>Hora</th>
                  <th style={{ fontSize: '5.5px', padding: '1px' }}>Minutos</th>
                  <th style={{ fontSize: '5.5px', padding: '1px' }}>Hora</th>
                  <th style={{ fontSize: '5.5px', padding: '1px' }}>Minutos</th>
                </tr>
              </thead>
              <tbody>
                {paddedWorkers.map((worker, wIdx) => {
                  const hasWorker = worker.nombreTrabajador;
                  return (
                    <tr key={wIdx}>
                      <td className="font-bold">{worker.codigoColaborador || ''}</td>
                      <td className="font-bold">{worker.horas || ''}</td>
                      <td className="text-left font-bold" style={{ paddingLeft: '6px' }}>{worker.nombreTrabajador || ''}</td>
                      
                      {/* Entrada */}
                      <td className="font-bold">{hasWorker ? worker.entradaHora : ''}</td>
                      <td className="font-bold">{hasWorker ? worker.entradaMinuto : ''}</td>
                      
                      {/* Salida */}
                      <td className="font-bold">{hasWorker ? worker.salidaHora : ''}</td>
                      <td className="font-bold">{hasWorker ? worker.salidaMinuto : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Footer totals bar */}
        <div className="sheet-footer-row">
          <div>
            TOTAL REVISADO: {report.totals?.revisado || 0} PIEZAS // TOTAL NOK: {report.totals?.nok || 0} PIEZAS // TOTAL RECUPERADAS: {report.totals?.recuperadas || 0} PIEZAS
          </div>
          <div className="sheet-footer-code">
            SGQ-DOP-F010, 2025 V5R
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. OFFSCREEN HIGH-RESOLUTION CONTAINER FOR CAPTURING */}
      <div className="offscreen-container">
        <div ref={offscreenRef}>
          {renderSheetMarkup(true)}
        </div>
      </div>

      {/* 2. ON-SCREEN VISIBLE SCALED PREVIEW */}
      <div className="sheet-preview-wrapper">
        <div 
          ref={previewRef}
          className="scaled-preview-container"
          style={{ 
            width: '1200px', 
            height: '848px', 
            transform: `scale(${scale})`,
            marginBottom: `-${848 * (1 - scale)}px`, // offsets container height collapsing from scale
            marginRight: `-${1200 * (1 - scale)}px` // offsets container width collapsing from scale
          }}
        >
          {renderSheetMarkup(false)}
        </div>
      </div>

      {/* Action triggers */}
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
          <>
            <Download size={18} />
            <span>Descargar Hoja de Inspección JPG</span>
          </>
        )}
      </button>
    </>
  );
}
