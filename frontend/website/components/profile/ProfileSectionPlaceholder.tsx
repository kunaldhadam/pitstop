interface ProfileSectionPlaceholderProps {
  title: string;
}

export default function ProfileSectionPlaceholder({
  title,
}: ProfileSectionPlaceholderProps) {
  return (
    <main className="profile-menu-section">
      <h1>{title}</h1>
      <p>This section is not available yet.</p>
    </main>
  );
}
