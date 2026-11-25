export default function Avatar({ name, url, size = 44 }: { name?: string | null; url?: string | null; size?: number }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="avatar-img" src={url} alt="" width={size} height={size} />
  ) : (
    <span className="avatar" style={{ width: size, height: size, margin: 0 }}>{initials}</span>
  );
}
