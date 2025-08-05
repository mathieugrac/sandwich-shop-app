import { MainLayout } from '@/components/shared/MainLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Utensils, Clock, MapPin, Phone } from 'lucide-react';

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fresh Sandwiches
              <span className="text-primary block">Made to Order</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Pre-order your favorite sandwiches and pick them up fresh. No
              waiting, no hassle.
            </p>
            <Button size="lg" className="text-lg px-8 py-6">
              View Today's Menu
            </Button>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Utensils className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Fresh Ingredients</CardTitle>
                <CardDescription>
                  Made with locally sourced ingredients every morning
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Quick Pickup</CardTitle>
                <CardDescription>
                  Order ahead and skip the line. Ready when you arrive.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Convenient Location</CardTitle>
                <CardDescription>
                  Located in the heart of downtown. Easy parking available.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
            <p className="text-muted-foreground mb-6">
              Browse our daily menu and place your order for pickup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">View Menu</Button>
              <Button variant="outline" size="lg">
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </MainLayout>
  );
}
