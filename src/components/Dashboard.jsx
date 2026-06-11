import React from 'react';
import { ClipboardList, PlusCircle, Calendar, ChevronRight, AlertCircle, Wrench, CheckSquare, Trash2 } from 'lucide-react';

export default function Dashboard({ reports, onViewReport, onCreateNew }) {
  
  // Calculate general statistics
  const stats = React.useMemo(() => {
    let totalInspected = 0;
    let totalNok = 0;
    let totalRework = 0;

    reports.forEach(report => {
      // Sum from main table rows
      if (report.rows && Array.isArray(report.rows)) {
        report.rows.forEach(row => {
          totalInspected += Number(row.cantidadInspeccionada || 0);
          totalNok += Number(row.cantidadOk || 0) < Number(row.cantidadInspeccionada || 0) 
            ? (Number(row.cantidadInspeccionada || 0) - Number(row.cantidadOk || 0)) 
            : 0; // fallback calculation if NOK totals aren't sub-divided
        });
      }
      
      // Better: use direct totals if available
      if (report.totals) {
        totalInspected += Number(report.totals.revisado || 0);
        totalNok += Number(report.totals.nok || 0);
        totalRework += Number(report.totals.recuperadas || 0);
      }
    });

    return {
      inspected: totalInspected,
      nok: totalNok,
      rework: totalRework
    };
  }, [reports]);

  // Group reports by date (YYYY-MM-DD)
  const groupedReports = React.useMemo(() => {
    const groups = {};
    
    // Sort reports descending by date
    const sorted = [...reports].sort((a, b) => {
      return new Date(b.header.fecha).getTime() - new Date(a.header.fecha).getTime();
    });

    sorted.forEach(report => {
      const dateStr = report.header.fecha;
      // Format date to local friendly representation (e.g. "10 de Junio, 2026")
      let dateLabel = dateStr;
      try {
        const dateObj = new Date(dateStr);
        dateLabel = dateObj.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        // Capitalize first letter
        dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
      } catch (e) {
        // Fallback
      }

      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(report);
    });

    return groups;
  }, [reports]);

  return (
    <div className="dashboard-container">
      {/* Stats Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revisado</div>
          <div className="stat-value">{stats.inspected}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total NOK</div>
          <div className="stat-value nok">{stats.nok}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recuperadas</div>
          <div className="stat-value rw">{stats.rework}</div>
        </div>
      </div>

      {/* History List */}
      <div className="history-section">
        <div className="section-header">
          <h2 className="section-title">Histórico de Partes</h2>
          <button className="btn-add-row" style={{ marginTop: 0, padding: '8px 12px' }} onClick={onCreateNew}>
            <PlusCircle size={16} />
            <span>Nuevo Parte</span>
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="empty-state">
            <ClipboardList className="empty-icon" />
            <p style={{ fontWeight: '600', color: 'var(--text-light)', marginBottom: '4px' }}>
              No hay partes de trabajo registrados
            </p>
            <p style={{ fontSize: '0.8rem', marginBottom: '16px' }}>
              Crea tu primer parte de inspección de obra pulsando el botón de abajo o de arriba.
            </p>
            <button className="btn-submit" style={{ margin: '0 auto', padding: '10px 20px' }} onClick={onCreateNew}>
              <PlusCircle size={18} />
              <span>Crear Primer Parte</span>
            </button>
          </div>
        ) : (
          Object.keys(groupedReports).map(dateLabel => (
            <div key={dateLabel} className="day-group">
              <div className="day-header">{dateLabel}</div>
              <div className="report-list">
                {groupedReports[dateLabel].map(report => (
                  <div 
                    key={report.id} 
                    className="report-card"
                    onClick={() => onViewReport(report)}
                  >
                    <div className="report-info">
                      <div className="report-workplace">{report.header.lugarTrabajo || 'Sin lugar de trabajo'}</div>
                      <div className="report-desc">{report.header.descripcionTrabajo || 'Sin descripción'}</div>
                      <div className="report-meta">
                        Cliente: {report.header.cliente || '-'} • Proyecto: {report.header.proyectoNo || '-'}
                      </div>
                    </div>
                    <div className="report-stats">
                      <span className="report-total-badge">
                        {report.totals?.revisado || 0} Piezas
                      </span>
                      <div className="report-substats">
                        <span className="badge-nok">NOK: {report.totals?.nok || 0}</span>
                        <span className="badge-rw">RW: {report.totals?.recuperadas || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
