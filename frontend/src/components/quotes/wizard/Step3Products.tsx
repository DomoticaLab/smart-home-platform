import { useState, useMemo } from 'react'
import { Plus, Minus, Trash2, ShoppingCart, Package, ShoppingBag, Pencil, X } from 'lucide-react'
import { useBundles } from '../../../hooks/useBundles'
import { useProducts } from '../../../hooks/useProducts'
import { Card } from '../../ui/Card'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { formatCOP } from '../../../types/quote.types'

interface ProductItem {
  productId: string
  productName: string
  brandName: string
  roomId?: string
  roomName?: string
  quantity: number
  unitPrice: number
}

interface BundleItem {
  bundleId: string
  bundleName: string
  quantity: number
  unitPrice: number
}

interface ManualItem {
  customName: string
  customDescription?: string
  roomId?: string
  roomName?: string
  quantity: number
  unitPrice: number
}

interface Step3ProductsProps {
  rooms: Array<{ name: string }>
  items: ProductItem[]
  bundles: BundleItem[]
  manualItems: ManualItem[]
  onItemAdded: (item: ProductItem) => void
  onItemRemoved: (index: number) => void
  onManualItemAdded: (item: ManualItem) => void
  onManualItemRemoved: (index: number) => void
  onBundleAdded: (bundle: BundleItem) => void
  onBundleRemoved: (index: number) => void
}

type Tab = 'bundles' | 'products' | 'manual'

