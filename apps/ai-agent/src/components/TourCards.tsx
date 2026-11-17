import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  MapPin,
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
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="tour-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
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
  config,
  destination,
  onBack,
  onDetails,
  onInquiry,
  reduced,
  speed,
  detailRequest,
}: {
  config: Effects["cards"];
  destination: string;
  onBack: () => void;
  onDetails: (id: string) => void;
  onInquiry: () => void;
  reduced: boolean;
  speed: number;
  detailRequest: number;
}) {
  const [list, setList] = useState<Tour[]>([]),
    [selected, setSelected] = useState<Tour | null>(null),
    [index, setIndex] = useState(0);
  const lastDetail = useRef(0);
  useEffect(() => {
    if (detailRequest > lastDetail.current && list.length) {
      lastDetail.current = detailRequest;
      setSelected(list[0]);
      onDetails(list[0].id);
    }
  }, [detailRequest, list, onDetails]);
  const rail = useRef<HTMLDivElement>(null),
    drag = useRef<{
      x: number;
      scroll: number;
      last: number;
      time: number;
      velocity: number;
    } | null>(null),
    dragged = useRef(false),
    frame = useRef(0);
  useEffect(() => {
    let active = true;
    new MockTourProvider().list(destination).then((data) => {
      if (active) {
        setList(data);
        setIndex(0);
        rail.current?.scrollTo({ left: 0 });
      }
    });
    return () => {
      active = false;
    };
  }, [destination]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const open = (tour: Tour) => {
    if (dragged.current) return;
    setSelected(tour);
    onDetails(tour.id);
  };
  const move = (direction: number) =>
    rail.current?.scrollBy({
      left: (config.width + config.gap) * direction,
      behavior: reduced ? "instant" : "smooth",
    });
  const release = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !rail.current) return;
    const node = rail.current;
    node.style.scrollSnapType = "";
    if (reduced) return;
    let velocity = d.velocity;
    const tick = () => {
      velocity *= 0.92;
      node.scrollLeft -= velocity * 16;
      if (Math.abs(velocity) > 0.08)
        frame.current = requestAnimationFrame(tick);
      else
        node.scrollTo({
          left:
            Math.round(node.scrollLeft / (config.width + config.gap)) *
            (config.width + config.gap),
          behavior: "smooth",
        });
    };
    frame.current = requestAnimationFrame(tick);
  };
  return (
    <motion.section
      className="tour-panel glass"
      initial={{
        opacity: 0,
        y: reduced ? 0 : 35,
        scale: reduced ? 1 : 0.97,
        borderRadius: 80,
      }}
      animate={{ opacity: 1, y: 0, scale: 1, borderRadius: 32 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{
        duration: config.duration / speed,
        type: "spring",
        bounce: reduced ? 0 : config.spring,
      }}
      aria-label="Explore Vietnam tours"
    >
      <div className="tour-heading">
        <div>
          <span className="eyebrow">GOOD PLACES. GREAT STORIES.</span>
          <h2>Your next adventure.</h2>
        </div>
        <button className="text-button" onClick={onBack}>
          <ArrowDownLeft size={16} />
          Back to our conversation
        </button>
      </div>
      <div
        className="tour-rail"
        ref={rail}
        tabIndex={0}
        aria-label="Swipe through sample tours"
        style={{ gap: config.gap }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
        onScroll={() => {
          if (rail.current)
            setIndex(
              Math.round(rail.current.scrollLeft / (config.width + config.gap)),
            );
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          cancelAnimationFrame(frame.current);
          dragged.current = false;
          drag.current = {
            x: e.clientX,
            scroll: e.currentTarget.scrollLeft,
            last: e.clientX,
            time: performance.now(),
            velocity: 0,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const diff = e.clientX - d.x;
          if (Math.abs(diff) > 5) {
            dragged.current = true;
            e.currentTarget.style.scrollSnapType = "none";
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          const now = performance.now();
          d.velocity =
            ((e.clientX - d.last) / Math.max(1, now - d.time)) * config.swipe;
          d.last = e.clientX;
          d.time = now;
          e.currentTarget.scrollLeft = d.scroll - diff * config.swipe;
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <AnimatePresence mode="popLayout">
          {list.map((tour, i) => (
            <motion.article
              key={tour.id}
              layout
              className="tour-card"
              style={{
                width: config.width,
                minHeight: config.height,
                borderRadius: config.radius,
                background: `rgba(255,255,255,${config.opacity})`,
              }}
              initial={{
                opacity: 0,
                scale: reduced ? 1 : 0.92,
                y: reduced ? 0 : 30,
                filter: `blur(${reduced ? 0 : config.blur}px)`,
              }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                scale: 0.94,
                filter: `blur(${reduced ? 0 : config.blur}px)`,
              }}
              transition={{
                duration: config.duration / speed,
                delay: reduced ? 0 : (i * config.stagger) / speed,
                type: "spring",
                bounce: config.spring,
              }}
              whileHover={reduced ? {} : { scale: config.focus }}
            >
              <div className="tour-photo">
                <img
                  src={tour.image}
                  alt={`${tour.destination}, Vietnam`}
                  draggable={false}
                  loading={i === 0 ? "eager" : "lazy"}
                  style={{ transform: `scale(${config.imageScale})` }}
                  onLoad={(e) => e.currentTarget.classList.add("loaded")}
                />
                <span>{tour.tag}</span>
              </div>
              <div className="tour-copy">
                <p className="tour-location">
                  <MapPin size={12} />
                  {tour.destination}
                </p>
                <h3>{tour.title}</h3>
                <p className="tour-description">{tour.description}</p>
                <div className="tour-meta">
                  <Clock3 size={13} />
                  {tour.duration}
                </div>
                <div className="card-highlights">
                  {tour.highlights.slice(0, 2).map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>
                <button className="card-link" onClick={() => open(tour)}>
                  View details <ArrowRight size={17} />
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <div className="tour-bottom">
        <p>Sample experiences · Details confirmed by our team</p>
        <div className="rail-controls">
          <span className="rail-count">
            {String(Math.min(index + 1, list.length)).padStart(2, "0")} /{" "}
            {String(list.length).padStart(2, "0")}
          </span>
          <button
            className="icon-button"
            onClick={() => move(-1)}
            aria-label="Previous tour"
            disabled={index <= 0}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            className="icon-button"
            onClick={() => move(1)}
            aria-label="Next tour"
            disabled={index >= list.length - 1}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      {selected && (
        <TourDetails
          tour={selected}
          reduced={reduced}
          onClose={() => setSelected(null)}
          onInquiry={() => {
            setSelected(null);
            onInquiry();
          }}
        />
      )}
    </motion.section>
  );
}
