import * as React from "react";
import {
  Button,
  PdfJs,
  Position,
  PrimaryButton,
  Tooltip,
  Viewer,
} from "@react-pdf-viewer/core";

import { toolbarPlugin, ToolbarSlot } from "@react-pdf-viewer/toolbar";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";

/* import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'; */
import {
  HighlightArea,
  highlightPlugin,
  MessageIcon,
  RenderHighlightContentProps,
  RenderHighlightTargetProps,
  RenderHighlightsProps,
} from "@react-pdf-viewer/highlight";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

import { useAppTheme } from "../utils/useAppTheme";
import { HIGHLIGHT_COLORS } from "../utils/highlightColors";

interface Note {
  id: number;
  content: string;
  highlightAreas: HighlightArea[];
  quote: string;
  // Color del resaltado. Sin valor se pinta amarillo, que es el de los
  // comentarios; el comparador lo usa para marcar en rojo lo eliminado y en
  // verde lo agregado.
  color?: string;
  // Los resaltados del comparador son informativos: no abren el panel de
  // comentario al pulsarlos.
  readOnly?: boolean;
}

interface HighlightExampleProps {
  fileUrl: string;
  notes: Note[];
  onAddNote: (note: Note) => void;
  canComment: boolean;
  selectedHighlightId?: number | null;
  // Número de página (base 1) al que saltar. Lo usa el comparador para llevar
  // la vista al cambio que se acaba de pulsar en la lista.
  goToPage?: number | null;
  // Entrega el elemento que hace scroll de verdad una vez cargado el PDF. El
  // comparador lo necesita para sincronizar el desplazamiento entre los dos
  // documentos.
  onScrollerReady?: (element: HTMLElement | null) => void;
}

