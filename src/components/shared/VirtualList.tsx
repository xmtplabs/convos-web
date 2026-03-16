import type { ScrollToOptions } from "@tanstack/virtual-core";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type Ref,
} from "react";
import {
  useVirtualList,
  type UseVirtualListOptions,
} from "@/hooks/useVirtualList";
import classes from "./VirtualList.module.css";

export type VirtualListProps<T> = UseVirtualListOptions<T> & {
  alignToBottom?: boolean;
  innerClassName?: string;
  outerClassName?: string;
  renderItem: (item: T, index: number) => ReactNode;
};

export type VirtualListHandle = {
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
};

const VirtualList = <T,>(
  {
    alignToBottom,
    bottomThreshold,
    estimateSize,
    followOutput,
    getItemKey,
    initialScrollIndex,
    innerClassName,
    items,
    outerClassName,
    overscan,
    renderItem,
  }: VirtualListProps<T>,
  ref: React.Ref<VirtualListHandle>,
) => {
  const { virtualizer, scrollContainerRef } = useVirtualList({
    bottomThreshold,
    estimateSize,
    followOutput,
    getItemKey,
    initialScrollIndex,
    items,
    overscan,
  });

  useImperativeHandle(ref, () => ({
    scrollToIndex: virtualizer.scrollToIndex,
  }));

  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateScrollbar = useCallback(() => {
    const el = scrollContainerRef.current;
    const thumb = thumbRef.current;
    const track = trackRef.current;
    if (!el || !thumb || !track) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      thumb.style.display = "none";
      return;
    }

    const trackHeight = track.clientHeight;
    const thumbHeight = Math.max(
      (clientHeight / scrollHeight) * trackHeight,
      24,
    );
    const thumbTop =
      (scrollTop / (scrollHeight - clientHeight)) * (trackHeight - thumbHeight);

    thumb.style.display = "";
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${thumbTop}px)`;
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }

    el.addEventListener("scroll", updateScrollbar, { passive: true });
    return () => {
      el.removeEventListener("scroll", updateScrollbar);
    };
  }, [scrollContainerRef, updateScrollbar]);

  // update scrollbar when virtualizer measurements change
  const totalSize = virtualizer.getTotalSize();
  useEffect(() => {
    updateScrollbar();
  }, [totalSize, updateScrollbar]);

  return (
    <div
      style={{
        position: "relative",
        minHeight: 0,
      }}
      className={`${outerClassName ?? ""} ${classes.root}`}>
      <div
        ref={scrollContainerRef}
        className={classes.scroller}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "auto",
          ...(alignToBottom && {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }),
        }}>
        <div
          className={innerClassName}
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
          }}>
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}>
              {items[virtualItem.index] != null &&
                renderItem(items[virtualItem.index], virtualItem.index)}
            </div>
          ))}
        </div>
      </div>
      <div ref={trackRef} className={classes.track}>
        <div ref={thumbRef} className={classes.thumb} />
      </div>
    </div>
  );
};

export default forwardRef(VirtualList) as <T>(
  props: VirtualListProps<T> & { ref?: Ref<VirtualListHandle> },
) => React.ReactNode;
