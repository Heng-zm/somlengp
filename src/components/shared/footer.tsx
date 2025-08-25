import Link from 'next/link'
import { Sparkles, Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16" style={{ paddingTop: '1px', paddingBottom: '30px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Somleng. All rights reserved. By Ozo. Designer
          </p>
        </div>
      </div>
    </footer>
  )
}
