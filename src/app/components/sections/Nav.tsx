import { FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Container } from "../layout/Container";
import logo from "../../../assets/Evident.png";

const NAV_ITEMS = ["Features", "Pricing", "Docs", "Blog"];

export function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <Container className="flex h-14 items-center justify-between md:h-16">
        <a href="#" className="flex items-center gap-3">
        <img
          src={logo}
          alt="Copilot"
          className="h-15 w-auto"  // adjust size as needed
        />
          <span className="text-xl font-semibold tracking-tight text-white">
          Evident
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="group relative text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {item}
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-150 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <a
            href="#"
            className="hidden text-xs uppercase tracking-wider text-muted-foreground transition-colors duration-150 hover:text-foreground sm:inline"
          >
            Sign in
          </a>
          <Button size="sm">Get started</Button>
        </div>
      </Container>
    </nav>
  );
}