export function Step3Products({
  rooms,
  items,
  bundles,
  manualItems,
  onItemAdded,
  onItemRemoved,
  onManualItemAdded,
  onManualItemRemoved,
  onBundleAdded,
  onBundleRemoved
}: Step3ProductsProps) {
  const [tab, setTab] = useState<Tab>('bundles')
  const [productSearch, setProductSearch] = useState('')
  const [bundleQtys, setBundleQtys] = useState<Record<string, number>>({})
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0)

  const { data: bundlesData, isLoading: loadingBundles } = useBundles({ isActive: true })
  const { data: productsData, isLoading: loadingProducts } = useProducts(
    { inStock: true },
    1,
    20
  )

  const bundleList = bundlesData?.data ?? []
  const productList = productsData?.data ?? []

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return productList
    const q = productSearch.toLowerCase()
    return productList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.name.toLowerCase().includes(q)
    )
  }, [productList, productSearch])

  const handleAddBundle = (bundleId: string, bundleName: string, basePrice: number) => {
    const qty = bundleQtys[bundleId] ?? 1
    onBundleAdded({ bundleId, bundleName, quantity: qty, unitPrice: basePrice })
    setBundleQtys((prev) => ({ ...prev, [bundleId]: 1 }))
  }

  const handleAddProduct = (product: typeof productList[number]) => {
    const preferredSupplier = product.supplierLinks[0]
    const unitPrice = preferredSupplier?.price != null ? preferredSupplier.price * 1.45 : 0
    onItemAdded({
      productId: product.id,
      productName: product.name,
      brandName: product.brand.name,
      roomId: rooms[selectedRoomIndex]?.name ? String(selectedRoomIndex) : undefined,
      roomName: rooms[selectedRoomIndex]?.name,
      quantity: 1,
      unitPrice
    })
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalBundles = bundles.reduce((sum, b) => sum + b.quantity, 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Agregar productos</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Seleccioná bundles o productos individuales para la cotización.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-default">
        <button
          onClick={() => setTab('bundles')}
          className={[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'bundles'
              ? 'border-b-2 border-gold text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          ].join(' ')}
        >
          <Package className="h-4 w-4" />
          Bundles
          {bundleList.length > 0 && (
            <span className="ml-1 rounded-full bg-navy/20 px-1.5 py-0.5 text-xs text-navy">
              {bundleList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('products')}
          className={[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'products'
              ? 'border-b-2 border-gold text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          ].join(' ')}
        >
          <ShoppingBag className="h-4 w-4" />
          Productos
          {productList.length > 0 && (
            <span className="ml-1 rounded-full bg-navy/20 px-1.5 py-0.5 text-xs text-navy">
              {productList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('manual')}
          className={[
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
            tab === 'manual'
              ? 'border-b-2 border-gold text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          ].join(' ')}
        >
          <Pencil className="h-4 w-4" />
          Manual
          {manualItems.length > 0 && (
            <span className="ml-1 rounded-full bg-navy/20 px-1.5 py-0.5 text-xs text-navy">
              {manualItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left: content */}
        <div className="space-y-4">
          {tab === 'bundles' && (
            <>
              {loadingBundles ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl border border-border-default bg-bg-secondary" />
                  ))}
                </div>
              ) : bundleList.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-text-secondary text-center py-4">No hay bundles activos.</p>
                </Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {bundleList.map((bundle) => {
                    const qty = bundleQtys[bundle.id] ?? 1
                    return (
                      <Card key={bundle.id} padding="sm" className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant={bundle.tier === 'STANDARD' ? 'warning' : 'neutral'} size="sm">
                              {bundle.tier}
                            </Badge>
                            <p className="mt-1 font-semibold text-text-primary">{bundle.name}</p>
                            <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">
                              {bundle.description ?? `${bundle.items.length} productos`}
                            </p>
                          </div>
                          {bundle.basePrice != null && (
                            <p className="text-sm font-bold text-gold">{formatCOP(bundle.basePrice)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setBundleQtys((q) => ({ ...q, [bundle.id]: Math.max(1, (q[bundle.id] ?? 1) - 1) }))}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-text-primary">
                            {qty}
                          </span>
                          <button
                            onClick={() => setBundleQtys((q) => ({ ...q, [bundle.id]: (q[bundle.id] ?? 1) + 1 }))}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="ml-auto"
                            onClick={() => handleAddBundle(bundle.id, bundle.name, bundle.basePrice ?? 0)}
                            leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}
                          >
                            Agregar
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'products' && (
            <>
              {/* Room selector */}
              {rooms.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {rooms.map((room, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedRoomIndex(i)}
                      className={[
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        selectedRoomIndex === i
                          ? 'border-gold/50 bg-gold/10 text-gold'
                          : 'border-border-default text-text-secondary hover:text-text-primary'
                      ].join(' ')}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Search */}
              <input
                type="text"
                placeholder="Buscar productos..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-gold/40"
              />

              {loadingProducts ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg border border-border-default bg-bg-secondary" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-text-secondary text-center py-4">
                    {productSearch ? 'Ningún producto coincide' : 'No hay productos disponibles'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const preferred = product.supplierLinks[0]
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-lg border border-border-default bg-bg-secondary px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">{product.name}</p>
                          <p className="text-xs text-text-secondary">
                            {product.brand.name}
                            {preferred?.price != null && (
                              <span className="ml-2 text-gold">{formatCOP(preferred.price)}</span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddProduct(product)}
                          leftIcon={<Plus className="h-3.5 w-3.5" />}
                        >
                          Agregar
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'manual' && (
            <ManualTab
              rooms={rooms}
              manualItems={manualItems}
              onManualItemAdded={onManualItemAdded}
              onManualItemRemoved={onManualItemRemoved}
            />
          )}
        </div>

        {/* Right: summary panel */}
        <div className="flex flex-col gap-3">
          <Card padding="md" className="sticky top-24">
            <p className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Resumen selections
            </p>

            {/* Bundles */}
            {bundles.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-text-secondary mb-1.5">
                  Bundles ({totalBundles})
                </p>
                {bundles.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">{b.bundleName}</p>
                      <p className="text-xs text-text-secondary">×{b.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gold">{formatCOP(b.unitPrice * b.quantity)}</span>
                      <button onClick={() => onBundleRemoved(i)} className="text-text-secondary hover:text-red transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Manual Items */}
            {manualItems.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-text-secondary mb-1.5">
                  Manuales ({manualItems.length})
                </p>
                {manualItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">{item.customName}</p>
                      {item.customDescription && (
                        <p className="text-xs text-text-secondary truncate">{item.customDescription}</p>
                      )}
                      <p className="text-xs text-text-secondary">
                        {item.roomName ?? 'Sin asignar'} · ×{item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gold">{formatCOP(item.unitPrice * item.quantity)}</span>
                      <button onClick={() => onManualItemRemoved(i)} className="text-text-secondary hover:text-red transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Items */}
            {items.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-text-secondary mb-1.5">
                  Productos ({totalItems})
                </p>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">{item.productName}</p>
                      <p className="text-xs text-text-secondary">
                        {item.roomName ?? 'Sin asignar'} · ×{item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gold">{formatCOP(item.unitPrice * item.quantity)}</span>
                      <button onClick={() => onItemRemoved(i)} className="text-text-secondary hover:text-red transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bundles.length === 0 && items.length === 0 && manualItems.length === 0 && (
              <p className="mt-3 text-xs text-text-secondary text-center py-4">
                No hay productos seleccionados
              </p>
            )}

            {/* Estimated total */}
            {(items.length > 0 || bundles.length > 0 || manualItems.length > 0) && (
              <div className="mt-4 border-t border-border-default pt-3">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Subtotal estimado</span>
                  <span className="font-semibold text-gold">
                    {formatCOP(
                      items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) +
                      bundles.reduce((s, b) => s + b.unitPrice * b.quantity, 0) +
                      manualItems.reduce((s, m) => s + m.unitPrice * m.quantity, 0)
                    )}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  IVA e instalación se calculan al finalizar
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

interface ManualTabProps {
  rooms: Array<{ name: string }>
  manualItems: Array<{
    customName: string
    customDescription?: string
    roomId?: string
    roomName?: string
    quantity: number
    unitPrice: number
  }>
  onManualItemAdded: (item: ManualTabProps['manualItems'][number]) => void
  onManualItemRemoved: (index: number) => void
}

function ManualTab({ rooms, manualItems, onManualItemAdded, onManualItemRemoved }: ManualTabProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState('')
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0)

  const handleAdd = () => {
    if (!name.trim() || !unitPrice) return
    onManualItemAdded({
      customName: name.trim(),
      customDescription: description.trim() || undefined,
      roomId: rooms[selectedRoomIndex]?.name ? String(selectedRoomIndex) : undefined,
      roomName: rooms[selectedRoomIndex]?.name,
      quantity,
      unitPrice: Number(unitPrice)
    })
    setName('')
    setDescription('')
    setQuantity(1)
    setUnitPrice('')
  }

  return (
    <div className="space-y-4">
      <Card padding="md">
        <p className="text-sm font-semibold text-text-primary mb-3">
          Agregar ítem manual
        </p>
        <p className="text-xs text-text-secondary mb-4">
          Para equipos que el cliente pidió pero no están en el catálogo (cable, tornillería, obra civil, etc.).
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Nombre del ítem *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cable UTP Cat6 por metro"
              className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: 100 metros, calibre 24"
              className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Precio unitario (COP) *
              </label>
              <input
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="50000"
                className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {rooms.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Habitación
              </label>
              <select
                value={selectedRoomIndex}
                onChange={(e) => setSelectedRoomIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-border-default bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-gold focus:outline-none"
              >
                <option value={-1}>Sin asignar</option>
                {rooms.map((r, i) => (
                  <option key={i} value={i}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={!name.trim() || !unitPrice}
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full"
          >
            Agregar ítem manual
          </Button>
        </div>
      </Card>

      {manualItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Ítems manuales agregados ({manualItems.length})
          </p>
          {manualItems.map((item, i) => (
            <Card key={i} padding="sm" className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{item.customName}</p>
                {item.customDescription && (
                  <p className="text-xs text-text-secondary truncate">{item.customDescription}</p>
                )}
                <p className="text-xs text-text-secondary">
                  {item.roomName ?? 'Sin asignar'} · ×{item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gold whitespace-nowrap">
                  {formatCOP(item.unitPrice * item.quantity)}
                </span>
                <button
                  onClick={() => onManualItemRemoved(i)}
                  className="text-text-secondary hover:text-red transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}