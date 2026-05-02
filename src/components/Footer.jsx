import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">
                S
              </span>
            </div>
            <span className="font-display font-bold text-xl text-white">
              Shop<span className="text-brand-400">Nest</span>
            </span>
          </Link>
          <p className="text-sm font-body leading-relaxed">
            Your one-stop destination for curated products across every
            category.
          </p>
        </div>

        {/* Links */}
        {[
          {
            title: "Shop",
            links: [
              ["Electronics", "/category/smartphones"],
              ["Women", "/category/womens-dresses"],
              ["Men", "/category/mens-shirts"],
              ["Beauty", "/category/skin-care"],
            ],
          },
          {
            title: "Company",
            links: [
              ["About", "#"],
              ["Careers", "#"],
              ["Blog", "#"],
              ["Press", "#"],
            ],
          },
          {
            title: "Support",
            links: [
              ["Help Center", "#"],
              ["Returns", "#"],
              ["Track Order", "#"],
              ["Contact", "#"],
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h3 className="font-body font-bold text-white text-sm uppercase tracking-widest mb-4">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-sm font-body hover:text-brand-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-6">
        <p className="text-center text-xs font-body text-gray-600">
          © 2026 ShopNest. Built with React + Vite + TailwindCSS. Powered by
          DummyJSON API.
        </p>
      </div>
    </footer>
  );
}
