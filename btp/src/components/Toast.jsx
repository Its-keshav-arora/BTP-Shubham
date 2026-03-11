export default function Toast({ message, visible }) {
  if (!message) return null;
  return (
    <div
      className={`toast ${visible ? 'toast--visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
