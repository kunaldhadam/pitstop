import NavbarClient from "./navbar-client";

export default function Navbar({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  return <NavbarClient isAuthenticated={isAuthenticated} />;
}
