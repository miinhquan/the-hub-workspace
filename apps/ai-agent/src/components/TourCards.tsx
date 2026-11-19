import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Pause,
  Play,
  X,
} from "lucide-react";
import type { Effects } from "../config";
import { MockTourProvider, type Tour } from "../engine/providers";
export function TourDetails({
  tour,
  onClose,
  onInquiry,
  reduced,
}: {
  tour: Tour;
  onClose: () => void;
  onInquiry: () => void;
  reduced: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="tour-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="tour-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: reduced ? 1 : 0.97, y: reduced ? 0 : 12 }}
        transition={{ duration: reduced ? 0.01 : 0.25 }}
        className="tour-detail"
      >
        <div className="detail-photo">
          <img src={tour.image} alt={`${tour.destination} landscape`} />
          <button
            className="icon-button detail-close"
            onClick={onClose}
            aria-label="Close tour details"
          >
            <X size={20} />
          </button>
          <span className="photo-label">A LITTLE INSPIRATION</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{tour.destination} · DEMO ITINERARY</span>
          <h2 id="tour-title">{tour.title}</h2>
          <p className="detail-duration">
            <Clock3 size={15} />
            {tour.duration}
          </p>
          <p>{tour.description}</p>
          <div className="detail-highlights">
            {tour.highlights.map((h) => (
              <span key={h}>
                <Check size={14} />
                {h}
              </span>
            ))}
          </div>
          <h3>A glimpse of the journey</h3>
          <ol>
            {tour.itinerary.map((s, i) => (
              <li key={s}>
                <span>0{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="sample-note">
            Illustrative tour only. The Hub team must confirm itinerary,
            duration, price, and availability before any booking.
          </p>
          <button className="primary-button" onClick={onInquiry}>
            Prepare a demo inquiry <ArrowRight size={17} />
          </button>
        </div>
      </motion.div>
    </dialog>
  );
}
export function TourCards({
  children,
  visible,
  config,
  destination,
  onBack,
  onDetails,
  onInquiry,
  reduced,
  speed,
  detailRequest,
}: {
  children: ReactNode;
  visible: boolean;
  config: Effects["cards"];
  destination: string;
  onBack: () => void;
  onDetails: (id: string) => void;
  onInquiry: () => void;
  reduced: boolean;
  speed: number;
  detailRequest: number;
}) {
  const [collection, setCollection] = useState<{
    destination: string;
    tours: Tour[];
  }>();
  const [enlarged, setEnlarged] = useState<string[]>([]);
  const [detail, setDetail] = useState<Tour | null>(null);
  const [paused, setPaused] = useState(false);
  const lastDetail = useRef(0);
  const turn = useRef(0);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    turn: number;
  } | null>(null);
  const dragged = useRef(false);
  const tours =
    collection?.destination === destination ? collection.tours : undefined;

  useEffect(() => {
    if (!visible) return;
    let active = true;
    new MockTourProvider().list(destination).then((result) => {
      if (active) setCollection({ destination, tours: result });
    });
    return () => {
      active = false;
    };
  }, [visible, destination]);

  const enlarge = useCallback((id: string) => {
    setEnlarged((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);
  const openDetails = useCallback(
    (tour: Tour) => {
      enlarge(tour.id);
      setDetail(tour);
      onDetails(tour.id);
    },
    [enlarge, onDetails],
  );

  useEffect(() => {
    if (!visible) {
      setDetail(null);
      drag.current = null;
      dragged.current = false;
    }
    if (!detailRequest) lastDetail.current = 0;
    if (visible && detailRequest > lastDetail.current && tours?.length) {
      lastDetail.current = detailRequest;
      openDetails(tours[0]);
    }
  }, [visible, detailRequest, tours, openDetails]);

  const rotate = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || event.pointerId !== start.id || event.buttons !== 1) return;
    const dx = event.clientX - start.x;
    if (!dragged.current) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(event.clientY - start.y))
        return;
      dragged.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    turn.current =
      (start.turn +
        (dx / event.currentTarget.clientWidth) * 100 * config.swipe) %
      100;
    event.currentTarget.style.setProperty("--orbit-shift", `${turn.current}%`);
  };
  const geometry = {
    "--card-width": config.width,
    "--orbit-height": `${config.height}px`,
    "--orbit-spacing": `${config.gap / 2}px`,
    "--enlarged-scale": config.focus,
    "--card-radius": `${config.radius}px`,
    "--image-scale": config.imageScale,
    "--glass-opacity": config.opacity,
    "--idle-blur": `${Math.min(2.5, config.blur / 7)}px`,
    "--orbit-period": `${128 / speed}s`,
    "--photo-transition": `${reduced ? 0 : config.duration / speed}s`,
  } as CSSProperties;

  return (
    <>
      {visible && (
        <div className="orbit-heading">
          <h2>Explore Vietnam</h2>
          <div className="orbit-actions">
            {!reduced && (
              <button
                className="icon-button"
                onClick={() => setPaused(!paused)}
                aria-label={paused ? "Resume tour orbit" : "Pause tour orbit"}
                title={paused ? "Resume tour orbit" : "Pause tour orbit"}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
            <button
              className="text-button"
              onClick={onBack}
              aria-label="Back to conversation"
            >
              <ArrowLeft size={16} />{" "}
              <span>
                Back<span className="back-context"> to conversation</span>
              </span>
            </button>
          </div>
        </div>
      )}
      <div
        className={`session-visual${visible ? " tour-scene" : ""}`}
        style={visible ? geometry : undefined}
      >
        {children}
        {visible && (
          <div
            className="tour-orbit"
            role="group"
            aria-label="Orbiting tour photos"
            style={
              {
                "--orbit-shift": `${turn.current}%`,
                animationPlayState: reduced || paused ? "paused" : "running",
              } as CSSProperties
            }
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              dragged.current = false;
              drag.current = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                turn: turn.current,
              };
            }}
            onPointerMove={rotate}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onClickCapture={(event) => {
              if (dragged.current && event.detail > 0) {
                dragged.current = false;
                event.stopPropagation();
              }
            }}
          >
            <div className="tour-path">
              {tours?.map((tour, index) => {
                const isEnlarged = enlarged.includes(tour.id);
                return (
                  <div
                    className="orbit-satellite"
                    key={tour.id}
                    style={
                      {
                        "--start-distance": `${62.5 + (index * 100) / tours.length}%`,
                      } as CSSProperties
                    }
                  >
                    <motion.article
                      className="orbit-card"
                      data-enlarged={isEnlarged}
                      initial={{ opacity: 0, scale: reduced ? 1 : 0.72 }}
                      animate={{
                        opacity: 1,
                        scale: isEnlarged ? config.focus : 0.79,
                        rotate: isEnlarged ? 0 : index % 2 === 0 ? -3 : 3,
                      }}
                      transition={{
                        duration: reduced ? 0 : config.duration / speed,
                        type: reduced ? "tween" : "spring",
                        bounce: config.spring,
                        opacity: {
                          duration: reduced ? 0 : config.duration / speed,
                          delay: reduced ? 0 : (index * config.stagger) / speed,
                        },
                      }}
                    >
                      <button
                        type="button"
                        className="orbit-photo"
                        aria-label={`Enlarge ${tour.destination} photo`}
                        aria-pressed={isEnlarged}
                        onClick={() => enlarge(tour.id)}
                      >
                        <img src={tour.image} alt="" draggable={false} />
                        <span className="orbit-place">{tour.destination}</span>
                      </button>
                      {isEnlarged && (
                        <button
                          className="orbit-details"
                          type="button"
                          aria-label={`View details for ${tour.title}`}
                          title={`View details for ${tour.title}`}
                          onClick={() => openDetails(tour)}
                        >
                          <span>View details</span>
                          <ArrowUpRight size={16} />
                        </button>
                      )}
                    </motion.article>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {visible && detail && (
          <TourDetails
            key={detail.id}
            tour={detail}
            reduced={reduced}
            onClose={() => setDetail(null)}
            onInquiry={() => {
              setDetail(null);
              onInquiry();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
