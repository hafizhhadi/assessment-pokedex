type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="my-4 flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-800"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800"
      >
        Try again
      </button>
    </div>
  );
}
