import ArmyLogo from "./ArmyLogo";
import "./LoadingScreen.css";

export default function LoadingScreen({ message = "Securing session…" }: { message?: string }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-content">
        <div className="loading-emblem" aria-hidden>
          <ArmyLogo size={64} alt="" />
        </div>
        <div className="spinner" aria-hidden />
        <p>{message}</p>
        <span className="sr-only">Loading Bangladesh Army Cybersecurity Awareness Training Platform</span>
      </div>
    </div>
  );
}
