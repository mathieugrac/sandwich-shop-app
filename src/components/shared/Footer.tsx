import { Button } from '@/components/ui/button'
import { Instagram, Share2, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="py-8 px-5">
      {/* Social Buttons */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" className="rounded-full px-4 py-2">
          <Instagram className="h-4 w-4 mr-2" />
          Insta
        </Button>
        <Button variant="outline" size="sm" className="rounded-full px-4 py-2">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm" className="rounded-full px-4 py-2">
          <Mail className="h-4 w-4 mr-2" />
          Contact
        </Button>
      </div>
    </footer>
  )
} 