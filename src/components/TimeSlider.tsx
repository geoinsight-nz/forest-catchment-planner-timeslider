import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./Tooltip";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Slider,
  Rail,
  Handles,
  Tracks,
  Ticks,
  SliderItem,
  GetHandleProps,
  GetTrackProps,
} from "react-compound-slider";
import * as R from "ramda";
import { ReactComponent as Play } from "../assets/Play.svg";
import { ReactComponent as Pause } from "../assets/Pause.svg";
import { ReactComponent as Next } from "../assets/Next.svg";
import { ReactComponent as FullSpeed } from "../assets/FullSpeed.svg";
import { ReactComponent as HalfSpeed } from "../assets/HalfSpeed.svg";
import { ReactComponent as DoubleSpeed } from "../assets/DoubleSpeed.svg";
import { ReactComponent as Previous } from "../assets/Previous.svg";

const findClosest = (x: number, arr: number[]) => {
  const indexArr = R.map((k) => Math.abs(k - x), arr);
  const min = Math.min(...indexArr);
  return arr[indexArr.indexOf(min)];
};

type ControlButtonProps = {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const ControlButton: React.FC<ControlButtonProps> = (
  props: ControlButtonProps
) => {
  const { icon, onClick, tooltip } = props;
  const buttonProps = {
    "aria-label": tooltip,
    onClick,
    className: "control-button",
  };

  return (
    <TooltipProvider key={`time-slider-button`}>
      <Tooltip>
        <TooltipTrigger {...buttonProps}>{icon}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={12}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

type HandleProps = {
  times: number[];
  handle: SliderItem;
  isSliding: boolean;
  getHandleProps: GetHandleProps;
  setIsHovered: (isHovered: boolean) => void;
  isHovered: boolean;
};

export const Handle: React.FC<HandleProps> = (props: HandleProps) => {
  const {
    times,
    handle: { id, value, percent },
    isSliding,
    getHandleProps,
    setIsHovered,
    isHovered,
  } = props;
  const [dragging, setDragging] = useState(false);
  return (
    <TooltipProvider>
      <Tooltip open={isSliding || isHovered}>
        <TooltipTrigger
          className="handle__trigger"
          style={{
            left: `${percent}%`,
          }}
          {...getHandleProps(id)}
          onMouseEnter={() => {
            setDragging(true);
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setDragging(false);
            setIsHovered(false);
          }}
          role="slider"
          aria-valuemin={times[0]}
          aria-valuemax={times[times.length - 1]}
          aria-valuenow={value}
        >
          {dragging && <div className="handle__drag" />}
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={12}>
          {findClosest(value, times)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

type TrackProps = {
  source: SliderItem;
  target: SliderItem;
  getTrackProps: GetTrackProps;
};

export const Track: React.FC<TrackProps> = (props: TrackProps) => {
  const {
    source: { percent: sourcePercent },
    target: { percent: targetPercent },
    getTrackProps,
  } = props;
  return (
    <div
      className="track"
      style={{
        left: `${sourcePercent}%`,
        width: `${targetPercent - sourcePercent}%`,
      }}
      {...getTrackProps()}
    />
  );
};

type TickProps = {
  key: string;
  tick: SliderItem;
  count: number;
  showDate: boolean;
};

export const Tick: React.FC<TickProps> = (props: TickProps) => {
  const {
    tick: { percent, value },
    count,
    showDate,
  } = props;
  return (
    <div>
      <div
        className="tick"
        style={{
          left: `${percent}%`,
        }}
      />
      {showDate && (
        <div
          className="tick__date"
          style={{
            marginLeft: `${-(100 / count) / 2}%`,
            width: `${100 / count}%`,
            left: `${percent}%`,
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
};

type TickRenderProps = {
  ticks: SliderItem[];
};

const TickRender: React.FC<TickRenderProps> = (props: TickRenderProps) => {
  const { ticks } = props;
  return (
    <>
      {ticks.map((tick: SliderItem, idx: number) => (
        <Tick
          key={tick.id}
          tick={tick}
          count={ticks.length}
          showDate={idx % 5 === 0 || idx === 0}
        />
      ))}
    </>
  );
};

type TimeSliderProps = {
  times: number[];
  setSelectedTime: (time: number) => void;
  mode?: "single" | "range";
};

export const TimeSlider: React.FC<TimeSliderProps> = (
  props: TimeSliderProps
) => {
  const { times, mode = "single" } = props;
  const [values, setValues] = useState<number[]>([times[0]]);
  const [isSliding, setIsSliding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState(1000);
  const [isPlaying, setIsPlaying] = useState(false);
  const domain: number[] = [times[0], times[times.length - 1]];
  const timeoutIdRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Called to account for is onSlideEnd is not triggered and different modes
    if (!isSliding) {
      timeoutIdRef.current = setTimeout(() => {
        if (mode === "single") {
          const firstValue = findClosest(values[0], times);
          if (firstValue !== values[0]) {
            setValues([firstValue]);
          }
        } else if (mode === "range") {
          const firstValue = findClosest(values[0], times);
          const secondValue = findClosest(values[1], times);
          if (firstValue !== values[0] || secondValue !== values[1]) {
            setValues([firstValue, secondValue]);
          }
        }
      }, 200);
    }
    return () => clearTimeout(timeoutIdRef.current);
  }, [values, isSliding, mode, times]);

  const timesRef = useRef<number[]>();

  useEffect(() => {
    // Set initial values based on mode 'single' (single time) or mode 2 (time range)
    if (mode === "single" && !R.equals(timesRef.current, times)) {
      setValues([times[0]]);
      timesRef.current = times;
    } else if (mode === "range" && !R.equals(timesRef.current, times)) {
      setValues([times[0], times[times.length - 1]]);
      timesRef.current = times;
    }
  }, [mode, times]);

  const prevValueRef = useRef<number>();

  useEffect(() => {
    if (
      prevValueRef.current !== values[0] ||
      prevValueRef.current === undefined
    ) {
      // When slider is properly expanded to be a range this will need to be updated here
      if (mode === "single") {
        const firstValue = findClosest(values[0], times);
        props.setSelectedTime(firstValue);
      }
    }

    prevValueRef.current = values[0];
  }, [mode, times, values, props]);

  useEffect(() => {
    const playCycle = () => {
      timeoutIdRef.current = setTimeout(() => {
        const index = R.findIndex((time: number) => time === values[0], times);
        const nextIndex = (index + 1) % times.length;
        setValues([times[nextIndex]]);
        playCycle();
      }, playbackInterval);
    };

    if (isPlaying) {
      playCycle();
    } else {
      clearTimeout(timeoutIdRef.current);
    }

    return () => clearTimeout(timeoutIdRef.current);
  }, [isPlaying, playbackInterval, times, values]);

  const onChange = (newValues: readonly number[]) => {
    setValues(newValues as number[]);
  };

  const onSlide = () => {
    setIsSliding(true);
  };

  const onSlideEnd = useCallback(
    (ms: readonly number[]) => {
      setIsSliding(false);
      if (mode === "single") {
        const firstValue = findClosest(ms[0], times);
        setValues([firstValue]);
      } else if (mode === "range") {
        const firstValue = findClosest(ms[0], times);
        const secondValue = findClosest(ms[1], times);
        setValues([firstValue, secondValue]);
      }
    },
    [mode, times]
  );

  const onUpdate = (ms: readonly number[]) => {
    setValues(ms as number[]);
  };

  const onClickNextTime = () => {
    const index = R.findIndex((time: number) => time === values[0], times);
    const nextIndex = (index + 1) % times.length;
    setValues([times[nextIndex]]);
  };

  const onClickPreviousTime = () => {
    const index = R.findIndex((time: number) => time === values[0], times);
    const nextIndex = (index - 1 + times.length) % times.length;
    setValues([times[nextIndex]]);
  };

  const onClickPlaybackInterval = useCallback(() => {
    if (playbackInterval === 1000) {
      setPlaybackInterval(500);
    } else if (playbackInterval === 500) {
      setPlaybackInterval(2000);
    } else if (playbackInterval === 2000) {
      setPlaybackInterval(1000);
    }
  }, [playbackInterval]);

  const onClickSpeedIcon = (speed: number) => {
    if (speed === 1000) {
      return <FullSpeed />;
    } else if (speed === 500) {
      return <DoubleSpeed />;
    } else if (speed === 2000) {
      return <HalfSpeed />;
    }
  };

  return (
    <div className="timeslider">
      <div className="timeslider__container">
        <div className="timeslider__button-group">
          <ControlButton
            tooltip="Previous"
            onClick={onClickPreviousTime}
            icon={<Previous />}
          />
          <ControlButton
            tooltip={isPlaying ? "Pause" : "Play"}
            onClick={() => setIsPlaying(!isPlaying)}
            icon={isPlaying ? <Pause /> : <Play />}
          />
          <ControlButton
            tooltip="Next"
            onClick={onClickNextTime}
            icon={<Next />}
          />
        </div>
        <Slider
          mode={2}
          domain={domain}
          className="timeslider__slider"
          onChange={onChange}
          values={values}
          onSlideStart={onSlide}
          onSlideEnd={onSlideEnd}
          onUpdate={onUpdate}
        >
          <Rail>
            {({
              getRailProps,
            }: {
              getRailProps: () => React.HTMLAttributes<HTMLDivElement>;
            }) => <div className="timeslider__rail" {...getRailProps()} />}
          </Rail>
          <Handles>
            {({
              handles,
              getHandleProps,
            }: {
              handles: SliderItem[];
              getHandleProps: (
                id: string
              ) => React.HTMLAttributes<HTMLDivElement>;
            }) => (
              <div>
                {R.map(
                  (handle: SliderItem) => (
                    <Handle
                      isSliding={isSliding}
                      key={handle.id}
                      handle={handle}
                      times={times}
                      getHandleProps={getHandleProps}
                      setIsHovered={setIsHovered}
                      isHovered={isHovered}
                    />
                  ),
                  handles
                )}
              </div>
            )}
          </Handles>
          <Tracks left={false} right={false}>
            {({
              tracks,
              getTrackProps,
            }: {
              tracks: { id: string; source: SliderItem; target: SliderItem }[];
              getTrackProps: () => React.HTMLAttributes<HTMLDivElement>;
            }) => (
              <div>
                {R.map(
                  ({
                    id,
                    source,
                    target,
                  }: {
                    id: string;
                    source: SliderItem;
                    target: SliderItem;
                  }) => (
                    <Track
                      key={id}
                      source={source}
                      target={target}
                      getTrackProps={getTrackProps}
                    />
                  ),
                  tracks
                )}
              </div>
            )}
          </Tracks>
          <Ticks values={times}>
            {({ ticks }: { ticks: SliderItem[] }) => (
              <div>
                <TickRender ticks={ticks} />
              </div>
            )}
          </Ticks>
        </Slider>
        <div className="timeslider__button-group">
          <ControlButton
            tooltip="Speed"
            onClick={onClickPlaybackInterval}
            icon={onClickSpeedIcon(playbackInterval)}
          />
        </div>
      </div>
      <div className="timeslider__bottom-bar" />
    </div>
  );
};

export const __test = { findClosest };
