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
}

const HighlightExample: React.FC<HighlightExampleProps> = ({
  fileUrl,
  notes,
  onAddNote,
  canComment,
  selectedHighlightId,
  goToPage,
}) => {
  const [message, setMessage] = React.useState("");
  let noteId = notes.length;
  const containerRef = React.useRef<HTMLDivElement>(null);

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

    return canComment ? (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0, 0, 0, .3)",
          borderRadius: "2px",
          padding: "8px",
          position: "absolute",
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          zIndex: 1,
        }}
      >
        <div>
          <textarea
            required
            rows={3}
            style={{
              border: "1px solid rgba(0, 0, 0, .3)",
            }}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "8px",
          }}
        >
          <div style={{ marginRight: "8px" }}>
            <PrimaryButton onClick={addNote}>Agregar</PrimaryButton>
          </div>
          <Button onClick={props.cancel}>Cancelar</Button>
        </div>
      </div>
    ) : null;
    
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
                      (note.id === selectedHighlightId ? "#ffeb3b" : "yellow"),
                    opacity: note.id === selectedHighlightId ? 0.7 : 0.4,
                    transition: "all 0.3s ease",
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
    <div
      style={{
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          alignItems: "center",
          backgroundColor: "#f3f4f6",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          display: "flex",
          padding: "4px",
        }}
      >
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
                <div style={{ padding: "0px 2px" }}>
                  <GoToPreviousPage />
                </div>
                <div style={{ padding: "0px 2px", width: "50px" }}>
                  <CurrentPageInput />
                </div>
                <div style={{ padding: "0px 2px" }}>
                  / <NumberOfPages />
                </div>
                <div style={{ padding: "0px 2px" }}>
                  <GoToNextPage />
                </div>
                <div style={{ marginLeft: "auto", padding: "0px 2px" }}>
                  <ShowSearchPopover />
                </div>
                <div style={{ padding: "0px 2px" }}>
                  <ZoomOut />
                </div>
                <div style={{ padding: "0px 2px" }}>
                  <Zoom />
                </div>
                <div style={{ padding: "0px 2px" }}>
                  <ZoomIn />
                </div>
              </>
            );
          }}
        </Toolbar>
      </div>
      <div
        ref={containerRef}
        style={{
          flexGrow: 1,
          position: "relative",
          overflow: "auto",
        }}
      >
        <Viewer
          fileUrl={fileUrl}
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
            `}</style>
    </div>
  );
};

export default HighlightExample;
