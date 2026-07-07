import "../../css/admin/adminModal.css";

function AdminModal({ title, children, onClose }) {
  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal-box">
        <div className="admin-modal-header">
          <h3>{title}</h3>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default AdminModal;