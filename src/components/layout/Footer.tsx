import kidenLogo from "@/assets/kiden-logo-green.jpg";

const Footer = () => {
  const links = {
    Product: ["Features", "Pricing", "Changelog", "Roadmap"],
    Resources: ["Documentation", "Blog", "Support", "API"],
    Company: ["About", "Careers", "Contact", "Press"],
    Legal: ["Privacy", "Terms", "Security"],
  };

  return (
    <footer id="contact" className="py-16 border-t border-border">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <img src={kidenLogo} alt="Kiden" className="h-10 w-10 rounded-lg" />
              <span className="text-xl font-semibold">Kiden</span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The creative project tracker for designers and developers.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-medium mb-4">{category}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kiden. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
              <a
                key={social}
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
