'use client';

import { useCanRedo, useCanUndo, useHistory, useMutation, useSelf, useStorage } from "@liveblocks/react";
import { colorToCss, findIntersectionLayersWithRectangle, penPointsToPathLayer, pointerEventToCanvasPoint, resizeBounds } from "~/utils";
import LayerComponent from "./LayerComponent";
import { Camera, Layer, LayerType,Point, RectangleLayer, EllipseLayer, CanvasState, CanvasMode, TextLayer, Side, XYWH } from "~/types";
import {nanoid} from 'nanoid'
import { LiveObject } from "@liveblocks/client";
import React, { useCallback, useEffect, useState } from "react";
import ToolsBar from "../toolsbar/ToolsBar";
import Path from "./Path";
import SelectionBox from "./SelectionBox";
import useDeleteLayers from "~/hooks/useDeleteLayers";
import SelectionTools from "./SelectionTools";
import Sidebars from "../sidebars/Sidebars";

const MAX_LAYERS = 100;

export default function Canvas() {

  const roomColor = useStorage((root) => root.roomColor)
  const layerIds = useStorage((root) => root.layerIds)

  const pencilDraft = useSelf(((me) => me.presence.pencilDraft))

  const [camera,setCamera] = useState<Camera>({x:0,y:0,zoom:1})

  const [leftIsMinimized,setLeftIsMinimized] = useState(false)

  const deleteLayers = useDeleteLayers();

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const selectAllLayers = useMutation(({setMyPresence}) => {
    if (layerIds) {
      setMyPresence({selection: [...layerIds]},{addToHistory: true})
    }
  },[layerIds])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const activeElement = document.activeElement;
      const isInputField = activeElement && (
        activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA"
      )
      if (isInputField) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case "backspace" :
          deleteLayers();
          break;
        case "z" :
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            }
            else {
              history.undo();
            }
          }
          break;
        case "a" :
          if (e.ctrlKey || e.metaKey) {
            selectAllLayers()
            break;
          }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  },[deleteLayers])

  const [canvasState, setCanvasState] = useState<CanvasState>({mode: CanvasMode.None})

  const onLayerPointerDown = useMutation(({self, setMyPresence}, e: React.PointerEvent, layerId: string) => {
    if (
      canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Inserting
    ) {
      return;
    }

    history.pause()
    e.stopPropagation();
    if (!self.presence.selection.includes(layerId)) {
      setMyPresence({
        selection: [layerId]
      }, {addToHistory: true})
    }

    if (e.nativeEvent.button === 2) {
      setCanvasState({mode: CanvasMode.RightClick})
    }
    else {
      const point = pointerEventToCanvasPoint(e, camera)
      setCanvasState({mode: CanvasMode.Translating, current: point})
    }
    
  },[canvasState.mode, camera, history])

  const onResizeHandlePointerDown = useCallback((corner: Side, initialBounds: XYWH) => {
    history.pause()
    setCanvasState({
      mode: CanvasMode.Resizing,
      initialBounds,
      corner
    })
  },[history])

  const insertLayer = useMutation(
    (
      {storage,setMyPresence},
      layerType : LayerType.Ellipse | LayerType.Rectangle | LayerType.Text, 
      position: Point
    ) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {
        return
      }
      const liveLayerIds = storage.get("layerIds")
      const layerId = nanoid();
      let layer: LiveObject<Layer> | null = null;

      if(layerType === LayerType.Rectangle) {
        layer = new LiveObject<RectangleLayer>({
          type: LayerType.Rectangle,
          x: position.x,
          y: position.y,
          height: 100,
          width: 100,
          fill: {r:217, g:217, b:217},
          stroke: {r:217, g:217, b:217},
          opacity:100,
        })
      }
      else if(layerType === LayerType.Ellipse) {
        layer = new LiveObject<EllipseLayer>({
          type: LayerType.Ellipse,
          x: position.x,
          y: position.y,
          height: 100,
          width: 100,
          fill: {r:217, g:217, b:217},
          stroke: {r:217, g:217, b:217},
          opacity:100,
        })
      }
      else if(layerType === LayerType.Text) {
        layer = new LiveObject<TextLayer>({
          type: LayerType.Text,
          x: position.x,
          y: position.y,
          text: "Text",
          height: 100,
          width: 100,
          fontSize: 16,
          fontWeight: 400,
          fontFamily: "Inter",
          fill: {r:217, g:217, b:217},
          stroke: {r:217, g:217, b:217},
          opacity: 100,
        })
      }

      if (layer) {
        liveLayerIds.push(layerId);
        liveLayers.set(layerId, layer);

        setMyPresence({selection: [layerId]}, {addToHistory: true})
        setCanvasState({ mode : CanvasMode.None})
      }
    },[]
  )

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
      zoom: camera.zoom,
    }));
  }, []);

  const insertPath = useMutation(({storage, self, setMyPresence}) => {
    const liveLayers = storage.get("layers")
    const {pencilDraft} = self.presence

    if (
      pencilDraft === null || 
      pencilDraft.length < 2 || 
      liveLayers.size >= MAX_LAYERS
    ) {
      setMyPresence({ pencilDraft: null})
      return;
    }

    const id = nanoid();
    liveLayers.set(
      id, 
      new LiveObject(
        penPointsToPathLayer(pencilDraft, {r: 217, g: 217, b: 217})
      )
    )

    const liveLayerIds = storage.get("layerIds");
    liveLayerIds.push(id);
    setMyPresence({pencilDraft: null})
    setCanvasState({mode: CanvasMode.Pencil})
  },[])

  const unselectLayer = useMutation(({self, setMyPresence}) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({selection: []}, {addToHistory: true})
    }
  },[])

  const translateSelectedLayer = useMutation(({storage, self}, point: Point) => {
    if (canvasState.mode !== CanvasMode.Translating) return;

    const offset = {
      x: point.x - canvasState.current.x,
      y: point.y - canvasState.current.y,
    }

    const liveLayers = storage.get("layers");
    for (const id of self.presence.selection) {
      const layer = liveLayers.get(id)
      if (layer) {
        layer.update({
          x: layer.get("x") + offset.x,
          y: layer.get("y") + offset.y,
        })
      }
    }

    setCanvasState({mode: CanvasMode.Translating, current: point})
  },[canvasState])

  const resizeSelectedLayer = useMutation(({storage, self}, point: Point) => {

    if (canvasState.mode !== CanvasMode.Resizing) {
      return;
    }

    const bounds = resizeBounds(canvasState.initialBounds, canvasState.corner, point)

    const liveLayers = storage.get("layers")

    if(self.presence.selection.length > 0) {
      const layer = liveLayers.get(self.presence.selection[0]!)
      if(layer) {
        layer.update(bounds)
      }
    }
  },[canvasState])
  
  const startDrawing = useMutation(({setMyPresence}, point: Point, pressure: number) => {
    setMyPresence({
      pencilDraft: [[point.x, point.y, pressure]],
      penColor: { r:217, g:217, b:217}
    })
  },[])

  const onPointerDown = useMutation(({}, e:React.PointerEvent) => {
    const point = pointerEventToCanvasPoint(e,camera)

    if (canvasState.mode === CanvasMode.Dragging) {
      setCanvasState({mode: CanvasMode.Dragging, origin: point})
      return;
    }
    if (canvasState.mode === CanvasMode.Pencil) {
      startDrawing(point, e.pressure)
      return;
    }
    if (canvasState.mode === CanvasMode.Inserting) return;

    setCanvasState({origin: point, mode: CanvasMode.Pressing})
  },[canvasState.mode, setCanvasState, camera, startDrawing])

  const continueDrawing = useMutation(({self, setMyPresence}, point: Point, e: React.PointerEvent) => {
    const {pencilDraft} = self.presence

    if(canvasState.mode !== CanvasMode.Pencil || pencilDraft === null || e.buttons !== 1) {
      return;
    }

    setMyPresence({
      pencilDraft: [...pencilDraft, [point.x, point.y, e.pressure]],
      penColor: { r:217, g:217, b:217}
    })
  },[canvasState.mode])

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setCanvasState({mode: CanvasMode.SelectionNet, origin, current})
    }
  },[])

  const updateSelectionNet = useMutation(({storage, setMyPresence}, current: Point, origin: Point) => {
    if (layerIds) {
      const layers = storage.get("layers").toImmutable()
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current
      })
      const ids = findIntersectionLayersWithRectangle(layerIds, layers, origin, current)
      setMyPresence({selection: ids})
    }
  },[layerIds])

  const onPointerMove = useMutation(({setMyPresence}, e:React.PointerEvent) => {
    const point = pointerEventToCanvasPoint(e,camera)

    if (canvasState.mode === CanvasMode.Pressing) {
      startMultiSelection(point, canvasState.origin)
    }
    else if (canvasState.mode === CanvasMode.SelectionNet) {
      updateSelectionNet(point, canvasState.origin)
    }
    else if (canvasState.mode === CanvasMode.Dragging && canvasState.origin !== null) {
      const deltaX = e.movementX
      const deltaY = e.movementY

      setCamera((camera) => ({
        x: camera.x + deltaX,
        y: camera.y + deltaY,
        zoom: camera.zoom
      }))
    }
    else if (canvasState.mode === CanvasMode.Pencil) {
      continueDrawing(point, e);
    }
    else if (canvasState.mode === CanvasMode.Resizing) {
      resizeSelectedLayer(point);
    }
    else if (canvasState.mode === CanvasMode.Translating) {
      translateSelectedLayer(point);
    }
    setMyPresence({cursor: point})
  },[
    camera,
    canvasState,
    translateSelectedLayer,
    continueDrawing,
    resizeSelectedLayer,
    updateSelectionNet,
    startMultiSelection,
  ])

  const onPointerUp = useMutation(({}, e:React.PointerEvent) => {
    if (canvasState.mode === CanvasMode.RightClick) return;
    
    const point = pointerEventToCanvasPoint(e,camera)

    if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
      unselectLayer();
      setCanvasState({mode: CanvasMode.None})
    }
    else if (canvasState.mode === CanvasMode.Inserting) {
      insertLayer(
        canvasState.layerType,
        point
      )
    }
    else if (canvasState.mode === CanvasMode.Dragging) {
      setCanvasState({mode: CanvasMode.Dragging,origin: null})
    }
    else if (canvasState.mode === CanvasMode.Pencil) {
      insertPath();
    }
    else {
      setCanvasState({mode: CanvasMode.None})
    }
    history.resume()
  },[canvasState, setCanvasState, insertLayer, unselectLayer, history])

  return (
    <div className="flex h-screen w-full">
      <main className="fixed left-0 right-0 h-screen overflow-y-auto">
        <div 
          style={{backgroundColor: roomColor ? colorToCss(roomColor) : "#1E1E1E"}}
          className="h-full w-full touch-none"
        >
          <SelectionTools 
            camera={camera} 
            canvasMode={canvasState.mode} setCanvasState={() => setCanvasState({mode: CanvasMode.None})}
          />
          <svg 
            onWheel={onWheel} 
            onPointerUp={onPointerUp} className="w-full h-full"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onContextMenu={(e) => e.preventDefault()}
          >
            <g 
              style={{
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`
              }}
            >
              {layerIds?.map((layerId) => (<LayerComponent key={layerId} id={layerId} onLayerPointerDown={onLayerPointerDown}/>))}

              <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown}/>

              {canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
                <rect 
                  x={Math.min(canvasState.origin.x, canvasState.current.x)}
                  y={Math.min(canvasState.origin.y, canvasState.current.y)}
                  width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                  height={Math.abs(canvasState.origin.y - canvasState.current.y)}
                  className="fill-blue-600/5 stroke-blue-600 stroke-[0.5]"
                />
              )}
            </g>
            {
              pencilDraft !== null && 
              pencilDraft.length > 0 &&
              <Path 
                x={0} 
                y={0}
                opacity={100}
                fill={colorToCss({r: 217, g: 217, b: 217})} 
                points={pencilDraft} 
              />
            }
          </svg>
        </div>
      </main>

      <ToolsBar
        canvasState={canvasState}
        setCanvasState={(newState) => setCanvasState(newState)}
        zoomIn={() => {
          setCamera((camera) => ({...camera, zoom: camera.zoom + 0.1}))
        }} 
        zoomOut={() => {
          setCamera((camera) => ({...camera, zoom: camera.zoom - 0.1}))
        }} 
        canZoomIn={camera.zoom < 2} 
        canZoomOut={camera.zoom > 0.5}
        undo={() => history.undo()}
        redo={() => history.redo()}
        canRedo={canRedo}
        canUndo={canUndo}
      />

      <Sidebars 
        leftIsMinimized={leftIsMinimized}
        setLeftIsMinimized={setLeftIsMinimized}
      />
    </div>
  )
}