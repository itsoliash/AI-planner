import Logo from "@/components/brand/Logo";

export default function Brand({ tagline }: { tagline?: string }) {
  return (
    <header className="brand">
      <div className="brand-row">
        <Logo size={40} className="brand-logo" />
        <span className="brand-name">Zmotano</span>
      </div>
      {tagline && <p className="sub">{tagline}</p>}
    </header>
  );
}
