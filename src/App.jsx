import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import WorkOrderForm from './components/WorkOrderForm';
import InspectionSheetPreview from './components/InspectionSheetPreview';
import { LayoutDashboard, PlusCircle, X, Edit, Trash2 } from 'lucide-react';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('dashboard'); // 'dashboard' or 'form'
  const [reports, setReports] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [previewingReport, setPreviewingReport] = useState(null);

  // Load reports from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem('exf_work_reports');
    if (saved) {
      try {
        setReports(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading reports from localStorage:', e);
      }
    }
  }, []);

  // Save report to list
  const handleSaveReport = (reportData) => {
    let updatedReports;
    const exists = reports.some(r => r.id === reportData.id);

    if (exists) {
      // Update existing
      updatedReports = reports.map(r => r.id === reportData.id ? reportData : r);
    } else {
      // Add new
      updatedReports = [reportData, ...reports];
    }

    setReports(updatedReports);
    localStorage.setItem('exf_work_reports', JSON.stringify(updatedReports));
    setScreen('dashboard');
    setEditingReport(null);
    
    // Automatically open preview after saving a new report so they can download it
    setPreviewingReport(reportData);
  };

  // Delete a report
  const handleDeleteReport = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este parte de trabajo?')) {
      const updatedReports = reports.filter(r => r.id !== id);
      setReports(updatedReports);
      localStorage.setItem('exf_work_reports', JSON.stringify(updatedReports));
      setPreviewingReport(null);
    }
  };

  // Trigger editing from preview modal
  const handleEditFromPreview = (report) => {
    setPreviewingReport(null);
    setEditingReport(report);
    setScreen('form');
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">ExF</div>
          <div className="brand-name">Exact<span>×</span>Forestall</div>
        </div>
        <div className="sync-status">
          <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
          Offline OK
        </div>
      </header>

      {/* Main Body */}
      <main className="main-content">
        {screen === 'dashboard' && (
          <Dashboard 
            reports={reports} 
            onViewReport={(rep) => setPreviewingReport(rep)}
            onCreateNew={() => {
              setEditingReport(null);
              setScreen('form');
            }}
          />
        )}

        {screen === 'form' && (
          <WorkOrderForm 
            initialData={editingReport}
            onSave={handleSaveReport}
            onBack={() => {
              setScreen('dashboard');
              setEditingReport(null);
            }}
          />
        )}
      </main>

      {/* Navigation Footer for Mobile */}
      <nav className="mobile-nav">
        <button 
          className={`nav-item ${screen === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setScreen('dashboard');
            setEditingReport(null);
          }}
        >
          <LayoutDashboard size={20} />
          <span className="nav-label">Historial</span>
        </button>
        <button 
          className={`nav-item ${screen === 'form' ? 'active' : ''}`}
          onClick={() => {
            setEditingReport(null);
            setScreen('form');
          }}
        >
          <PlusCircle size={20} />
          <span className="nav-label">Crear Parte</span>
        </button>
      </nav>

      {/* Modal for Inspection Sheet Preview & JPG Generator */}
      {previewingReport && (
        <div className="modal-overlay" onClick={() => setPreviewingReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Ficha de Inspección</h3>
              <button className="btn-close-modal" onClick={() => setPreviewingReport(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Scaled Sheet Visual Preview */}
              <InspectionSheetPreview 
                report={previewingReport} 
                onDownloadComplete={() => {
                  console.log('Imagen descargada con éxito');
                }}
              />
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-action-modal"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-light)', border: '1px solid var(--border-ui)' }}
                onClick={() => handleEditFromPreview(previewingReport)}
              >
                <Edit size={16} />
                <span>Editar Datos</span>
              </button>
              <button 
                type="button" 
                className="btn-action-modal delete"
                onClick={() => handleDeleteReport(previewingReport.id)}
              >
                <Trash2 size={16} />
                <span>Eliminar Parte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
