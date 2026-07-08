import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Espace Banquier - Banque de l\'été',
  description: 'Espace d\'administration parent pour la gestion des comptes de la Banque de l\'été.',
  manifest: null,
  icons: {
    icon: [
      { url: '/admin-icon.png', type: 'image/png' },
      { url: '/admin-favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: '/admin-favicon.ico',
    apple: '/admin-icon.png',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
