"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "react-toastify"
import { Search, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import "../css/order.css"
import api from "../api/api_url"

// Import your product images
import awRootBeerImg from "../assets/products/a&w-sarsaparilla-root-beer.webp"
import cokeOriginalImg from "../assets/products/coca-cola-original-taste.webp"
import cokeLightImg from "../assets/products/coca-cola-light-taste.webp"
import cokeZeroImg from "../assets/products/coca-cola-zero-sugar.webp"
import lemonDouDevilImg from "../assets/products/lemon-dou-devil-lemon.webp"
import lemonDouHoneyImg from "../assets/products/lemon-dou-honey-lemon.webp"
import lemonDouSignatureImg from "../assets/products/lemon-dou-signature-lemon.webp"
import spriteImg from "../assets/products/sprite.webp"
import spriteZeroImg from "../assets/products/sprite-zero.webp"
import royalZeroImg from "../assets/products/royal-zero-sugar.webp"
import royalTruGrapeImg from "../assets/products/royal-tru-grape.webp"
import royalTruLemonImg from "../assets/products/royal-tru-lemon.webp"
import royalTruOrangeImg from "../assets/products/royal-tru-orange.webp"
import wilkinsDistilledImg from "../assets/products/wilkins-distilled.webp"
import wilkinsPureImg from "../assets/products/wilkins-pure.webp"
import minuteMaidFreshAppleImg from "../assets/products/minute-maid-fresh-apple.webp"
import minuteMaidFreshMangoImg from "../assets/products/minute-maid-fresh-mango.webp"
import minuteMaidFreshOrangeImg from "../assets/products/minute-maid-fresh-orange.webp"
import minuteMaidFreshPineappleImg from "../assets/products/minute-maid-fresh-pineapple.webp"
import minuteMaidNutriPlusOrangeImg from "../assets/products/minute-maid-nutri-plus-orange.webp"
import minuteMaidPulpyFourSeasonImg from "../assets/products/minute-maid-pulpy-four-season.webp"
import minuteMaidPulpyMangoOrangeImg from "../assets/products/minute-maid-pulpy-mango-orange.webp"
import nutriboostChocolateMilkImg from "../assets/products/nutriboost-chocolate-milk.webp"
import nutriboostStrawberryImg from "../assets/products/nutriboost-strawberry.webp"

export default function OrderPage() {
  const { darkMode, toggleDarkMode } = useAuth()
  const categoriesRef = useRef(null)
  const autoScrollIntervalRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0)

  // State for store selection
  const [selectedStore, setSelectedStore] = useState("")
  const [stores, setStores] = useState([])
  const [storesLoading, setStoresLoading] = useState(false)

  // State for product search and selection
  const [searchQuery, setSearchQuery] = useState("")
  const [categories] = useState([
    { id: 1, name: "Coca-Cola Original", img: cokeOriginalImg },
    { id: 2, name: "Coca-Cola Light", img: cokeLightImg },
    { id: 3, name: "Coca-Cola Zero", img: cokeZeroImg },
    { id: 4, name: "A&W Root Beer", img: awRootBeerImg },
    { id: 5, name: "Lemon Dou Devil", img: lemonDouDevilImg },
    { id: 6, name: "Lemon Dou Honey", img: lemonDouHoneyImg },
    { id: 7, name: "Lemon Dou Signature", img: lemonDouSignatureImg },
    { id: 8, name: "Sprite", img: spriteImg },
    { id: 9, name: "Sprite Zero", img: spriteZeroImg },
    { id: 10, name: "Royal Zero Sugar", img: royalZeroImg },
    { id: 11, name: "Royal Tru Grape", img: royalTruGrapeImg },
    { id: 12, name: "Royal Tru Lemon", img: royalTruLemonImg },
    { id: 13, name: "Royal Tru Orange", img: royalTruOrangeImg },
    { id: 14, name: "Wilkins Distilled", img: wilkinsDistilledImg },
    { id: 15, name: "Wilkins Pure", img: wilkinsPureImg },
    { id: 16, name: "Minute Maid Fresh Apple", img: minuteMaidFreshAppleImg },
    { id: 17, name: "Minute Maid Fresh Mango", img: minuteMaidFreshMangoImg },
    { id: 18, name: "Minute Maid Fresh Orange", img: minuteMaidFreshOrangeImg },
    { id: 19, name: "Minute Maid Fresh Pineapple", img: minuteMaidFreshPineappleImg },
    { id: 20, name: "Minute Maid Nutri+ Orange", img: minuteMaidNutriPlusOrangeImg },
    { id: 21, name: "Minute Maid Pulpy Four Season", img: minuteMaidPulpyFourSeasonImg },
    { id: 22, name: "Minute Maid Pulpy Mango Orange", img: minuteMaidPulpyMangoOrangeImg },
    { id: 23, name: "Nutriboost Chocolate Milk", img: nutriboostChocolateMilkImg },
    { id: 24, name: "Nutriboost Strawberry", img: nutriboostStrawberryImg },
  ])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [availableStock, setAvailableStock] = useState(0)
  const [orderItems, setOrderItems] = useState([])
  const [selectedSize, setSelectedSize] = useState("")
  const [packagingType, setPackagingType] = useState("perBottle")
  const [caseQuantity, setCaseQuantity] = useState(12)
  const TAX_RATE = 2.0

  // Initialize filtered categories
  useEffect(() => {
    setFilteredCategories(categories)
  }, [categories])

  // Auto-scroll categories
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }

      autoScrollIntervalRef.current = setInterval(() => {
        if (!isPaused && categoriesRef.current) {
          const maxScrollPosition = categoriesRef.current.scrollWidth - categoriesRef.current.clientWidth
          const scrollStep = categoriesRef.current.clientWidth / 2

          // Calculate next scroll position
          let nextScrollPosition = categoriesRef.current.scrollLeft + scrollStep

          // If we're at the end, go back to the beginning
          if (nextScrollPosition >= maxScrollPosition) {
            nextScrollPosition = 0
          }

          categoriesRef.current.scrollTo({
            left: nextScrollPosition,
            behavior: "smooth",
          })

          setCurrentScrollIndex(Math.floor(nextScrollPosition / scrollStep))
        }
      }, 10000) // Auto-scroll every 5 seconds
    }

    startAutoScroll()

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [isPaused])

  // Scroll categories left
  const scrollCategoriesLeft = () => {
    if (categoriesRef.current) {
      const scrollStep = categoriesRef.current.clientWidth / 2
      const nextScrollPosition = Math.max(0, categoriesRef.current.scrollLeft - scrollStep)

      categoriesRef.current.scrollTo({
        left: nextScrollPosition,
        behavior: "smooth",
      })

      setCurrentScrollIndex(Math.floor(nextScrollPosition / scrollStep))
    }
  }

  // Scroll categories right
  const scrollCategoriesRight = () => {
    if (categoriesRef.current) {
      const scrollStep = categoriesRef.current.clientWidth / 2
      const maxScrollPosition = categoriesRef.current.scrollWidth - categoriesRef.current.clientWidth
      const nextScrollPosition = Math.min(maxScrollPosition, categoriesRef.current.scrollLeft + scrollStep)

      categoriesRef.current.scrollTo({
        left: nextScrollPosition,
        behavior: "smooth",
      })

      setCurrentScrollIndex(Math.floor(nextScrollPosition / scrollStep))
    }
  }

  // Get available sizes based on selected category
  const getAvailableSizesForCategory = (categoryId) => {
    // Coca-Cola products
    if (categoryId >= 1 && categoryId <= 3) {
      return ["2L", "1.5L", "1L", "500ml", "330ml (can)", "250ml (can)", "mismo (pet bottle)", "swakto (pet bottle)"]
    }
    // A&W Root Beer
    else if (categoryId === 4) {
      return ["330ml (can)"]
    }
    // Lemon Dou variants
    else if (categoryId >= 5 && categoryId <= 7) {
      return ["330ml (can)"]
    }
    // Sprite and Sprite Zero
    else if (categoryId === 8 || categoryId === 9) {
      return ["2L", "1.5L", "1L", "500ml", "330ml (can)", "250ml (can)", "mismo (pet bottle)", "swakto (pet bottle)"]
    }
    // Royal variants
    else if (categoryId >= 10 && categoryId <= 13) {
      return ["1.5L", "1L", "500ml", "330ml (can)", "250ml (can)", "mismo (pet bottle)", "swakto (pet bottle)"]
    }
    // Wilkins variants
    else if (categoryId === 14 || categoryId === 15) {
      return ["7L", "1L", "500ml", "330ml"]
    }
    // Minute Maid variants
    else if (categoryId >= 16 && categoryId <= 22) {
      return ["1L", "330ml"]
    }
    // Nutriboost variants
    else if (categoryId === 23 || categoryId === 24) {
      return ["1L", "330ml"]
    } else {
      return []
    }
  }

  // Update case quantity based on selected size
  useEffect(() => {
    if (selectedSize) {
      if (selectedSize.includes("2L")) {
        setCaseQuantity(6)
      } else if (selectedSize.includes("1.5L")) {
        setCaseQuantity(6)
      } else if (selectedSize.includes("1L")) {
        setCaseQuantity(12)
      } else if (selectedSize.includes("500ml")) {
        setCaseQuantity(24)
      } else if (selectedSize.includes("330ml")) {
        setCaseQuantity(24)
      } else if (selectedSize.includes("250ml")) {
        setCaseQuantity(24)
      } else if (selectedSize.includes("7L")) {
        setCaseQuantity(1)
      } else if (selectedSize.includes("mismo")) {
        setCaseQuantity(24)
      } else if (selectedSize.includes("swakto")) {
        setCaseQuantity(24)
      } else {
        setCaseQuantity(12) // Default
      }
    }
  }, [selectedSize])

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory.id)
      setSelectedSize("")
      setSelectedProduct(null)
    }
  }, [selectedCategory])

  useEffect(() => {
    if (selectedSize && products.length > 0) {
      const productForSize = products.find((p) => p.size === selectedSize)
      if (productForSize) {
        setSelectedProduct(productForSize)
        setAvailableStock(productForSize.stock)
      }
    }
  }, [selectedSize, products])

  const fetchStores = async () => {
    setStoresLoading(true)
    try {
      const response = await api.get("/stores/")
      const storeData = response.data.map((store) => ({
        id: store.id,
        name: store.name,
      }))
      setStores(storeData)
      if (storeData.length > 0) {
        setSelectedStore(storeData[0].id.toString())
      }
    } catch (error) {
      console.error("Error fetching stores:", error)
      toast.error("Failed to load stores")
      setStores([])
    } finally {
      setStoresLoading(false)
    }
  }

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)

    if (query === "") {
      setFilteredCategories(categories)
      return
    }

    const matchedCategories = categories.filter((category) => category.name.toLowerCase().includes(query))

    // If no exact matches, find the closest match using Levenshtein distance
    if (matchedCategories.length === 0) {
      const closestMatch = findClosestMatch(query, categories)
      if (closestMatch) {
        setFilteredCategories([closestMatch])
      } else {
        setFilteredCategories([])
      }
    } else {
      setFilteredCategories(matchedCategories)
    }
  }

  // Levenshtein distance algorithm for finding closest match
  const findClosestMatch = (query, categories) => {
    let minDistance = Number.POSITIVE_INFINITY
    let closestMatch = null

    categories.forEach((category) => {
      const distance = levenshteinDistance(query, category.name.toLowerCase())
      if (distance < minDistance) {
        minDistance = distance
        closestMatch = category
      }
    })

    return minDistance < 3 ? closestMatch : null
  }

  // Calculate Levenshtein distance between two strings
  const levenshteinDistance = (a, b) => {
    const matrix = []
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          )
        }
      }
    }
    return matrix[b.length][a.length]
  }

  const fetchProducts = async (categoryId) => {
    setProductsLoading(true)
    try {
      // First try to fetch from API
      try {
        const response = await api.get(`/products?category_id=${categoryId}`)

        if (response.data && response.data.length > 0) {
          const productsData = response.data.map((product) => ({
            id: product.id,
            name: product.brand,
            price: Number.parseFloat(product.price),
            stock: Number.parseInt(product.stock_quantity),
            size: product.size,
            category: product.category_id,
          }))

          setProducts(productsData)
          return
        }
      } catch (apiError) {
        console.log("Falling back to mock data due to API error:", apiError)
      }

      // Fallback to mock data if API fails
      let mockProducts = []

      // Generate mock products based on category and available sizes
      const sizes = getAvailableSizesForCategory(categoryId)
      const categoryName = categories.find((c) => c.id === categoryId)?.name || "Unknown"

      mockProducts = sizes.map((size, index) => {
        let price = 0
        const stock = 100 + Math.floor(Math.random() * 100) // Random stock between 100-199

        // Set price based on size
        if (size.includes("2L")) price = 75.0
        else if (size.includes("1.5L")) price = 55.0
        else if (size.includes("1L")) price = 40.0
        else if (size.includes("500ml")) price = 25.0
        else if (size.includes("330ml")) price = 20.0
        else if (size.includes("250ml")) price = 18.0
        else if (size.includes("7L")) price = 120.0
        else if (size.includes("mismo")) price = 15.0
        else if (size.includes("swakto")) price = 12.0
        else price = 30.0 // Default

        // Adjust price based on product type
        if (categoryName.includes("Zero") || categoryName.includes("Light")) {
          price *= 1.1 // 10% more expensive for diet/zero variants
        }

        return {
          id: categoryId * 100 + index,
          name: categoryName,
          price: price,
          stock: stock,
          size: size,
          category: categoryId,
        }
      })

      setProducts(mockProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load products")
    } finally {
      setProductsLoading(false)
    }
  }

  const handleQuantityChange = (value) => {
    let maxQuantity = availableStock
    if (packagingType === "perCase") {
      maxQuantity = Math.floor(availableStock / caseQuantity)
    }
    const newQuantity = Math.max(1, Math.min(value, maxQuantity))
    setQuantity(newQuantity)
  }

  const handleAddToOrder = () => {
    if (!selectedProduct) {
      toast.error("Please select a product")
      return
    }

    if (!selectedStore) {
      toast.error("Please select a store")
      return
    }

    if (!selectedSize) {
      toast.error("Please select a size")
      return
    }

    const actualQuantity = packagingType === "perCase" ? quantity * caseQuantity : quantity
    const actualTotal = selectedProduct.price * actualQuantity

    const itemKey = `${selectedProduct.id}-${selectedSize}-${packagingType}`

    const existingItemIndex = orderItems.findIndex((item) => item.key === itemKey)

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += actualQuantity
      updatedItems[existingItemIndex].total =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice
      setOrderItems(updatedItems)
    } else {
      const newItem = {
        key: itemKey,
        id: selectedProduct.id,
        description: `${selectedProduct.name} ${selectedSize} (${packagingType === "perCase" ? "Case" : "Bottle"})`,
        quantity: actualQuantity,
        unitPrice: selectedProduct.price,
        total: actualTotal,
        size: selectedSize,
        packagingType: packagingType,
      }

      setOrderItems([...orderItems, newItem])
    }

    setQuantity(1)
    toast.success("Item added to order")
  }

  const handleCompleteOrder = () => {
    if (orderItems.length === 0) {
      toast.error("Please add items to your order")
      return
    }

    toast.success("Order submitted successfully!")
    setOrderItems([])
    setQuantity(1)
    setSelectedProduct(null)
    setSelectedCategory(null)
    setSelectedSize("")
  }

  const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  const taxAmount = (subtotal * TAX_RATE) / 100
  const totalAmount = subtotal + taxAmount

  return (
    <div className={`order-page ${darkMode ? "dark" : ""}`}>
      <div className="order-container">
        <div className="product-selection">
          <div className="search-section">
            <div className="search-bar">
              <input type="text" placeholder="SEARCH" value={searchQuery} onChange={handleSearchChange} />
              <Search className="search-icon" />
            </div>

            <div className="store-selector">
              <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="store-select">
                <option value="">STORE NAME</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="categories-section">
            <h3 className="section-title">CATEGORIES</h3>
            <div className="categories-container">
              <button
                className="scroll-button scroll-left"
                onClick={scrollCategoriesLeft}
                aria-label="Scroll categories left"
              >
                <ChevronLeft />
              </button>

              <div
                className="categories-scroll-container"
                ref={categoriesRef}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {filteredCategories.length === 0 ? (
                  <div className="no-results">No matching categories found</div>
                ) : (
                  <div className="categories-grid">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`category-item ${selectedCategory?.id === category.id ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedCategory(category)
                          setSearchQuery("")
                          setFilteredCategories(categories)
                        }}
                      >
                        <div className="category-img">
                          <img
                            src={category.img || "/placeholder.svg"}
                            alt={category.name}
                            onError={(e) => {
                              e.target.src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <span className="category-name">{category.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="scroll-button scroll-right"
                onClick={scrollCategoriesRight}
                aria-label="Scroll categories right"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="carousel-indicators">
              {Array.from({ length: Math.ceil((filteredCategories.length / 12) * 2) }).map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${currentScrollIndex === index ? "active" : ""}`}
                  onClick={() => {
                    if (categoriesRef.current) {
                      const scrollStep = categoriesRef.current.clientWidth / 2
                      categoriesRef.current.scrollTo({
                        left: index * scrollStep,
                        behavior: "smooth",
                      })
                      setCurrentScrollIndex(index)
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {selectedCategory && (
            <div className="size-section">
              <h4 className="size-title">AVAILABLE SIZES</h4>
              <div className="size-options">
                {getAvailableSizesForCategory(selectedCategory.id).map((size, index) => {
                  const productForSize = products.find((p) => p.size === size)
                  return (
                    <button
                      key={index}
                      className={`size-button ${selectedSize === size ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedSize(size)
                        if (productForSize) {
                          setSelectedProduct(productForSize)
                          setAvailableStock(productForSize.stock)
                        }
                      }}
                      disabled={!productForSize}
                    >
                      {size}
                      {productForSize && <span className="size-price">₱{productForSize.price.toFixed(2)}</span>}
                    </button>
                  )
                })}
              </div>

              <div className="packaging-section">
                <h4 className="packaging-title">PACKAGING</h4>
                <div className="packaging-options">
                  <label className="packaging-option">
                    <input
                      type="radio"
                      name="packaging"
                      value="perBottle"
                      checked={packagingType === "perBottle"}
                      onChange={() => {
                        setPackagingType("perBottle")
                        setQuantity(1)
                      }}
                    />
                    Per {selectedSize && selectedSize.includes("can") ? "Can" : "Bottle"}
                  </label>
                  <label className="packaging-option">
                    <input
                      type="radio"
                      name="packaging"
                      value="perCase"
                      checked={packagingType === "perCase"}
                      onChange={() => {
                        setPackagingType("perCase")
                        setQuantity(1)
                      }}
                    />
                    Per Case ({caseQuantity}{" "}
                    {caseQuantity === 1
                      ? selectedSize && selectedSize.includes("can")
                        ? "can"
                        : "bottle"
                      : selectedSize && selectedSize.includes("can")
                        ? "cans"
                        : "bottles"}
                    )
                  </label>
                </div>
              </div>

              <div className="quantity-section">
                <div className="quantity-control">
                  <button
                    className="quantity-button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus size={20} />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                    className="quantity-input"
                    min="1"
                    max={packagingType === "perCase" ? Math.floor(availableStock / caseQuantity) : availableStock}
                  />

                  <button
                    className="quantity-button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={
                      quantity >=
                      (packagingType === "perCase" ? Math.floor(availableStock / caseQuantity) : availableStock)
                    }
                  >
                    <Plus size={20} />
                  </button>

                  <span className="stock-info">
                    {packagingType === "perCase"
                      ? `${Math.floor(availableStock / caseQuantity)} cases available`
                      : `${availableStock} ${selectedSize && selectedSize.includes("can") ? "cans" : "bottles"} available`}
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button className="add-button" onClick={handleAddToOrder}>
                  ADD
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="order-summary">
          <div className="order-table">
            <table>
              <thead>
                <tr>
                  <th>DESCRIPTION</th>
                  <th>QUANTITY</th>
                  <th>UNIT PRICE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length > 0 ? (
                  orderItems.map((item) => (
                    <tr key={item.key}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>₱{item.unitPrice.toFixed(2)}</td>
                      <td>₱{item.total.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-order">
                      No items added yet
                    </td>
                  </tr>
                )}
                {Array.from({ length: Math.max(0, 5 - orderItems.length) }).map((_, index) => (
                  <tr key={`empty-${index}`} className="empty-row">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="order-notes">
            <div className="notes-section">
              <h4>NOTES</h4>
              <textarea className="notes-input" placeholder="Add notes here..."></textarea>
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>SUBTOTAL</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>TAX RATE</span>
                <span>{TAX_RATE.toFixed(1)}%</span>
              </div>
              <div className="total-row">
                <span>TAX AMOUNT</span>
                <span>₱{taxAmount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>TOTAL AMOUNT DUE</span>
                <span>₱{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="complete-order">
            <button className="done-button" onClick={handleCompleteOrder}>
              DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

