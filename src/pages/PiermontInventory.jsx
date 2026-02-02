import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, TrendingUp, ExternalLink, Trash2, Edit, Star } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PiermontInventory() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [purchaseData, setPurchaseData] = useState({ movement_date: format(new Date(), 'yyyy-MM-dd') });
  const [supplierData, setSupplierData] = useState({});
  const [createExpense, setCreateExpense] = useState(false);

  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['product-suppliers'],
    queryFn: () => base44.entities.ProductSupplier.list(),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => base44.entities.StockMovement.list('-movement_date'),
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data) => {
      // Criar movimentação de estoque
      const movement = await base44.entities.StockMovement.create(data);
      
      // Atualizar estoque do produto
      const product = products.find(p => p.id === data.product_id);
      if (product) {
        await base44.entities.Product.update(product.id, {
          stock_quantity: (product.stock_quantity || 0) + data.quantity
        });
      }

      // Se marcado, criar gasto também
      if (createExpense && data.total_cost) {
        await base44.entities.EcommerceExpense.create({
          description: `Compra: ${data.product_name}`,
          category: 'other',
          amount: data.total_cost,
          expense_date: data.movement_date,
          notes: `Compra de ${data.quantity} unidades`
        });
      }

      return movement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['ecommerce-expenses'] });
      setShowPurchaseForm(false);
      setPurchaseData({ movement_date: format(new Date(), 'yyyy-MM-dd') });
      setCreateExpense(false);
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductSupplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      setShowSupplierForm(false);
      setSupplierData({});
      setEditingSupplier(null);
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductSupplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
      setShowSupplierForm(false);
      setSupplierData({});
      setEditingSupplier(null);
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductSupplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-suppliers'] });
    },
  });

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === purchaseData.product_id);
    createPurchaseMutation.mutate({
      ...purchaseData,
      product_name: product?.name,
      movement_type: 'purchase',
      total_cost: (purchaseData.quantity || 0) * (purchaseData.unit_cost || 0)
    });
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data: supplierData });
    } else {
      createSupplierMutation.mutate(supplierData);
    }
  };

  const openSupplierForm = (productId, supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierData(supplier);
    } else {
      setEditingSupplier(null);
      setSupplierData({ product_id: productId });
    }
    setShowSupplierForm(true);
  };

  const productSuppliers = selectedProduct 
    ? suppliers.filter(s => s.product_id === selectedProduct.id)
    : [];

  const productMovements = selectedProduct
    ? movements.filter(m => m.product_id === selectedProduct.id).slice(0, 20)
    : [];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black pb-4 mb-6">
          <h1 className="text-3xl font-bold text-black">Controle de Estoque</h1>
          <Button onClick={() => setShowPurchaseForm(true)} className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Compra
          </Button>
        </div>

        {!selectedProduct ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => {
              const isLowStock = product.stock_quantity <= (product.min_stock_alert || 0);
              const productSuppliersList = suppliers.filter(s => s.product_id === product.id);

              return (
                <Card 
                  key={product.id} 
                  className="border-black cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedProduct(product)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-black">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estoque</span>
                      <span className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-black'}`}>
                        {product.stock_quantity || 0} un
                      </span>
                    </div>
                    {product.min_stock_alert && (
                      <div className="text-xs text-gray-500">Mín: {product.min_stock_alert} un</div>
                    )}
                    <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                      {productSuppliersList.length} fornecedor(es)
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setSelectedProduct(null)} className="border-black mb-4">
              ← Voltar
            </Button>

            <Card className="border-black">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-black">{selectedProduct.name}</CardTitle>
                    {selectedProduct.sku && <div className="text-sm text-gray-500 mt-1">SKU: {selectedProduct.sku}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Estoque Atual</div>
                    <div className="text-4xl font-bold text-black">{selectedProduct.stock_quantity || 0} un</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Custo</div>
                    <div className="font-bold text-black">R$ {selectedProduct.product_cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Preço Venda</div>
                    <div className="font-bold text-black">R$ {selectedProduct.product_price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Embalagem</div>
                    <div className="font-bold text-black">R$ {(selectedProduct.packaging_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Frete</div>
                    <div className="font-bold text-black">R$ {(selectedProduct.shipping_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="suppliers" className="w-full">
              <TabsList className="grid w-full grid-cols-2 border border-black">
                <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
                <TabsTrigger value="movements">Movimentações</TabsTrigger>
              </TabsList>

              <TabsContent value="suppliers" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-black">Fornecedores</h3>
                  <Button onClick={() => openSupplierForm(selectedProduct.id)} className="bg-black hover:bg-gray-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fornecedor
                  </Button>
                </div>

                <div className="space-y-3">
                  {productSuppliers.map(supplier => (
                    <Card key={supplier.id} className="border-black">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-black">{supplier.supplier_name}</span>
                              {supplier.is_preferred && <Star className="h-4 w-4 fill-black text-black" />}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Preço: R$ {supplier.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {supplier.delivery_time_days && ` • Entrega: ${supplier.delivery_time_days} dias`}
                            </div>
                            {supplier.notes && <div className="text-xs text-gray-500 mt-1">{supplier.notes}</div>}
                          </div>
                          <div className="flex gap-1">
                            {supplier.supplier_url && (
                              <Button asChild variant="ghost" size="icon" className="hover:bg-gray-100">
                                <a href={supplier.supplier_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openSupplierForm(selectedProduct.id, supplier)}
                              className="hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteSupplierMutation.mutate(supplier.id)}
                              className="hover:bg-gray-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {productSuppliers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum fornecedor cadastrado
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="movements" className="space-y-4 mt-4">
                <h3 className="text-lg font-bold text-black">Histórico de Movimentações</h3>
                <div className="space-y-2">
                  {productMovements.map(movement => (
                    <div key={movement.id} className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {movement.movement_type === 'purchase' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          <span className="text-sm font-medium text-black">
                            {movement.movement_type === 'purchase' ? 'Compra' : movement.movement_type === 'sale' ? 'Venda' : 'Ajuste'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(movement.movement_date), 'dd/MM/yyyy')}
                          {movement.notes && ` • ${movement.notes}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${movement.movement_type === 'purchase' ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.movement_type === 'purchase' ? '+' : '-'}{movement.quantity} un
                        </div>
                        {movement.total_cost && (
                          <div className="text-xs text-gray-600">R$ {movement.total_cost?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {productMovements.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma movimentação registrada
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Purchase Form */}
        <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
          <DialogContent className="border-black">
            <DialogHeader>
              <DialogTitle className="text-black">Registrar Compra</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div>
                <Label className="text-black">Produto*</Label>
                <Select 
                  value={purchaseData.product_id} 
                  onValueChange={(v) => {
                    const product = products.find(p => p.id === v);
                    setPurchaseData({...purchaseData, product_id: v, product_name: product?.name});
                  }}
                >
                  <SelectTrigger className="border-black">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {purchaseData.product_id && suppliers.filter(s => s.product_id === purchaseData.product_id).length > 0 && (
                <div>
                  <Label className="text-black">Fornecedor</Label>
                  <Select 
                    value={purchaseData.supplier_id} 
                    onValueChange={(v) => {
                      const supplier = suppliers.find(s => s.id === v);
                      setPurchaseData({...purchaseData, supplier_id: v, unit_cost: supplier?.price});
                    }}
                  >
                    <SelectTrigger className="border-black">
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.filter(s => s.product_id === purchaseData.product_id).map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.supplier_name} - R$ {s.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Quantidade*</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={purchaseData.quantity || ''} 
                    onChange={(e) => setPurchaseData({...purchaseData, quantity: parseInt(e.target.value)})} 
                    className="border-black" 
                    required 
                  />
                </div>
                <div>
                  <Label className="text-black">Custo Unitário*</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={purchaseData.unit_cost || ''} 
                    onChange={(e) => setPurchaseData({...purchaseData, unit_cost: parseFloat(e.target.value)})} 
                    className="border-black" 
                    required 
                  />
                </div>
              </div>

              <div>
                <Label className="text-black">Data*</Label>
                <Input 
                  type="date"
                  value={purchaseData.movement_date || ''} 
                  onChange={(e) => setPurchaseData({...purchaseData, movement_date: e.target.value})} 
                  className="border-black" 
                  required 
                />
              </div>

              <div>
                <Label className="text-black">Observações</Label>
                <Input 
                  value={purchaseData.notes || ''} 
                  onChange={(e) => setPurchaseData({...purchaseData, notes: e.target.value})} 
                  className="border-black" 
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                <input 
                  type="checkbox" 
                  id="createExpense" 
                  checked={createExpense}
                  onChange={(e) => setCreateExpense(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="createExpense" className="text-sm text-black cursor-pointer">
                  Registrar como gasto também
                </Label>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custo Total</span>
                  <span className="font-bold text-black">
                    R$ {((purchaseData.quantity || 0) * (purchaseData.unit_cost || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowPurchaseForm(false)} className="border-black">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  Registrar Compra
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Supplier Form */}
        <Dialog open={showSupplierForm} onOpenChange={setShowSupplierForm}>
          <DialogContent className="border-black">
            <DialogHeader>
              <DialogTitle className="text-black">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <Label className="text-black">Nome do Fornecedor*</Label>
                <Input 
                  value={supplierData.supplier_name || ''} 
                  onChange={(e) => setSupplierData({...supplierData, supplier_name: e.target.value})} 
                  className="border-black" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black">Preço (R$)*</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={supplierData.price || ''} 
                    onChange={(e) => setSupplierData({...supplierData, price: parseFloat(e.target.value)})} 
                    className="border-black" 
                    required 
                  />
                </div>
                <div>
                  <Label className="text-black">Prazo (dias)</Label>
                  <Input 
                    type="number"
                    value={supplierData.delivery_time_days || ''} 
                    onChange={(e) => setSupplierData({...supplierData, delivery_time_days: parseInt(e.target.value)})} 
                    className="border-black" 
                  />
                </div>
              </div>

              <div>
                <Label className="text-black">Link de Compra</Label>
                <Input 
                  type="url"
                  value={supplierData.supplier_url || ''} 
                  onChange={(e) => setSupplierData({...supplierData, supplier_url: e.target.value})} 
                  className="border-black"
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label className="text-black">Observações</Label>
                <Input 
                  value={supplierData.notes || ''} 
                  onChange={(e) => setSupplierData({...supplierData, notes: e.target.value})} 
                  className="border-black" 
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isPreferred" 
                  checked={supplierData.is_preferred || false}
                  onChange={(e) => setSupplierData({...supplierData, is_preferred: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="isPreferred" className="text-sm text-black cursor-pointer">
                  Marcar como fornecedor preferencial
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowSupplierForm(false); setEditingSupplier(null); }} className="border-black">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-black hover:bg-gray-800">
                  {editingSupplier ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}