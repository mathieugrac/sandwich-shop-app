import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AboutSection() {
  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-xl text-black mb-2">It&apos;s all about</h2>
        <h3 className="text-2xl font-bold italic text-black">Cuisine</h3>
      </div>

      {/* Feature Cards */}
      <div className="space-y-4">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-black">
              Fresh Ingredients
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-600 text-sm">
              Made with locally sourced ingredients every morning
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-black">
              Original Recipes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-600 text-sm">
              Order ahead and skip the line. Ready when you arrive.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-black">
              Convenient Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-gray-600 text-sm">
              Located in the heart of downtown. Easy parking available.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
