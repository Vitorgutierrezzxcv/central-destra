import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        // Parse Shopify webhook data
        const webhookData = await req.json();
        
        console.log('Shopify webhook recebido:', webhookData);

        const base44 = createClientFromRequest(req);

        // Extract order information
        const orderId = webhookData.id || webhookData.order_number;
        const lineItems = webhookData.line_items || [];
        const customerName = webhookData.customer?.first_name + ' ' + webhookData.customer?.last_name || 'Cliente Shopify';
        const orderDate = webhookData.created_at ? new Date(webhookData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Get all products to match by name or SKU
        const products = await base44.asServiceRole.entities.Product.list();

        // Process each line item
        for (const item of lineItems) {
            // Try to find matching product by name or SKU
            const product = products.find(p => 
                p.name.toLowerCase() === item.title.toLowerCase() || 
                p.sku === item.sku
            );

            if (!product) {
                console.warn(`Produto não encontrado: ${item.title} (SKU: ${item.sku})`);
                continue;
            }

            const quantity = item.quantity;
            const unitPrice = parseFloat(item.price);
            const totalAmount = unitPrice * quantity;

            // Calculate costs and profit
            const productCost = (product.product_cost || 0) * quantity;
            const packagingCost = (product.packaging_cost || 0) * quantity;
            const shippingCost = (product.shipping_cost || 0) * quantity;
            const totalCost = productCost + packagingCost + shippingCost;
            const profit = totalAmount - totalCost;
            const profitMargin = totalAmount > 0 ? (profit / totalAmount) * 100 : 0;

            // Create sale record
            await base44.asServiceRole.entities.Sale.create({
                product_id: product.id,
                product_name: product.name,
                quantity: quantity,
                unit_price: unitPrice,
                total_amount: totalAmount,
                total_cost: totalCost,
                profit: profit,
                profit_margin: profitMargin,
                sale_date: orderDate,
                customer_name: customerName,
                payment_method: 'credit_card',
                status: 'completed',
                notes: `Pedido Shopify #${orderId}`
            });

            // Update product stock
            const newStock = (product.stock_quantity || 0) - quantity;
            await base44.asServiceRole.entities.Product.update(product.id, {
                stock_quantity: newStock
            });

            // Create stock movement record
            await base44.asServiceRole.entities.StockMovement.create({
                product_id: product.id,
                product_name: product.name,
                movement_type: 'sale',
                quantity: -quantity,
                unit_cost: product.product_cost,
                total_cost: -totalCost,
                movement_date: orderDate,
                notes: `Venda Shopify #${orderId}`
            });

            console.log(`Venda criada para produto: ${product.name} - Qtd: ${quantity}`);
        }

        return Response.json({ 
            success: true,
            message: `${lineItems.length} vendas processadas com sucesso`,
            order_id: orderId
        });

    } catch (error) {
        console.error('Erro ao processar webhook Shopify:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});