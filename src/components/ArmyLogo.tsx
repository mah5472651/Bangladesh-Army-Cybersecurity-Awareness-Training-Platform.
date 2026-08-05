import armyLogo from "../assets/Bangladesh_Army.png";

interface ArmyLogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

export default function ArmyLogo({
  size = 40,
  className = "",
  alt = "Bangladesh Army emblem",
}: ArmyLogoProps) {
  return (
    <img
      src={armyLogo}
      alt={alt}
      width={size}
      height={size}
      className={`army-logo ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        padding: 2,
      }}
    />
  );
}
