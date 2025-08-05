import { supabase } from '@/lib/supabase/client'
import { Product } from '@/types/database'

async function getProducts(): Promise<Product[]> {
  console.log('Environment variables:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order')
    
    console.log('Supabase response:', { data, error })
    
    if (error) {
      console.error('Error fetching products:', error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Exception in getProducts:', err)
    return []
  }
}

export default async function TestDB() {
  const products = await getProducts()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        ✅ Database connection successful!
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Available Products:</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-3">{product.description}</p>
            <p className="text-2xl font-bold text-green-600">${product.price}</p>
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          ⚠️ No products found. Check your database setup.
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Products found: {products.length}</p>
        <p>Environment URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</p>
        <p>Environment Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
      </div>
    </div>
  )
}
