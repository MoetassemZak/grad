import { useSelf, useStorage } from "@liveblocks/react";
import { memo, useEffect, useRef, useState } from "react";
import useSelectionBounds from "~/hooks/useSelectionBounds";
import { LayerType, Side, XYWH } from "~/types";

const handleWidth = 8;

//memo prevents the component from rerendering when the parent component rerenders, and it will only rerender when the paramter changes
const SelectionBox = memo(
  ({
    onResizeHandlePointerDown,
  }: {
    onResizeHandlePointerDown: (corner: Side, initalBuild: XYWH) => void;
  }) => {
    
    const soleLayerId = useSelf((me) => me.presence.selection.length === 1 ? me.presence.selection[0] : null)

    const isShowingHandles = useStorage((root) => soleLayerId && root.layers.get(soleLayerId)?.type !== LayerType.Path,
    )
    
    const bounds = useSelectionBounds()
    const textRef = useRef<SVGTextElement>(null);
    const [textWidth, setTextWidth] = useState(0);
    const padding = 16;

    useEffect(() => {
      if (textRef.current) {
        const bbox = textRef.current.getBBox();
        setTextWidth(bbox.width)
      }
    },[bounds])

    if(!bounds) return null;

    return (
      <>
        <rect 
          className="pointer-events-none fill-transparent stroke-[#0b99ff] stroke-[1px]"
          style={{transform: `translate(${bounds.x}px, ${bounds.y}px)`}}
          width={bounds.width}
          height={bounds.height}
        />
        <rect 
          className="fill-[#0b99ff]"
          x={bounds.x + bounds.width / 2 - (textWidth + padding) / 2}
          y={bounds.y + bounds.height + 10}
          width={textWidth + padding}
          height={20}
          rx={4}
        />
        <text 
          className="pointer-events-none select-none fill-white text-[11px]"
          style={{transform: `translate(${bounds.x + bounds.width/2}px, ${bounds.y + bounds.height + 25}px)`}}
          textAnchor="middle"
          ref={textRef}
        >
          {Math.round(bounds.width)} x {Math.round(bounds.height)}
        </text>

        {isShowingHandles && (
          <>
            {/* top-left */}
            <rect
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x - handleWidth / 2}px, ${bounds.y - handleWidth / 2}px)`,
                cursor: 'nwse-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Top + Side.Left, bounds)
              }}
            />

            {/* top */}
            <rect 
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x + bounds.width / 2 - handleWidth / 2}px, ${bounds.y - handleWidth / 2}px)`,
                cursor: 'ns-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Top, bounds)
              }}
            />

            {/* top-right */}
            <rect 
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x + bounds.width - handleWidth / 2}px, ${bounds.y - handleWidth / 2}px)`,
                cursor: 'nesw-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Top + Side.Right, bounds)
              }}
            />

            {/* left */}
            <rect 
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x - handleWidth / 2}px, ${bounds.y + bounds.height / 2 - handleWidth / 2}px)`,
                cursor: 'ew-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Left, bounds)
              }}
            />

            {/* bottom-left */}
            <rect 
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x - handleWidth / 2}px, ${bounds.y + bounds.height - handleWidth / 2}px)`,
                cursor: 'nesw-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Bottom + Side.Left, bounds)
              }}
            />

            {/* right */}
            <rect 
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x + bounds.width - handleWidth / 2}px, ${bounds.y + bounds.height / 2 - handleWidth / 2}px)`,
                cursor: 'ew-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Right, bounds)
              }}
            />

            {/* bottom-right */}
            <rect 
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x + bounds.width - handleWidth / 2}px, ${bounds.y + bounds.height - handleWidth / 2}px)`,
                cursor: 'nwse-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Right + Side.Bottom, bounds)
              }}
            />

            {/* bottom */}
            <rect 
              className="fill-white stroke-[#0b99ff] stroke-[1px]"
              style={{
                width: `${handleWidth}px`,
                height: `${handleWidth}px`,
                transform: `translate(${bounds.x + bounds.width / 2 - handleWidth / 2}px, ${bounds.y + bounds.height - handleWidth / 2}px)`,
                cursor: 'ns-resize'
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.Bottom, bounds)
              }}
            />
          </>
        )}
      </>
    );
  }
);

SelectionBox.displayName = "SelectionBox";

export default SelectionBox;