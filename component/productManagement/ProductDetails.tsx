"use client";
import { Product } from "@/app/actions/product";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaEdit, FaBox, FaLayerGroup, FaTag } from "react-icons/fa";

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails = ({ product }: ProductDetailsProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  if (!product) {
    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const categoryName = product.category && typeof product.category === 'object' ? product.category.name : (product.category || "Uncategorized");

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold mb-2">Product Details</h1>
           <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
             View and manage product information
           </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isDarkMode
                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaArrowLeft /> Back
          </button>
          <button
            onClick={() => router.push(`/products/edit-product/${product._id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaEdit /> Edit Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Header Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full ${
                      product.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status}
                  </span>
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                    SKU: {product.sku}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(product.price)}
                </div>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="text-sm text-gray-400 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className={`leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {product.description}
            </p>
          </div>

           {/* Images Card */}
           <div
            className={`p-6 rounded-lg border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Product Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {product.images?.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                       <img 
                         src={img.url} 
                         alt={`${product.name} ${idx + 1}`} 
                         className="w-full h-full object-cover"
                       />
                       {img.isPrimary && (
                          <div className="absolute top-2 right-2 bg-yellow-400 text-xs px-2 py-1 rounded-full font-bold">
                             Primary
                          </div>
                       )}
                  </div>
               ))}
               {(!product.images || product.images.length === 0) && (
                   <div className="col-span-4 text-center text-gray-400 py-8">
                       No images available
                   </div>
               )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Inventory & details</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <FaBox className="text-gray-400" />
                      <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Stock</span>
                  </div>
                  <span className="font-semibold">{product.stock} units</span>
              </div>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <FaLayerGroup className="text-gray-400" />
                      <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Category</span>
                  </div>
                  <span className="font-semibold">{categoryName}</span>
              </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <FaTag className="text-gray-400" />
                      <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Featured</span>
                  </div>
                  <span className="font-semibold">{product.featured ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;