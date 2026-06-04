import { DAYS } from "../shared/constants";
import { motion } from "framer-motion"; // [MỚI]

/**
 * WeeklyGrid — Hiển thị TKB tuần.
 *  - PC (≥ md): bảng 6 ngày × 10 tiết (Sáng + Chiều) như cũ.
 *  - Mobile (< md): chế độ Agenda — gom theo ngày, mỗi tiết một dòng card,
 *    dễ chạm + cuộn dọc, không cần cuộn ngang.
 *
 * Props:
 *   lichDay        — mảng dữ liệu lịch dạy tuần
 *   weekOffset     — offset tuần hiện tại (dùng để tính ngày)
 *   draftPlans     — { [matkb]: { items, cancelled, tenbaihoc } }
 *   onOpenQuickAdd — callback(thu, tiet) khi click ô trống
 *   onXemGoiY      — callback(item) khi bấm "Chỉnh sửa"
 *   onDeleteTiet   — callback(item) khi bấm nút xoá (chỉ khả dụng nếu chưa gửi duyệt)
 */

const DAY_LABELS = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
};

const fmtShortDate = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  if (isNaN(x.getTime())) return "";
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
};

function getDateForCell(thu, weekOffset = 0) {
  const d = new Date();
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  d.setDate(d.getDate() + weekOffset * 7);
  d.setDate(d.getDate() + (thu - 2));
  return d;
}

function deriveCellMeta(item, draftPlans) {
  const draft = draftPlans?.[item?.matkb];
  const isSubmitted = !!item?.ticketstatus && item.ticketstatus !== "BanNhap";
  const isReadyForPickup = item?.ticketstatus === "DaChuanBi";
  let activeItemCount = 0;
  if (draft) {
    activeItemCount = draft.cancelled ? 0 : draft.items.length;
  } else {
    activeItemCount = item?.suggestions ? item.suggestions.length : 0;
  }
  const lessonName =
    draft &&
    !draft.cancelled &&
    draft.tenbaihoc != null &&
    String(draft.tenbaihoc).trim() !== ""
      ? String(draft.tenbaihoc).trim()
      : item?.tenbaihoc;
  return {
    draft,
    isSubmitted,
    isReadyForPickup,
    activeItemCount,
    lessonName,
    hasDevice: activeItemCount > 0,
  };
}

