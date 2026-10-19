import { Icons } from "./Icons";

export function Notification({ notif, onClose }) {
  if (!notif) return null;
  return (
    <div className={`notif notif-${notif.type}`}>
      {notif.type === "success" && <Icons.Check />}
      {notif.msg}
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", opacity: .6 }}>
        <Icons.X />
      </button>
    </div>
  );
}

