import { Anchor } from "@mantine/core";

export function Header() {
  const navLinks = [
    { link: "https://www.snstheatre.org/", label: "HOME" },
    { link: "https://www.snstheatre.org/about.html", label: "ABOUT" },
    { link: "https://www.snstheatre.org/getinvolved.html", label: "GET INVOLVED" },
    { link: "https://www.snstheatre.org/season.html", label: "SEASON" },
    { link: "https://www.snstheatre.org/all_galleries.html", label: "PHOTOS" },
    { link: "https://inventory.snstheatre.org/", label: "SHOP INVENTORY", current: true },
    { link: "https://www.snstheatre.org/give.html", label: "GIVE" },
    { link: "https://www.snstheatre.org/contact.html", label: "CONTACT" },
  ];

  return (
    <header
      style={{
        background: "#fff",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.075)",
        color: "inherit",
        cursor: "default",
        fontSize: "0.75em",
        padding: "0.6em 1.5em",
        width: "100%",
        boxSizing: "border-box",
        zIndex: 100,
        lineHeight: "1em",
        minHeight: "56px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          minWidth: 0,
        }}
      >
        <h1
          id="logo"
          style={{
            fontWeight: "900",
            margin: "0",
            fontSize: "1em",
            fontFamily: "'Lato', sans-serif",
            letterSpacing: "0.025em",
            whiteSpace: "nowrap",
            lineHeight: "1em",
            flexShrink: 0,
          }}
        >
          <Anchor
            href="https://www.snstheatre.org/"
            style={{
              textDecoration: "none",
              color: "inherit",
              fontWeight: "900",
              fontSize: "inherit",
              fontFamily: "inherit",
            }}
          >
            SCOTCH'N'SODA THEATRE
          </Anchor>
        </h1>

        <nav
          id="nav"
          style={{
            letterSpacing: "0.075em",
            textTransform: "uppercase",
            fontSize: "1em",
            marginLeft: "auto",
            display: "inline-block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              paddingLeft: "0",
              margin: "0",
              display: "inline-flex",
              alignItems: "center",
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {navLinks.map((item) => (
              <li
                key={item.label}
                style={{
                  display: "inline-block",
                  marginLeft: "1.66em",
                  paddingLeft: "0",
                  whiteSpace: "nowrap",
                }}
              >
                <Anchor
                  href={item.link}
                  style={{
                    border: "solid 1px transparent",
                    color: "inherit",
                    display: "inline-block",
                    lineHeight: "1em",
                    padding: "0.6em 0.75em",
                    textDecoration: "none",
                    fontWeight: item.current ? "900" : "inherit",
                    fontFamily: "'Lato', sans-serif",
                    transition: "all 0.2s ease-in-out",
                    fontSize: "inherit",
                    verticalAlign: "middle",
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.background = "rgba(188, 202, 206, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.background = "transparent";
                  }}
                >
                  {item.label}
                </Anchor>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