export default function WeeklyGrid({
  lichDay,
  draftPlans = {},
  weekOffset = 0,
  onOpenQuickAdd,
  onXemGoiY,
  onDeleteTiet,
}) {
  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    if (typeof onDeleteTiet === "function") onDeleteTiet(item);
  };

  /* =================== DESKTOP TABLE CELL =================== */
  const renderCell = (thu, tiet) => {
    const item = lichDay.find(
      (l) => Number(l.thu) === thu && Number(l.tiethoc) === tiet,
    );

    if (!item) {
      return (
        <td
          key={thu}
          className="text-center align-middle"
          style={{ width: "14%", cursor: "pointer", transition: "all 0.2s" }}
          onClick={() => onOpenQuickAdd(thu, tiet)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e6fffa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "";
          }}
        >
          <i
            className="bi bi-plus-circle"
            style={{
              fontSize: "1.2rem",
              opacity: 0.3,
              color: "var(--brand-700)",
            }}
          ></i>
        </td>
      );
    }

    const {
      draft,
      isSubmitted,
      isReadyForPickup,
      activeItemCount,
      lessonName,
      hasDevice,
    } = deriveCellMeta(item, draftPlans);

    let hBg = "bg-white";
    if (isReadyForPickup) {
      hBg = "bg-primary bg-opacity-10 border-primary";
    } else if (isSubmitted) {
      hBg = "bg-success bg-opacity-10";
    } else if (draft) {
      hBg = draft.cancelled
        ? "bg-secondary bg-opacity-10"
        : "bg-info bg-opacity-10 border-info";
    } else if (hasDevice) {
      hBg = "bg-warning bg-opacity-10 border-warning";
    }

    return (
      <td
        key={thu}
        className={`text-center align-middle ${hBg}`}
        style={{ width: "14%", verticalAlign: "top", position: "relative" }}
      >
        {!isSubmitted && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger position-absolute top-0 start-0 m-1 p-0 d-flex align-items-center justify-content-center"
            style={{ width: 24, height: 24, lineHeight: 1, borderRadius: 6 }}
            title="Xoá tiết này khỏi lịch"
            onClick={(e) => handleDeleteClick(e, item)}
          >
            <i className="bi bi-trash" style={{ fontSize: "0.85rem" }}></i>
          </button>
        )}
        {isReadyForPickup && (
          <span className="position-absolute top-0 end-0 badge bg-primary m-1">
            <i className="bi bi-box-seam"></i> Sẵn sàng nhận
          </span>
        )}
        {isSubmitted && !isReadyForPickup && (
          <span className="position-absolute top-0 end-0 badge bg-danger m-1">
            <i className="bi bi-lock-fill"></i> Đã gửi
          </span>
        )}
        {!isSubmitted && draft && !draft.cancelled && (
          <span className="position-absolute top-0 end-0 badge bg-info text-dark m-1">
            <i className="bi bi-pencil-square"></i> Nháp
          </span>
        )}
        {!isSubmitted && draft?.cancelled && (
          <span className="position-absolute top-0 end-0 badge bg-secondary m-1">
            Bỏ qua
          </span>
        )}

        <div className="fw-bold brand-text mb-1">{item.tenmon}</div>
        <span className="badge bg-secondary mb-1">Lớp {item.malop}</span>
        <div
          className="small text-dark text-truncate px-1"
          style={{ fontSize: "0.8rem", maxWidth: "120px", margin: "0 auto" }}
          title={lessonName}
        >
          {lessonName}
        </div>

        <div className="mt-2 text-center">
          {activeItemCount > 0 ? (
            <div
              className={`small fw-bold mb-1 ${draft ? "text-info" : "accent-text"}`}
            >
              <i className="bi bi-lightbulb"></i> {activeItemCount} Thiết bị
            </div>
          ) : (
            <div
              className="small text-muted mb-1"
              style={{ minHeight: "20px" }}
            ></div>
          )}

          <button
            className={`btn btn-sm ${isSubmitted ? "btn-secondary disabled" : hasDevice || draft ? "btn-brand" : "btn-brand-outline"} w-100 fw-bold`}
            style={{ fontSize: "0.75rem", padding: "4px 0" }}
            onClick={() => !isSubmitted && onXemGoiY(item)}
          >
            <i
              className={
                isSubmitted ? "bi bi-check-circle" : "bi bi-pencil-square"
              }
            ></i>{" "}
            {isSubmitted ? "Đã Chốt" : draft ? "Sửa Nháp" : "Chỉnh sửa"}
          </button>
        </div>
      </td>
    );
  };

  /* =================== MOBILE AGENDA CARD =================== */
  const renderAgendaTiet = (item) => {
    const {
      draft,
      isSubmitted,
      isReadyForPickup,
      activeItemCount,
      lessonName,
    } = deriveCellMeta(item, draftPlans);
    const cls = isReadyForPickup
      ? "is-ready"
      : isSubmitted
        ? "is-submitted"
        : draft && !draft.cancelled
          ? "is-draft"
          : draft?.cancelled
            ? "is-cancelled"
            : "";

    return (
      <div key={item.matkb} className={`agenda-tiet ${cls}`}>
        <div className="tiet-pill">T{item.tiethoc}</div>
        <div className="at-body">
          <div className="at-title">{item.tenmon}</div>
          <div className="at-meta">
            <span className="badge-soft">Lớp {item.malop}</span>
            {lessonName && <span className="text-muted">{lessonName}</span>}
          </div>
          {activeItemCount > 0 && !draft?.cancelled && (
            <div
              className="small mt-1"
              style={{
                color: isReadyForPickup
                  ? "#1d4ed8"
                  : isSubmitted
                    ? "#15803d"
                    : draft
                      ? "#1e40af"
                      : "var(--accent-600)",
              }}
            >
              <i
                className={`${isReadyForPickup ? "bi bi-box-seam-fill" : "bi bi-lightbulb-fill"} me-1`}
              ></i>
              {activeItemCount} thiết bị
              {isReadyForPickup && " · sẵn sàng đến nhận"}
              {!isReadyForPickup && isSubmitted && " · đã gửi duyệt"}
              {!isSubmitted && draft && " · nháp"}
            </div>
          )}
          {draft?.cancelled && (
            <div className="small text-muted mt-1">
              <i className="bi bi-slash-circle me-1"></i>Đã bỏ qua tiết này
            </div>
          )}
        </div>
        <div className="at-action d-flex flex-column gap-1">
          <button
            className={`btn btn-sm ${isSubmitted ? "btn-secondary disabled" : activeItemCount > 0 || draft ? "btn-brand" : "btn-brand-outline"} fw-bold`}
            onClick={() => !isSubmitted && onXemGoiY(item)}
            disabled={isSubmitted}
          >
            <i
              className={`bi ${isSubmitted ? "bi-check-circle" : "bi-pencil-square"} me-1`}
            ></i>
            {isSubmitted ? "Đã chốt" : draft ? "Sửa" : "Sửa"}
          </button>
          {!isSubmitted && (
            <button
              className="btn btn-sm btn-outline-danger"
              title="Xoá tiết này khỏi lịch"
              onClick={(e) => handleDeleteClick(e, item)}
            >
              <i className="bi bi-trash me-1"></i> Xoá
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAgendaDay = (thu) => {
    const items = lichDay
      .filter((l) => Number(l.thu) === thu)
      .sort((a, b) => Number(a.tiethoc) - Number(b.tiethoc));
    const dateObj = getDateForCell(thu, weekOffset);

    return (
      <motion.div 
        key={thu} 
        className="agenda-day"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (thu - 2) * 0.1 }}
      >
        <div className="agenda-day-head">
          <div>
            <div className="dh-label">{DAY_LABELS[thu]}</div>
            <div className="dh-date">{fmtShortDate(dateObj)}</div>
          </div>
          {items.length === 0 && (
            <span className="badge bg-light text-muted">Không có lịch</span>
          )}
        </div>
        {items.length > 0 && <div>{items.map(renderAgendaTiet)}</div>}
        {items.length === 0 && (
          <div className="px-3 py-3 text-center text-muted small">
            <i className="bi bi-calendar2-x me-1"></i> Không có tiết nào trong
            ngày này.
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <>
      {/* === DESKTOP / TABLET (≥ md): Lưới TKB === */}
      <div className="d-none d-md-block">
        <div className="table-responsive shadow-sm rounded">
          <table
            className="table table-bordered table-hover bg-white m-0"
            style={{ tableLayout: "fixed", minWidth: "900px" }}
          >
            <thead
              className="text-center align-middle"
              style={{ background: "var(--brand-100)" }}
            >
              <tr>
                <th rowSpan="2" style={{ width: "60px" }}>
                  Buổi
                </th>
                <th rowSpan="2" style={{ width: "50px" }}>
                  Tiết
                </th>
                {DAYS.map((d) => (
                  <th key={d} style={{ width: "14%" }}>
                    Thứ {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((tiet, i) => (
                <tr key={tiet}>
                  {i === 0 && (
                    <td
                      rowSpan="5"
                      className="text-center align-middle fw-bold text-white"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        background: "var(--brand-500)",
                      }}
                    >
                      SÁNG
                    </td>
                  )}
                  <td className="text-center align-middle fw-bold bg-light">
                    {tiet}
                  </td>
                  {DAYS.map((d) => renderCell(d, tiet))}
                </tr>
              ))}
              <tr>
                <td
                  colSpan="8"
                  className="bg-secondary bg-opacity-10 py-1 text-center small text-muted fw-bold"
                >
                  Nghỉ Trưa
                </td>
              </tr>
              {[6, 7, 8, 9, 10].map((tiet, i) => (
                <tr key={tiet}>
                  {i === 0 && (
                    <td
                      rowSpan="5"
                      className="text-center align-middle fw-bold text-white"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "rotate(180deg)",
                        background: "var(--brand-700)",
                      }}
                    >
                      CHIỀU
                    </td>
                  )}
                  <td className="text-center align-middle fw-bold bg-light">
                    {tiet - 5}
                  </td>
                  {DAYS.map((d) => renderCell(d, tiet))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* === MOBILE (< md): Agenda dọc === */}
      <div className="d-md-none">{DAYS.map(renderAgendaDay)}</div>
    </>
  );
}
