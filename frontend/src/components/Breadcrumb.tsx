import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-textGray mb-6">
      <Link to="/" className="hover:text-primary transition flex items-center gap-1">
        <Home size={13} />
        <span>Home</span>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={12} className="text-slate-700" />
          {item.link ? (
            <Link to={item.link} className="hover:text-primary transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-textWhite font-bold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
export default Breadcrumb;
