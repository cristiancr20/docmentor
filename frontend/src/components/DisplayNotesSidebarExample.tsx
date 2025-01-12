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
}

interface HighlightExampleProps {
  fileUrl: string;
  notes: Note[];
  onAddNote: (note: Note) => void;
  isTutor: boolean;
  selectedHighlightId?: number | null;
}

const HighlightExample: React.FC<HighlightExampleProps> = ({
  fileUrl,
  notes,
  onAddNote,
  isTutor,
  selectedHighlightId,
}) => {
  const [message, setMessage] = React.useState("");
  let noteId = notes.length;
  const viewerRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (selectedHighlightId !== null && selectedHighlightId !== undefined) {
      const selectedNote = notes.find(
        (note) => note.id === selectedHighlightId
      );
      if (selectedNote && selectedNote.highlightAreas.length > 0) {
        const area = selectedNote.highlightAreas[0];
        const pageIndex = area.pageIndex;

        // Scroll to the page first
        if (viewerRef.current) {
          viewerRef.current.jumpToPage(pageIndex);

          // Wait for the page to be rendered
          setTimeout(() => {
            const pageElement = document.querySelector(
              `[data-page-number="${pageIndex + 1}"]`
            );
            if (pageElement) {
              const pageHeight = pageElement.clientHeight;
              const scrollPosition = pageHeight * (area.top / 100);

              pageElement.scrollIntoView({ behavior: "smooth" });
              window.scrollBy(0, scrollPosition - window.innerHeight / 3);
            }
          }, 300);
        }
      }
    }
  }, [selectedHighlightId, notes]);

  const scrollToHighlight = React.useCallback(
    (highlightAreas: any[]) => {
      if (!highlightAreas || highlightAreas.length === 0) return;

      // Encontrar el primer área válida (con dimensiones no nulas)
      const validArea = highlightAreas.find(
        (area) => area.height > 0 && area.width > 0 && area.pageIndex >= 0
      );

      if (!validArea) return;

      const pageIndex = validArea.pageIndex;

      if (viewerRef.current) {
        // Primero, navegar a la página correcta
        viewerRef.current.jumpToPage(pageIndex);

        // Esperar a que la página se renderice
        setTimeout(() => {
          const pageElement = document.querySelector(
            `[data-page-number="${pageIndex + 1}"]`
          );

          if (pageElement) {
            const containerHeight =
              containerRef.current?.clientHeight || window.innerHeight;
            const pageHeight = pageElement.clientHeight;

            // Calcular la posición de scroll basada en el porcentaje de la página
            const scrollPosition = (pageHeight * validArea.top) / 100;

            // Ajustar el scroll del contenedor
            if (containerRef.current) {
              containerRef.current.scrollTop =
                scrollPosition - containerHeight / 3;
            }

            // Resaltar visualmente el área
            const highlight = document.querySelector(
              `[data-highlight-id="${selectedHighlightId}"]`
            );
            if (highlight) {
              highlight.classList.add("highlight-flash");
              setTimeout(() => {
                highlight.classList.remove("highlight-flash");
              }, 2000);
            }
            console.log("Scrolling to:", {
              pageIndex: validArea.pageIndex,
              top: validArea.top,
              scrollPosition,
            });
          }
        }, 300);
      }
    },
    [selectedHighlightId]
  );

  React.useEffect(() => {
    if (selectedHighlightId !== null && selectedHighlightId !== undefined) {
      const selectedNote = notes.find(
        (note) => note.id === selectedHighlightId
      );
      if (selectedNote && selectedNote.highlightAreas) {
        scrollToHighlight(selectedNote.highlightAreas);
      }
    }
  }, [selectedHighlightId, notes, scrollToHighlight]);

  const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
    <div
      style={{
        background: "cyan",
        display: isTutor ? "flex" : "none",

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

    return isTutor ? (
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
                style={Object.assign(
                  {},
                  {
                    background:
                      note.id === selectedHighlightId ? "#ffeb3b" : "yellow",
                    opacity: note.id === selectedHighlightId ? 0.7 : 0.4,
                    transition: "all 0.3s ease",
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
          ref={viewerRef}
          fileUrl={fileUrl}
          plugins={[highlightPluginInstance, toolbarPluginInstance]}
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
