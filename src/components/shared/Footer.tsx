import Link from 'next/link'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>orders@sandwichshop.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>123 Main St, City, State 12345</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Hours</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Monday - Friday: 11:00 AM - 3:00 PM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Saturday: 11:00 AM - 2:00 PM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Sunday: Closed</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/" className="block text-muted-foreground hover:text-primary transition-colors">
                Menu
              </Link>
              <Link href="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link href="/admin" className="block text-muted-foreground hover:text-primary transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Sandwich Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 