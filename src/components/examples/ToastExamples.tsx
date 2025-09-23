/**
 * Ejemplo de uso de las notificaciones toast mejoradas
 * 
 * Puedes usar este archivo como referencia para implementar
 * notificaciones toast en tus componentes
 */

import { useToastNotifications } from '@/common/hooks/useToastNotifications';

export function ExampleToastUsage() {
  const { success, error, warning, info, loading, dismiss, promise } = useToastNotifications();

  const handleSuccess = () => {
    success('Operación completada exitosamente');
  };

  const handleSuccessWithDetails = () => {
    success('Usuario creado', {
      title: 'Éxito',
      description: 'El usuario Juan Pérez ha sido creado correctamente'
    });
  };

  const handleError = () => {
    error('Algo salió mal');
  };

  const handleErrorWithDetails = () => {
    error('Error de validación', {
      title: 'Error',
      description: 'Por favor revisa los campos obligatorios'
    });
  };

  const handleWarning = () => {
    warning('Esta acción no se puede deshacer', {
      title: 'Advertencia',
      description: 'Asegúrate de que quieres continuar'
    });
  };

  const handleInfo = () => {
    info('Información importante', {
      title: 'Información',
      description: 'Ten en cuenta este detalle para futuras referencias'
    });
  };

  const handleLoading = () => {
    const toastId = loading('Procesando...');
    
    // Simular operación async
    setTimeout(() => {
      dismiss(toastId);
      success('¡Listo!');
    }, 3000);
  };

  const handlePromise = () => {
    const simulatedPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Datos guardados') : reject('Error de red');
      }, 2000);
    });

    promise(simulatedPromise, {
      loading: 'Guardando datos...',
      success: (data) => `✅ ${data}`,
      error: (err) => `❌ ${err}`,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Ejemplos de Toast</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleSuccess}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Success Simple
        </button>
        
        <button 
          onClick={handleSuccessWithDetails}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Success con Detalles
        </button>
        
        <button 
          onClick={handleError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Error Simple
        </button>
        
        <button 
          onClick={handleErrorWithDetails}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Error con Detalles
        </button>
        
        <button 
          onClick={handleWarning}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Warning
        </button>
        
        <button 
          onClick={handleInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Info
        </button>
        
        <button 
          onClick={handleLoading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Loading
        </button>
        
        <button 
          onClick={handlePromise}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Promise
        </button>
      </div>
    </div>
  );
}