const HighlightExample: React.FC<HighlightExampleProps> = ({
  fileUrl,
  notes,
  onAddNote,
  canComment,
  selectedHighlightId,
  goToPage,
  onScrollerReady,
}) => {
  const [message, setMessage] = React.useState("");
  let noteId = notes.length;
  const containerRef = React.useRef<HTMLDivElement>(null);

  // El visor trae su propio tema. Sin pasárselo, en oscuro dejaba los iconos de
  // la barra en negro sobre fondo oscuro y no se distinguían.
  const theme = useAppTheme();

  // `Viewer` es un componente de función: no acepta ref, así que el
  // `viewerRef.current.jumpToPage(...)` anterior nunca llegaba a ejecutarse
  // (React avisaba con "Function components cannot be given refs") y pulsar un
  // comentario no saltaba a su resaltado. La navegación va por su plugin.
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  /**
   * Lleva la vista al resaltado seleccionado.
   *
   * Antes había dos efectos duplicados intentando lo mismo, ambos apoyados en
   * el ref inoperante del Viewer.
   */
  const scrollToHighlight = React.useCallback(
    (highlightAreas: HighlightArea[]) => {
      const validArea = (highlightAreas || []).find(
        (area) => area.height > 0 && area.width > 0 && area.pageIndex >= 0
      );

      if (!validArea) return;

      jumpToPage(validArea.pageIndex);

      // La página tiene que renderizarse antes de poder ajustar el scroll fino.
      setTimeout(() => {
        const pageElement = document.querySelector(
          `[data-page-number="${validArea.pageIndex + 1}"]`
        );
        if (!pageElement || !containerRef.current) return;

        const containerHeight = containerRef.current.clientHeight;
        const scrollPosition = (pageElement.clientHeight * validArea.top) / 100;

        containerRef.current.scrollTop =
          pageElement.getBoundingClientRect().top + scrollPosition - containerHeight / 3;
      }, 300);
    },
    [jumpToPage]
  );

  React.useEffect(() => {
    if (selectedHighlightId === null || selectedHighlightId === undefined) return;

    const selectedNote = notes.find((note) => note.id === selectedHighlightId);
    if (selectedNote?.highlightAreas) {
      scrollToHighlight(selectedNote.highlightAreas);
    }
  }, [selectedHighlightId, notes, scrollToHighlight]);

  React.useEffect(() => {
    if (!goToPage) return;
    // El plugin trabaja con índices base 0.
    jumpToPage(goToPage - 1);
  }, [goToPage, jumpToPage]);

  /**
   * El scroll no ocurre en nuestro contenedor sino en el que monta el visor por
   * dentro, así que hay que localizarlo una vez cargado el documento.
   */
  const handleDocumentLoad = React.useCallback(() => {
    if (!onScrollerReady) return;

    const inner = containerRef.current?.querySelector<HTMLElement>(".rpv-core__inner-pages");
    onScrollerReady(inner ?? containerRef.current);
  }, [onScrollerReady]);

  // Solo al desmontar: con `onScrollerReady` en las dependencias, cualquier
  // render habría anulado el registro recién hecho. Se guarda en una ref para
  // no capturar una versión obsoleta de la función.
  const scrollerReadyRef = React.useRef(onScrollerReady);
  scrollerReadyRef.current = onScrollerReady;

  React.useEffect(() => () => scrollerReadyRef.current?.(null), []);

  const renderHighlightTarget = (props: RenderHighlightTargetProps) => (

    <div
      style={{
        background: "cyan",
        display: canComment ? "flex" : "none", 
        position: "absolute",
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: "translate(0, 8px)",
        zIndex: 1,
      }}
    >
      <Tooltip
        position={Position.TopCenter}
        target={
          <Button onClick={props.toggle}>
            <MessageIcon />
          </Button>
        }
        content={() => <div style={{ width: "100px" }}>Agregar comentario</div>}
        offset={{ left: 0, top: -8 }}
      />

      
    </div>
  );
  
  const renderHighlightContent = (props: RenderHighlightContentProps) => {
    const addNote = () => {
      if (message !== "") {
        const note: Note = {
          id: ++noteId,
          content: message,
          highlightAreas: props.highlightAreas,
          quote: props.selectedText,
        };
        onAddNote(note);
        props.cancel();
      }
    };

    if (!canComment) return null;

    return (
      <div
        className="absolute z-10 w-72 rounded-xl border border-line bg-surface p-3 shadow-pop"
        style={{
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        }}
      >
        {/* La cita da contexto de qué se está corrigiendo: al escribir, el
            fragmento seleccionado queda tapado por esta misma caja. */}
        {props.selectedText && (
          <p className="mb-2 line-clamp-2 border-l-2 border-accent bg-accent-wash px-2 py-1 text-xs italic text-muted">
            {props.selectedText}
          </p>
        )}

        <textarea
          autoFocus
          rows={3}
          placeholder="Escribe la corrección…"
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-muted"
        />

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.cancel}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-content"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={addNote}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-on-accent transition-colors hover:bg-accent-soft"
          >
            Comentar
          </button>
        </div>
      </div>
    );
  };

  const renderHighlights = (props: RenderHighlightsProps) => (
    <div>
      {notes.map((note) => (
        <React.Fragment key={note.id}>
          {note.highlightAreas
            .filter(
              (area) => area.pageIndex === props.pageIndex && area.height > 0
            )
            .map((area, idx) => (
              <div
                key={idx}
                data-highlight-id={note.id}
                className={`highlight-area ${note.id === selectedHighlightId ? "selected" : ""}`}
                title={note.content}
                style={Object.assign(
                  {},
                  {
                    background:
                      note.color ??
                      (note.id === selectedHighlightId
                        ? HIGHLIGHT_COLORS.commentSelected
                        : HIGHLIGHT_COLORS.comment),
                    // El resaltado seleccionado lleva contorno además de color:
                    // el cambio de tono solo se notaba con el texto encima.
                    outline:
                      note.id === selectedHighlightId
                        ? `2px solid ${HIGHLIGHT_COLORS.commentBarSelected}`
                        : "none",
                    borderRadius: "2px",
                    transition: "background 0.2s ease, outline-color 0.2s ease",
                    pointerEvents: note.readOnly ? "none" : undefined,
                  },
                  props.getCssProperties(area, props.rotation)
                )}
              />
            ))}
        </React.Fragment>
      ))}
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlightContent,
    renderHighlights,
  });

  const toolbarPluginInstance = toolbarPlugin();
  const { Toolbar } = toolbarPluginInstance;

  return (
    /* La clase de tema oscuro se repite aquí a propósito: nuestra barra de
       herramientas se renderiza fuera del elemento del visor, así que no le
       llegaban las variables de `.rpv-core__viewer--dark` y los iconos se
       quedaban en negro sobre fondo oscuro, invisibles. Al ponerla en un
       ancestro común, las variables cascadean también a la barra. */
    <div
      className={`relative flex h-full flex-col ${
        theme === "dark" ? "rpv-core__viewer--dark" : ""
      }`}
    >
      {/* La barra usaba un gris fijo (#f3f4f6) que en tema oscuro quedaba como
          una franja clara. Va con los tokens del sistema. */}
      <div className="flex items-center gap-0.5 border-b border-line bg-surface-2 px-2 py-1 text-content">
        <Toolbar>
          {(slots) => {
            const {
              ShowSearchPopover,
              ZoomOut,
              Zoom,
              ZoomIn,
              CurrentPageInput,
              GoToPreviousPage,
              GoToNextPage,
              NumberOfPages,
            } = slots;

            return (
              <>
                <GoToPreviousPage />
                <div className="w-12">
                  <CurrentPageInput />
                </div>
                <span className="whitespace-nowrap font-mono text-xs text-muted">
                  / <NumberOfPages />
                </span>
                <GoToNextPage />
                <div className="ml-auto">
                  <ShowSearchPopover />
                </div>
                <ZoomOut />
                <div className="font-mono text-xs">
                  <Zoom />
                </div>
                <ZoomIn />
              </>
            );
          }}
        </Toolbar>
      </div>
      <div ref={containerRef} className="relative flex-1 overflow-auto">
        <Viewer
          fileUrl={fileUrl}
          theme={theme}
          onDocumentLoad={handleDocumentLoad}
          plugins={[
            highlightPluginInstance,
            toolbarPluginInstance,
            pageNavigationPluginInstance,
          ]}
        />
      </div>

      <style>{`
                .highlight-area {
                    position: absolute;
                    pointer-events: none;
                }
                
                .highlight-area.selected {
                    z-index: 1;
                }
                
                @keyframes flashHighlight {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                
                .highlight-flash {
                    animation: flashHighlight 1s ease-in-out;
                }

                /* En oscuro, el tema de la librería tiñe también el área donde
                   se apoya la hoja, y el documento acababa flotando sobre un
                   fondo casi negro. La barra se queda oscura, pero el papel y
                   su entorno se mantienen claros: un PDF es una hoja blanca y
                   leerlo así cansa menos. */
                .rpv-core__viewer--dark .rpv-core__inner-page {
                    background-color: #f7f8fa;
                }
                .rpv-core__viewer--dark .rpv-core__inner-pages {
                    background-color: #f7f8fa;
                }
            `}</style>
    </div>
  );
};

export default HighlightExample;
