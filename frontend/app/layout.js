import './globals.css'

export const metadata = {
  title: 'Smart Healthcare System',
  description: 'Book and manage healthcare appointments',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
