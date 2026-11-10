/** Minimal sparkle mark for the assistant launcher (stroke-only, no emoji). */
export function AiAssistantIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 4.5 13.1 9.2 17.5 10.3 13.1 11.4 12 16.1 10.9 11.4 6.5 10.3 10.9 9.2 12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 14.8 18.7 16.6 20.5 17.1 18.7 17.6 18.2 19.4 17.7 17.6 15.9 17.1 17.7 16.6 18.2 14.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M6.3 15.2 6.7 16.7 8.2 17.1 6.7 17.5 6.3 19 5.9 17.5 4.4 17.1 5.9 16.7 6.3 15.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </svg>
  );
}
