import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    GGBApplet: any;
  }
}

interface GeoGebraRendererProps {
  commands: string;
  width?: number;
  height?: number;
}

export const GeoGebraRenderer: React.FC<GeoGebraRendererProps> = ({ 
  commands, 
  width = 600, 
  height = 400 
}) => {
  const containerId = useRef(`ggb-container-${Math.random().toString(36).substring(2, 11)}`);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: any;
    let isMounted = true;

    const initApplet = () => {
      if (!window.GGBApplet) {
        if (isMounted) {
          timeoutId = setTimeout(initApplet, 500);
        }
        return;
      }

      try {
        const parameters = {
          "id": `applet-${containerId.current}`,
          "width": width,
          "height": height,
          "showMenuBar": false,
          "showAlgebraInput": false,
          "showToolBar": false,
          "showResetIcon": true,
          "enableLabelDrags": false,
          "enableShiftDragZoom": true,
          "enableRightClick": false,
          "errorDialogsActive": false,
          "useBrowserForJS": false,
          "allowStyleBar": false,
          "preventFocus": false,
          "showZoomButtons": true,
          "appletOnLoad": (api: any) => {
            if (commands) {
              const lines = commands.split('\n').filter(line => line.trim());
              lines.forEach(line => {
                try {
                  api.evalCommand(line);
                } catch (e) {
                  console.warn("GeoGebra command error:", line, e);
                }
              });
            }
          },
          "type": "web"
        };

        const applet = new window.GGBApplet(parameters, '5.0');
        const container = document.getElementById(containerId.current);
        if (container) {
          applet.inject(container);
          setIsLoaded(true);
        }
      } catch (err: any) {
        console.error("GeoGebra init error:", err);
        setError(err.message);
      }
    };

    initApplet();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [commands, width, height]);

  return (
    <div className="flex flex-col items-center my-6">
      <div 
        id={containerId.current} 
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        style={{ width, height }}
      >
        {!isLoaded && !error && (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest">Carregando GeoGebra...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500 p-4 text-center">
            <span className="text-sm">Erro ao carregar o GeoGebra: {error}</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-tighter">Gráfico interativo gerado via GeoGebra</p>
    </div>
  );
};
