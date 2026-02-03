// ===== OPM v4.0 - SISTEMA COMPLETO CON TIEMPO REAL =====
const STORAGE_KEY = 'opm_inventory_v4_final';

// ===== BASE DE DATOS =====
function getDB() {
    const db = localStorage.getItem(STORAGE_KEY);
    if (!db) return getDefaultDB();
    try {
        return JSON.parse(db);
    } catch {
        return getDefaultDB();
    }
}

function saveDB(data) {
    console.log('💾 Guardando base de datos...', {
        productCount: data.products.length,
        saleCount: data.sales.length
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateAllUI();
}

function getDefaultDB(initialCash = 0) {
    return {
        settings: {
            iva: 19,
            languages: ['ES', 'EN', 'JA'],
            categories: ['Pokémon', 'Funko Pop', 'Tecnología', 'Accesorios'],
            productTypes: ['Carta', 'Funko', 'Otro'],
            accounts: ['Efectivo', 'Nequi', 'NU', 'Bancolombia'],
            logo: ''
        },
        products: [],
        sales: [],
        purchases: [],
        expenses: [],
        transfers: [],
        accounts: [
            { id: 'efectivo', name: 'Efectivo', balance: initialCash, movements: [] },
            { id: 'nequi', name: 'Nequi', balance: 0, movements: [] },
            { id: 'nu', name: 'NU', balance: 0, movements: [] }
        ],
        loans: [],
        presales: [],
        reservations: []
    };
}

// ===== INICIALIZACIÓN =====
window.onload = function() {
    console.log('✅ OPM v4.0 CARGANDO...');
    loadLogo();
    showView('dashboard');
    updateAllUI();
    seedExampleData();
    
    // ACTUALIZACIÓN EN TIEMPO REAL CADA 5 SEGUNDOS
    setInterval(() => {
        updateAllUI();
        console.log('⏱️ Actualización automática ejecutada');
    }, 5000);
};

// ===== NAVEGACIÓN =====
function showView(viewName) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(viewName).classList.add('active');
    
    // ✅ Actualizar vistas específicas cuando se muestran
    if (viewName === 'salesHistory') {
        renderSalesHistory();
    }
    
    // ✅ INICIALIZAR SELECTOR DE MES EN REPORTES
if (viewName === 'reports') {
  fillReportDatePickers();
  updateReportMonth();
}
    
    updateAllUI();
}

// ===== LOGO =====
function uploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const db = getDB();
        db.settings.logo = e.target.result;
        saveDB(db);
        loadLogo();
    };
    reader.readAsDataURL(file);
}

function loadLogo() {
    const db = getDB();
    const logo = db.settings.logo;
    const logoImg = document.getElementById('headerLogo');
    const title = document.getElementById('headerTitle');
    
    if (logo && logo !== '' && logo !== 'undefined') {
        logoImg.src = logo;
        logoImg.style.display = 'block';
        logoImg.style.width = '50px';
        logoImg.style.height = '50px';
        logoImg.style.objectFit = 'contain';
        logoImg.style.borderRadius = '8px';
        logoImg.style.background = 'white';
        logoImg.style.padding = '5px';
        title.style.display = 'none';
        console.log('✅ Logo cargado:', logo.substring(0, 50) + '...');
    } else {
        logoImg.style.display = 'none';
        title.style.display = 'block';
        console.log('ℹ️ No hay logo guardado');
    }
}

// ===== DATOS EJEMPLO =====
function seedExampleData() {
    const db = getDB();
    if (db.products.length > 0) return;
    
    db.products.push({
        id: 'p1',
        sku: 'PKM-001',
        name: 'Pikachu VMAX',
        description: 'Carta ultra rara',
        language: 'ES',
        category: 'Pokémon',
        type: 'Carta',
        stock: 5,
        cost: 50000,
        price: 95000,
        supplier: 'Distribuidor',
        tags: ['raro'],
        images: ['https://images.pokemontcg.io/swsh45/SV111_hires.png'],
        applyIVA: true,
        history: [],
        status: 'disponible'
    });
    
    saveDB(db);
    console.log('✅ Datos de ejemplo cargados');
}

// ===== CRUD PRODUCTOS =====
function openProductModal(id = null) {
    const modal = document.getElementById('productModal');
    modal.style.display = 'block';
    document.getElementById('productForm').reset();
    
    // Generar SKU único con timestamp + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    document.getElementById('productSKU').value = `PRD-${timestamp}-${random}`;
    
    document.getElementById('productImages').innerHTML = '';
    document.getElementById('productId').value = '';
    
    const db = getDB();
    document.getElementById('productLanguage').innerHTML = '<option value="">-- Idioma --</option>' +
        db.settings.languages.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('productCategory').innerHTML = db.settings.categories.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('productType').innerHTML = db.settings.productTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    
    if (id) {
        const p = db.products.find(prod => prod.id === id);
        if (!p) return;
        
        document.getElementById('productId').value = p.id;
        document.getElementById('productSKU').value = p.sku;
        document.getElementById('productName').value = p.name;
        document.getElementById('productDescription').value = p.description;
        document.getElementById('productLanguage').value = p.language;
        document.getElementById('productCategory').value = p.category;
        document.getElementById('productType').value = p.type;
        document.getElementById('productStock').value = p.stock;
        document.getElementById('productCost').value = p.cost;
        document.getElementById('productPrice').value = p.price;
        document.getElementById('productSupplier').value = p.supplier || '';
        document.getElementById('productTags').value = p.tags.join(', ');
        document.getElementById('productIVA').checked = p.applyIVA;
        
        if (p.applyIVA) {
            setTimeout(() => calculatePriceWithIVA(), 100);
        }
        
        p.images.forEach(img => addImageToPreview(img));
    }
}

function addImageToPreview(src) {
    const div = document.getElementById('productImages');
    div.innerHTML += `
        <div style="margin:10px 0;">
            <img src="${src}" width="100" style="border-radius:8px;">
            <input type="hidden" class="image-src" value="${src}">
            <button type="button" onclick="removeImage(this)" class="btn-danger" style="padding:5px 10px;margin-left:10px;">❌</button>
        </div>
    `;
}

function addImageFromURL() {
    const url = document.getElementById('productImageURL').value.trim();
    if (!url) return alert('❌ Ingresa una URL válida');
    
    const img = new Image();
    img.onload = function() {
        addImageToPreview(url);
        document.getElementById('productImageURL').value = '';
    };
    img.onerror = function() {
        alert('❌ URL inválida o imagen no accesible');
    };
    img.src = url;
}

function removeImage(btn) {
    btn.parentElement.remove();
}

document.getElementById('productForm').onsubmit = function(e) {
    e.preventDefault();
    const db = getDB();
    
    const productIdInput = document.getElementById('productId').value;
    const isEditing = productIdInput.trim() !== '';
    
    const id = isEditing ? productIdInput : 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    if (!isEditing && db.products.some(p => p.id === id)) {
        console.error('⚠️ ID DUPLICADO DETECTADO:', id);
        alert('❌ Error: Se generó un ID duplicado. Intenta guardar nuevamente.');
        return;
    }
    
    const product = {
        id,
        sku: document.getElementById('productSKU').value,
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        language: document.getElementById('productLanguage').value,
        category: document.getElementById('productCategory').value,
        type: document.getElementById('productType').value,
        stock: parseInt(document.getElementById('productStock').value) || 0,
        cost: parseFloat(document.getElementById('productCost').value) || 0,
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        supplier: document.getElementById('productSupplier').value || '',
        tags: document.getElementById('productTags').value.split(',').map(t => t.trim()).filter(t => t),
        images: Array.from(document.querySelectorAll('.image-src')).map(i => i.value),
        applyIVA: document.getElementById('productIVA').checked,
        history: db.products.find(p => p.id === id)?.history || [],
        status: 'disponible'
    };
    
    if (!product.name || !product.language || !product.category || !product.type) {
        alert('❌ Nombre, idioma, categoría y tipo son obligatorios');
        return;
    }
    
    if (isEditing) {
        db.products = db.products.filter(p => p.id !== id);
        console.log('✏️ Editando producto existente ID:', id);
    } else {
        console.log('➕ Creando producto nuevo ID:', id);
    }
    
    db.products.push(product);
    
    try {
        saveDB(db);
        console.log('✅ Producto guardado correctamente. Total:', db.products.length);
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert('❌ Error al guardar el producto: ' + error.message);
        return;
    }
    
    closeModal('productModal');
    alert('✅ Producto guardado correctamente');
    
    document.getElementById('inventoryLanguageFilter').value = '';
    document.getElementById('inventoryCategoryFilter').value = '';
    document.getElementById('productFilter').value = '';
    
    renderProductList(db.products);
};

function showProductDetails(id) {
    const db = getDB();
    const product = db.products.find(p => p.id === id);
    if (!product) return;
    
    const modal = document.getElementById('productDetailsModal');
    modal.style.display = 'block';
    
    const ivaAmount = product.applyIVA ? product.cost - (product.cost / (1 + db.settings.iva / 100)) : 0;
    const costWithoutIVA = product.applyIVA ? product.cost - ivaAmount : product.cost;
    const profit = product.price - product.cost;
    const profitMargin = ((profit / product.cost) * 100).toFixed(2);
    
    document.getElementById('productDetailsContent').innerHTML = `
        <div class="detail-grid">
            <div class="detail-item"><strong>SKU:</strong> ${product.sku}</div>
            <div class="detail-item"><strong>Nombre:</strong> ${product.name}</div>
            <div class="detail-item"><strong>Idioma:</strong> ${product.language}</div>
            <div class="detail-item"><strong>Categoría:</strong> ${product.category}</div>
            <div class="detail-item"><strong>Tipo:</strong> ${product.type}</div>
            <div class="detail-item"><strong>Stock:</strong> ${product.stock}</div>
            <div class="detail-item"><strong>Costo sin IVA:</strong> $${costWithoutIVA.toLocaleString()}</div>
            ${product.applyIVA ? `
            <div class="detail-item"><strong>IVA (${db.settings.iva}%):</strong> $${ivaAmount.toLocaleString()}</div>
            <div class="detail-item"><strong>Costo TOTAL:</strong> $${product.cost.toLocaleString()}</div>
            ` : `
            <div class="detail-item"><strong>Costo (sin IVA):</strong> $${product.cost.toLocaleString()}</div>
            `}
            <div class="detail-item"><strong>Precio Venta:</strong> $${product.price.toLocaleString()}</div>
            <div class="detail-item"><strong>Ganancia:</strong> $${profit.toLocaleString()}</div>
            <div class="detail-item"><strong>Margen:</strong> ${profitMargin}%</div>
        </div>
        ${product.images.length > 0 ? `<img src="${product.images[0]}" style="width:100%;max-height:300px;object-fit:contain;border-radius:8px;">` : ''}
        <p style="margin-top:20px;"><strong>Descripción:</strong> ${product.description}</p>
        <p><strong>Proveedor:</strong> ${product.supplier || 'N/A'}</p>
        <p><strong>Etiquetas:</strong> ${product.tags.join(', ')}</p>
        <p><strong>¿Aplica IVA?</strong> ${product.applyIVA ? 'Sí' : 'No'}</p>
        <p><strong>Estado:</strong> ${product.status}</p>
    `;
}

function closeDetailsModal() {
    document.getElementById('productDetailsModal').style.display = 'none';
}

function editProduct(id) {
    const db = getDB();
    const product = db.products.find(p => p.id === id);
    if (!product) {
        alert('❌ Producto no encontrado');
        return;
    }
    openProductModal(id);
}

function deleteProduct(id) {
    const db = getDB();
    const product = db.products.find(p => p.id === id);
    
    if (!product) {
        alert('❌ Producto no encontrado');
        return;
    }
    
    const salesUsing = db.sales.filter(s => s.items.some(item => item.id === id));
    
    let warningMessage = `¿Eliminar "${product.name}"?`;
    if (salesUsing.length > 0) {
        warningMessage = `⚠️ ADVERTENCIA: Este producto tiene ${salesUsing.length} venta(s) registradas.\n\n¿Realmente deseas ELIMINAR PERMANENTEMENTE "${product.name}"?`;
    }
    
    if (!confirm(warningMessage)) return;
    
    db.products = db.products.filter(p => p.id !== id);
    
    try {
        saveDB(db);
        alert(`✅ Producto eliminado: ${product.name}`);
        console.log('🗑️ Producto eliminado ID:', id);
    } catch (error) {
        console.error('❌ Error al eliminar:', error);
        alert('❌ Error al eliminar el producto: ' + error.message);
    }
}

function filterInventory() {
    const db = getDB();
    const language = document.getElementById('inventoryLanguageFilter').value;
    const category = document.getElementById('inventoryCategoryFilter').value;
    const type = document.getElementById('productFilter').value;
    const hideOutOfStock = document.getElementById('hideOutOfStockToggle').checked;
    
    let filtered = db.products;
    if (language) filtered = filtered.filter(p => p.language === language);
    if (category) filtered = filtered.filter(p => p.category === category);
    if (type) filtered = filtered.filter(p => p.type === type);
    
    if (hideOutOfStock) {
        filtered = filtered.filter(p => p.stock > 0);
    }
    
    renderProductList(filtered);
}

function renderProductList(products) {
    const list = document.getElementById('productList');
    const db = getDB();
    
    document.getElementById('inventoryLanguageFilter').innerHTML = '<option value="">Todos los idiomas</option>' +
        db.settings.languages.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('inventoryCategoryFilter').innerHTML = '<option value="">Todas las categorías</option>' +
        db.settings.categories.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('productFilter').innerHTML = '<option value="">Todos los tipos</option>' +
        db.settings.productTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    
    if (products.length === 0) {
        list.innerHTML = '<div class="content-card"><p style="padding:20px;text-align:center;color:#999;">No hay productos</p></div>';
        return;
    }
    
    list.innerHTML = products.map(p => `
        <div class="list-item" onclick="showProductDetails('${p.id}')" style="cursor:pointer;">
            ${p.images.length > 0 ? `<img src="${p.images[0]}" alt="${p.name}">` : '<img src="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 80 80\'><rect fill=\'%23e2e8f0\' width=\'80\' height=\'80\'/><text x=\'50%\' y=\'50%\' font-size=\'20\' fill=\'%23999\' text-anchor=\'middle\' dominant-baseline=\'middle\'>🎮</text></svg>" alt="No image">'}
            <div style="flex:1;">
                <strong>${p.name}</strong>
                <span style="color:#666;font-size:12px;margin-left:10px;">(${p.sku})</span>
                <br>
                <small>Idioma: ${p.language} | Stock: ${p.stock} | Precio: $${p.price.toLocaleString()}</small>
                <br>
                <small>Costo: $${formatNumber(p.cost)} | Ganancia: $${formatNumber(p.price - p.cost)}</small>
            </div>
            <div class="actions" onclick="event.stopPropagation();">
                <button onclick="editProduct('${p.id}')" class="btn-primary" title="Editar">✏️</button>
                <button onclick="deleteProduct('${p.id}')" class="btn-danger" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ===== VENTAS =====
let cart = [];

function filterSalesProducts() {
    const db = getDB();
    const query = document.getElementById('searchProductSale').value.toLowerCase();
    const language = document.getElementById('salesLanguageFilter').value;
    const category = document.getElementById('salesCategoryFilter').value;
    const type = document.getElementById('salesTypeFilter').value;
    
    let filtered = db.products.filter(p => p.stock > 0 && p.status === 'disponible');
    
    if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    if (language) filtered = filtered.filter(p => p.language === language);
    if (category) filtered = filtered.filter(p => p.category === category);
    if (type) filtered = filtered.filter(p => p.type === type);
    
    renderSalesGrid(filtered);
}

function renderSalesGrid(products) {
    const grid = document.getElementById('salesProductsGrid');
    const db = getDB();
    
    document.getElementById('salesLanguageFilter').innerHTML = '<option value="">Todos los idiomas</option>' +
        db.settings.languages.map(l => `<option value="${l}">${l}</option>`).join('');
    document.getElementById('salesCategoryFilter').innerHTML = '<option value="">Todas las categorías</option>' +
        db.settings.categories.map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('salesTypeFilter').innerHTML = '<option value="">Todos los tipos</option>' +
        db.settings.productTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay productos con stock disponible</p>';
        return;
    }
    
    grid.innerHTML = products.map(p => `
        <div class="product-card ${p.stock === 0 ? 'out-of-stock' : ''}" onclick="addToCart('${p.id}')">
            ${p.images.length > 0 ? `<img src="${p.images[0]}" alt="${p.name}">` : '<div style="height:150px;background:#eee;border-radius:8px;"></div>'}
            <h4>${p.name}</h4>
            <p>$${p.price.toLocaleString()}</p>
            <p class="stock">Stock: ${p.stock}</p>
        </div>
    `).join('');
}

function addToCart(productId) {
    const db = getDB();
    const product = db.products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;
    
    const existing = cart.find(i => i.id === productId);
    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
        } else {
            alert(`❌ Stock insuficiente. Máximo: ${product.stock}`);
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    renderCart();
}

function clearCart() {
    if (confirm('¿Vaciar carrito?')) {
        cart = [];
        renderCart();
    }
}

function renderCart() {
    const div = document.getElementById('cartItems');
    const cartSection = document.getElementById('cart');
    
    if (cart.length === 0) {
        div.innerHTML = '<p style="padding:15px;text-align:center;color:#999;">Carrito vacío</p>';
        cartSection.style.display = 'none';
        updateCartTotals();
        return;
    }
    
    cartSection.style.display = 'block';
    
    div.innerHTML = cart.map(item => `
        <div class="list-item">
            ${item.images.length > 0 ? `<img src="${item.images[0]}" alt="${item.name}">` : ''}
            <div style="flex:1;">
                <strong>${item.name}</strong><br>
                <small>$${item.price.toLocaleString()} c/u</small>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <button onclick="changeQuantity('${item.id}', -1)" class="btn-secondary" style="padding:5px 10px;">-</button>
                <span style="font-weight:bold;">${item.quantity}</span>
                <button onclick="changeQuantity('${item.id}', 1)" class="btn-secondary" style="padding:5px 10px;">+</button>
                <button onclick="removeFromCart('${item.id}')" class="btn-danger" style="padding:5px 10px;">❌</button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('cartCount').textContent = `(${cart.reduce((sum, i) => sum + i.quantity, 0)})`;
    updateCartTotals();
}

function changeQuantity(productId, delta) {
    const db = getDB();
    const product = db.products.find(p => p.id === productId);
    const item = cart.find(i => i.id === productId);
    if (!item || !product) return;
    
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > product.stock) {
        alert(`❌ Stock insuficiente. Máximo: ${product.stock}`);
        return;
    }
    
    item.quantity = newQuantity;
    renderCart();
}

function updateCartTotals() {
    const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
    const discountFixed = parseFloat(document.getElementById('discountFixedInput').value) || 0;
    
    let total = subtotal;
    if (discountPercent > 0) total = total * (1 - discountPercent / 100);
    total = Math.max(0, total - discountFixed);
    
    document.getElementById('cartSubtotal').textContent = '$' + subtotal.toLocaleString();
    document.getElementById('cartTotal').textContent = '$' + total.toLocaleString();
}

function processSale() {
    if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    const subtotal = Number(cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)) || 0;
    const discountPercent = Number(document.getElementById('discountInput').value) || 0;
    const discountFixed = Number(document.getElementById('discountFixedInput').value) || 0;
    
    let total = subtotal;
    if (discountPercent > 0) total = total * (1 - discountPercent / 100);
    total = Math.max(0, total - discountFixed);
    
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'block';
    document.getElementById('modalTotalAmount').textContent = '$' + total.toLocaleString() + ' COP';
    
    const db = getDB();
    document.getElementById('modalPaymentAccount').innerHTML = db.settings.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    
    window.pendingSale = {
        items: JSON.parse(JSON.stringify(cart)),
        discountPercent: discountPercent,
        discountFixed: discountFixed,
        subtotal: subtotal,
        total: total
    };
}

document.getElementById('paymentForm').onsubmit = function(e) {
    e.preventDefault();
    
    const db = getDB();
    const account = document.getElementById('modalPaymentAccount').value;
    
    if (!account) {
        alert('❌ Selecciona una cuenta');
        return;
    }
    
    for (let item of window.pendingSale.items) {
        const product = db.products.find(p => p.id === item.id);
        if (!product || product.stock < item.quantity) {
            alert(`❌ Stock insuficiente: ${item.name}`);
            return;
        }
    }
    
    const saleId = Date.now().toString();
    // Obtener fecha de venta (personalizada o actual)
const useCustomDate = document.getElementById('customDateCheckbox').checked;
const customDate = document.getElementById('customSaleDate').value;
const saleDate = useCustomDate && customDate ? 
    new Date(customDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString() : 
    new Date().toISOString();

const sale = {
    id: saleId,
    items: window.pendingSale.items.map(i => ({ 
        id: i.id, 
        name: i.name, 
        quantity: i.quantity, 
        price: i.price, 
        cost: i.cost 
    })),
    discountPercent: window.pendingSale.discountPercent,
    discountFixed: window.pendingSale.discountFixed,
    subtotal: window.pendingSale.subtotal,
    total: window.pendingSale.total,
    account: account,
    date: saleDate,
    timestamp: Date.now(),
    customDate: useCustomDate // Guardar registro de que usó fecha personalizada
};
    
    db.sales.push(sale);
    
    window.pendingSale.items.forEach(item => {
        const product = db.products.find(p => p.id === item.id);
        product.stock -= item.quantity;
        product.history.push({
            type: 'venta',
            quantity: item.quantity,
            date: sale.date,
            saleId: sale.id
        });
    });
    
    const acc = db.accounts.find(a => a.name === account);
    if (acc) {
        acc.balance += sale.total;
        acc.movements.push({
            type: 'ingreso',
            amount: sale.total,
            concepto: `Venta #${sale.id}`,
            date: sale.date
        });
    }
    
    saveDB(db);
    closeModal('paymentModal');
    generateReceipt(sale);
    cart = [];
    renderCart();
    alert('✅ Venta realizada correctamente');
};

function generateReceipt(sale, openWindow = true) {
    const db = getDB();
    const logo = db.settings.logo;
    
    const discountPercent = Number(sale.discountPercent) || 0;
    const discountFixed = Number(sale.discountFixed) || 0;
    const subtotal = Number(sale.subtotal) || 0;
    const total = Number(sale.total) || 0;
    
    const totalDiscount = subtotal - total;
    
    let discountHtml = '';
    if (totalDiscount > 0) {
        discountHtml = `
            <div style="margin:20px 0; padding:15px; background:#f0f8ff; border-radius:8px; border:2px solid #1e40af;">
                <h3 style="color:#1e40af; margin:0 0 10px 0; text-align:center;">🏷️ DESCUENTOS APLICADOS</h3>
                ${discountPercent > 0 ? `<p style="margin:8px 0;">📊 Porcentual: <strong style="color:#1e40af;">${discountPercent}%</strong></p>` : ''}
                ${discountFixed > 0 ? `<p style="margin:8px 0;">💰 Fijo: <strong style="color:#1e40af;">$${discountFixed.toLocaleString()} COP</strong></p>` : ''}
                <hr style="border:1px dashed #1e40af;">
                <p style="margin:10px 0; font-size:18px; color:var(--success); text-align:center;">
                    💵 TOTAL AHORRADO: <strong>$${totalDiscount.toLocaleString()} COP</strong>
                </p>
            </div>
        `;
    }
    
    const logoHtml = (logo && logo !== '' && logo !== 'undefined') ? 
        `<div style="text-align:center; margin-bottom:20px;">
            <img src="${logo}" style="max-width:150px; max-height:80px; object-fit:contain; border-radius:8px; background:white; padding:10px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        </div>` 
        : '<h1 style="text-align:center; color:#1e40af; margin-bottom:20px;">🎮 ONE PLAY MORE</h1>';
    
    const itemsHtml = sale.items.map(i => `
        <tr>
            <td style="text-align:left; padding:8px;">${i.name}</td>
            <td style="text-align:center; padding:8px;">${i.quantity}</td>
            <td style="text-align:right; padding:8px;">$${Number(i.price).toLocaleString()}</td>
            <td style="text-align:right; padding:8px;"><strong>$${(Number(i.price) * i.quantity).toLocaleString()}</strong></td>
        </tr>
    `).join('');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Recibo #${sale.id}</title>
            <style>
                body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); max-width: 450px; margin: 0 auto; }
                .receipt-container { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
                h1, h2 { color: #1e40af; text-align: center; margin: 10px 0; }
                h1 { font-size: 28px; border-bottom: 3px solid #1e40af; padding-bottom: 15px; }
                h2 { font-size: 20px; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
                th { background: #1e40af; color: white; padding: 12px; text-align: center; }
                td { border-bottom: 1px solid #eee; padding: 10px; }
                .total-section { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
                .total-amount { font-size: 32px; font-weight: 800; margin: 10px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #cbd5e1; }
                .date-info { background: #f1f5f9; padding: 10px; border-radius: 8px; margin: 10px 0; }
                .print-btn { width: 100%; padding: 15px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 20px; transition: all 0.3s; }
                .print-btn:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3); }
            </style>
        </head>
        <body>
            <div class="receipt-container">
            ${logoHtml}
            <h2>Recibo de Venta #${sale.id}</h2>
            <div class="date-info">
                <p><strong>📅 Fecha:</strong> ${new Date(sale.date).toLocaleString()}</p>
                ${sale.customDate ? `<p><strong>📝 Fecha registrada:</strong> ${new Date(sale.date).toLocaleDateString()}</p>` : ''}
                <p><strong>💳 Cuenta:</strong> ${sale.account}</p>
            </div>
                <div style="margin: 20px 0;">
                    <h3 style="color:#1e40af; text-align:center;">🛒 Productos</h3>
                    <table>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio Unit</th>
                            <th>Subtotal</th>
                        </tr>
                        ${itemsHtml}
                    </table>
                </div>
                ${discountHtml}
                <div class="total-section">
                    <p style="margin:0;">TOTAL A PAGAR</p>
                    <div class="total-amount">$${total.toLocaleString()} COP</div>
                </div>
                <div class="footer">
                    <p style="font-size:18px; color:#059669; margin-bottom:10px; font-weight:bold;">✅ ¡GRACIAS POR TU COMPRA!</p>
                    <p style="font-size:12px; color:#999;">One Play More - Sistema OPM v4.0</p>
                    ${openWindow ? '<button onclick="window.print()" class="print-btn">🖨️ Imprimir Recibo</button>' : ''}
                </div>
            </div>
        </body>
        </html>
    `;
    
    if (openWindow) {
        const receiptWindow = window.open('', '_blank', 'width=450,height=700');
        receiptWindow.document.write(htmlContent);
    } else {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <span class="close" onclick="this.parentElement.parentElement.remove()" style="cursor:pointer;float:right;font-size:28px;">&times;</span>
                ${htmlContent}
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.onclick = function(e) {
            if (e.target === modal) modal.remove();
        };
    }
}

// ===== COMPRAS Y GASTOS =====
function openPurchaseModal(type) {
    const modal = document.getElementById('purchaseModal');
    modal.style.display = 'block';
    document.getElementById('purchaseType').value = type;
    document.getElementById('purchaseForm').reset();
    document.getElementById('purchaseImages').innerHTML = '';
window.purchaseImages = []; // array temporal
    
    const db = getDB();
    const selectDiv = document.getElementById('purchaseProductSelect');
    const accountSelect = document.getElementById('purchaseAccount');
    
    accountSelect.innerHTML = db.settings.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    
    if (type === 'stock') {
        selectDiv.innerHTML = `
            <select id="purchaseProductId" required>
                <option value="">-- Seleccionar Producto --</option>
                ${db.products.map(p => `<option value="${p.id}">${p.name} (SKU: ${p.sku})</option>`).join('')}
            </select>
        `;
        document.getElementById('purchaseModalTitle').textContent = 'Reabastecer Stock';
    } else {
        selectDiv.innerHTML = `
            <input type="text" id="purchaseProductName" placeholder="Nombre del nuevo producto" required>
            <select id="purchaseProductLanguage" required>
                <option value="">-- Idioma --</option>
                ${db.settings.languages.map(l => `<option value="${l}">${l}</option>`).join('')}
            </select>
            <select id="purchaseProductCategory" required>
                <option value="">-- Categoría --</option>
                ${db.settings.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <select id="purchaseProductType" required>
                <option value="">-- Tipo --</option>
                ${db.settings.productTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
        `;
        document.getElementById('purchaseModalTitle').textContent = 'Comprar Nuevo Producto';
    }
}

function openExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.style.display = 'block';
    document.getElementById('expenseForm').reset();
    
    const db = getDB();
    document.getElementById('expenseAccount').innerHTML = db.settings.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
}

document.getElementById('purchaseForm').onsubmit = function(e) {
    e.preventDefault();
    const db = getDB();
    const type = document.getElementById('purchaseType').value;
    const account = document.getElementById('purchaseAccount').value;
    const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 0;
    const unitCost = parseFloat(document.getElementById('purchaseUnitCost').value) || 0;
    const applyIVA = document.getElementById('purchaseIVA').checked;
    const manualPrice = parseFloat(document.getElementById('salePriceManual').value) || 0;
    
    let totalUnitCost = unitCost;
    if (applyIVA) {
        totalUnitCost = unitCost * (1 + db.settings.iva / 100);
    }
    
    const totalPurchase = quantity * totalUnitCost;
    
    const acc = db.accounts.find(a => a.name === account);
    if (!acc || acc.balance < totalPurchase) {
        alert(`❌ SALDO INSUFICIENTE EN ${account}\n\nNecesitas: $${totalPurchase.toLocaleString()}\nDisponible: $${acc?.balance.toLocaleString() || 0}`);
        return;
    }
    
    let salePrice = manualPrice;
    if (!salePrice) {
        salePrice = totalUnitCost * 1.30;
    }
    
    if (type === 'stock') {
        const productId = document.getElementById('purchaseProductId').value;
        const product = db.products.find(p => p.id === productId);
        if (!product) return;
        
        product.stock += quantity;
        product.cost = totalUnitCost;
        product.applyIVA = applyIVA;
        
        db.purchases.push({
            id: Date.now().toString(),
            type: 'reabastecimiento',
            productId: product.id,
            productName: product.name,
            quantity,
            unitCost: totalUnitCost,
            total: totalPurchase,
            account,
            date: new Date().toISOString()
        });
        
        alert(`✅ Stock actualizado: ${product.name} +${quantity}`);
    } else {
        const name = document.getElementById('purchaseProductName').value;
        const language = document.getElementById('purchaseProductLanguage').value;
        const category = document.getElementById('purchaseProductCategory').value;
        const productType = document.getElementById('purchaseProductType').value;
        
        const newProduct = {
            id: Date.now().toString(),
            sku: 'PRD-' + Date.now().toString().slice(-6),
            name,
            description: 'Producto nuevo',
            language,
            category,
            type: productType,
            stock: quantity,
            cost: totalUnitCost,
            price: salePrice,
            supplier: document.getElementById('purchaseSupplier').value || '',
            tags: [],
            images: window.purchaseImages || [],
            applyIVA: applyIVA,
            history: [],
            status: 'disponible'
        };
        
        db.products.push(newProduct);
        
        db.purchases.push({
            id: Date.now().toString(),
            type: 'nuevo_producto',
            productId: newProduct.id,
            productName: newProduct.name,
            quantity,
            unitCost: totalUnitCost,
            total: totalPurchase,
            account,
            date: new Date().toISOString()
        });
        
        alert(`✅ Producto nuevo agregado: ${newProduct.name}`);
    }
    
    acc.balance -= totalPurchase;
    acc.movements.push({
        type: 'egreso',
        amount: totalPurchase,
        concepto: type === 'stock' ? `Compra stock` : `Compra nuevo producto`,
        date: new Date().toISOString()
    });
    
    saveDB(db);
    closeModal('purchaseModal');
};

document.getElementById('expenseForm').onsubmit = function(e) {
    e.preventDefault();
    const db = getDB();
    
    const expense = {
        id: Date.now().toString(),
        concept: document.getElementById('expenseConcept').value,
        amount: parseFloat(document.getElementById('expenseAmount').value) || 0,
        category: document.getElementById('expenseCategory').value,
        account: document.getElementById('expenseAccount').value,
        notes: document.getElementById('expenseNotes').value,
        date: new Date().toISOString()
    };
    
    if (!expense.concept || !expense.category || expense.amount <= 0) {
        alert('❌ Completa todos los campos obligatorios');
        return;
    }
    
    const acc = db.accounts.find(a => a.name === expense.account);
    if (!acc || acc.balance < expense.amount) {
        alert(`❌ SALDO INSUFICIENTE EN ${expense.account}\n\nNecesitas: $${expense.amount.toLocaleString()}\nDisponible: $${acc?.balance.toLocaleString() || 0}`);
        return;
    }
    
    db.expenses.push(expense);
    
    acc.balance -= expense.amount;
    acc.movements.push({
        type: 'egreso',
        amount: expense.amount,
        concepto: `Gasto: ${expense.concept}`,
        date: expense.date
    });
    
    saveDB(db);
    closeModal('expenseModal');
    alert('✅ Gasto registrado');
};

function renderPurchases() {
    const db = getDB();
    const list = document.getElementById('purchasesList');
    
    const allPurchases = [...db.purchases, ...db.expenses.map(e => ({...e, type: 'gasto', category: e.category}))];
    allPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allPurchases.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay compras o gastos registrados</p>';
        return;
    }
    
    list.innerHTML = allPurchases.map(p => `
        <div class="list-item">
            <div style="flex:1;">
                <strong>${p.productName || p.concept}</strong><br>
                <small style="color:#999;">${p.type || 'gasto'} | ${p.category || ''} | ${new Date(p.date).toLocaleString()}</small>
                ${p.notes ? `<br><small>${p.notes}</small>` : ''}
            </div>
            <div style="text-align:right;">
                <p style="color:var(--danger);font-weight:bold;">-$${(p.total || p.amount).toLocaleString()}</p>
                ${p.quantity ? `<small>Cant: ${p.quantity}</small>` : ''}
            </div>
        </div>
    `).join('');
}

// ===== CUENTAS =====
function renderAccounts() {
    const db = getDB();
    const grid = document.getElementById('accountsGrid');
    grid.innerHTML = db.accounts.map(acc => `
        <div class="stat-card" style="cursor:pointer;" onclick="showAccountDetails('${acc.id}')">
            <h3>${acc.name}</h3>
            <p style="font-size:32px;color:${acc.balance >= 0 ? 'var(--success)' : 'var(--danger)'};">
                $${acc.balance.toLocaleString()}
            </p>
        </div>
    `).join('');
}

function showAccountDetails(accountId) {
    const db = getDB();
    const account = db.accounts.find(a => a.id === accountId);
    if (!account) return;
    
    const movementsHtml = account.movements.slice().reverse().map(m => `
        <div class="list-item">
            <div style="flex:1;">
                <strong>${m.concepto}</strong><br>
                <small>${new Date(m.date).toLocaleString()}</small>
            </div>
            <div style="color:${m.type === 'ingreso' ? 'var(--success)' : 'var(--danger)'};font-weight:bold;">
                ${m.type === 'ingreso' ? '+' : '-'}$${m.amount.toLocaleString()}
            </div>
        </div>
    `).join('');
    
    document.getElementById('accountMovements').innerHTML = `
        <div class="stat-card" style="margin-top:20px;">
            <h3>Historial: ${account.name}</h3>
            <div class="data-list">${movementsHtml || '<p style="padding:15px;">No hay movimientos</p>'}</div>
        </div>
    `;
}

// ===== TRANSFERENCIAS =====
function openTransferModal() {
    const modal = document.getElementById('transferModal');
    modal.style.display = 'block';
    document.getElementById('transferForm').reset();
    
    const db = getDB();
    const accounts = db.settings.accounts;
    
    document.getElementById('transferFromAccount').innerHTML = '<option value="">-- De la cuenta --</option>' +
        accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    document.getElementById('transferToAccount').innerHTML = '<option value="">-- A la cuenta --</option>' +
        accounts.map(a => `<option value="${a}">${a}</option>`).join('');
}

document.getElementById('transferForm').onsubmit = function(e) {
    e.preventDefault();
    const db = getDB();
    
    const fromAccount = document.getElementById('transferFromAccount').value;
    const toAccount = document.getElementById('transferToAccount').value;
    const amount = parseFloat(document.getElementById('transferAmount').value) || 0;
    const notes = document.getElementById('transferNotes').value;
    
    if (!fromAccount || !toAccount || amount <= 0) {
        alert('❌ Completa todos los campos');
        return;
    }
    
    if (fromAccount === toAccount) {
        alert('❌ Las cuentas deben ser diferentes');
        return;
    }
    
    const accFrom = db.accounts.find(a => a.name === fromAccount);
    const accTo = db.accounts.find(a => a.name === toAccount);
    
    if (!accFrom || !accTo) {
        alert('❌ Cuenta no encontrada');
        return;
    }
    
    if (accFrom.balance < amount) {
        alert(`❌ SALDO INSUFICIENTE EN ${fromAccount}\n\nNecesitas: $${amount.toLocaleString()}\nDisponible: $${accFrom.balance.toLocaleString()}`);
        return;
    }
    
    accFrom.balance -= amount;
    accTo.balance += amount;
    
    const transfer = {
        id: Date.now().toString(),
        from: fromAccount,
        to: toAccount,
        amount,
        notes,
        date: new Date().toISOString()
    };
    
    db.transfers.push(transfer);
    
    accFrom.movements.push({
        type: 'egreso',
        amount,
        concepto: `Transferencia a ${toAccount}`,
        date: transfer.date
    });
    
    accTo.movements.push({
        type: 'ingreso',
        amount,
        concepto: `Transferencia de ${fromAccount}`,
        date: transfer.date
    });
    
    saveDB(db);
    closeModal('transferModal');
    alert('✅ Transferencia realizada correctamente');
}

function renderTransfers() {
    const db = getDB();
    const list = document.getElementById('transfersList');
    
    if (db.transfers.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay transferencias registradas</p>';
        return;
    }
    
    list.innerHTML = db.transfers.slice().reverse().map(t => `
        <div class="list-item">
            <div style="flex:1;">
                <strong>${t.from} → ${t.to}</strong><br>
                <small>${new Date(t.date).toLocaleString()}</small>
                ${t.notes ? `<br><small>${t.notes}</small>` : ''}
            </div>
            <div style="color:var(--primary);font-weight:bold;font-size:18px;">
                $${t.amount.toLocaleString()}
            </div>
        </div>
    `).join('');
}

// ===== PRÉSTAMOS =====
function openLoanModal(loanId = null) {
    const modal = document.getElementById('loanModal');
    modal.style.display = 'block';
    document.getElementById('loanForm').reset();
    
    const db = getDB();
    document.getElementById('loanAccount').innerHTML = db.settings.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    
    if (loanId) {
        const loan = db.loans.find(l => l.id === loanId);
        if (!loan) return;
        
        document.getElementById('loanId').value = loan.id;
        document.getElementById('loanType').value = loan.type;
        document.getElementById('loanPerson').value = loan.person;
        document.getElementById('loanAmount').value = loan.amount;
        document.getElementById('loanAccount').value = loan.account;
        document.getElementById('loanNotes').value = loan.notes || '';
        
        // Mostrar información de pagos si existe
        if (loan.payments && loan.payments.length > 0) {
            const paymentsHtml = loan.payments.map(p => `
                <div style="padding:8px;background:#f8f9fa;border-radius:4px;margin:4px 0;">
                    <small>${new Date(p.date).toLocaleString()} - $${p.amount.toLocaleString()} (${p.account})</small>
                </div>
            `).join('');
            
            document.getElementById('loanPaymentsInfo').innerHTML = `
                <div style="margin:15px 0;padding:10px;background:#e8f5e8;border-radius:8px;">
                    <h4 style="color:var(--success);margin-bottom:10px;">📋 Historial de Pagos</h4>
                    ${paymentsHtml}
                    <div style="margin-top:10px;font-weight:bold;color:var(--success);">
                        Total pagado: $${(loan.paidAmount || 0).toLocaleString()}
                    </div>
                </div>
            `;
        }
        
        document.querySelector('#loanModal h3').textContent = '✏️ Editar Préstamo';
    } else {
        document.getElementById('loanId').value = '';
        document.querySelector('#loanModal h3').textContent = 'Registrar Préstamo';
        document.getElementById('loanPaymentsInfo').innerHTML = '';
    }
}

document.getElementById('loanForm').onsubmit = function(e) {
    e.preventDefault();
    const db = getDB();
    
    const loanId = document.getElementById('loanId').value;
    const isEditing = loanId.trim() !== '';
    
    const loanData = {
        type: document.getElementById('loanType').value,
        person: document.getElementById('loanPerson').value,
        amount: parseFloat(document.getElementById('loanAmount').value) || 0,
        account: document.getElementById('loanAccount').value,
        notes: document.getElementById('loanNotes').value,
        date: new Date().toISOString(),
        status: 'activo'
    };
    
    if (!loanData.type || !loanData.person || !loanData.account || loanData.amount <= 0) {
        alert('❌ Completa todos los campos obligatorios');
        return;
    }
    
    const acc = db.accounts.find(a => a.name === loanData.account);
    if (!acc) return;
    
    if (isEditing) {
        const loan = db.loans.find(l => l.id === loanId);
        if (!loan || loan.status !== 'activo') {
            alert('❌ Préstamo no encontrado o no está activo');
            return;
        }
        
        const oldAmount = loan.amount;
        const newAmount = loanData.amount;
        const difference = newAmount - oldAmount;
        
        if ((loan.type === 'presto' || loan.type === 'app') && difference > 0 && acc.balance < difference) {
            alert(`❌ SALDO INSUFICIENTE EN ${acc.name}\n\nNecesitas adicional: $${difference.toLocaleString()}\nDisponible: $${acc.balance.toLocaleString()}`);
            return;
        }
        
        if (loan.type === 'presto' || loan.type === 'app') {
            acc.balance += oldAmount;
        } else if (loan.type === 'prestan') {
            acc.balance -= oldAmount;
        }
        
        if (loanData.type === 'presto' || loanData.type === 'app') {
            acc.balance -= newAmount;
        } else if (loanData.type === 'prestan') {
            acc.balance += newAmount;
        }
        
        acc.movements.push({
            type: 'ingreso',
            amount: oldAmount,
            concepto: `Ajuste préstamo (reversión): ${loan.person}`,
            date: loanData.date
        });
        
        acc.movements.push({
            type: (loanData.type === 'presto' || loanData.type === 'app') ? 'egreso' : 'ingreso',
            amount: newAmount,
            concepto: `Préstamo editado: ${loanData.person}`,
            date: loanData.date
        });
        
        Object.assign(loan, loanData);
        
        saveDB(db);
        closeModal('loanModal');
        alert(`✅ Préstamo editado correctamente\n\nMonto anterior: $${oldAmount.toLocaleString()}\nMonto nuevo: $${newAmount.toLocaleString()}\nDiferencia: ${difference > 0 ? '+' : ''}$${difference.toLocaleString()}`);
        
    } else {
        if ((loanData.type === 'presto' || loanData.type === 'app') && acc.balance < loanData.amount) {
            alert(`❌ SALDO INSUFICIENTE EN ${acc.name}\n\nNecesitas: $${loanData.amount.toLocaleString()}\nDisponible: $${acc.balance.toLocaleString()}`);
            return;
        }
        
        if (loanData.type === 'presto' || loanData.type === 'app') {
            acc.balance -= loanData.amount;
            acc.movements.push({
                type: 'egreso',
                amount: loanData.amount,
                concepto: `Préstamo: ${loanData.type} a ${loanData.person}`,
                date: loanData.date
            });
        } else if (loanData.type === 'prestan') {
            acc.balance += loanData.amount;
            acc.movements.push({
                type: 'ingreso',
                amount: loanData.amount,
                concepto: `Préstamo recibido de ${loanData.person}`,
                date: loanData.date
            });
        }
        
        loanData.id = Date.now().toString();
        db.loans.push(loanData);
        
        saveDB(db);
        closeModal('loanModal');
        alert('✅ Préstamo registrado correctamente');
    }
}

function editLoan(loanId) {
    const db = getDB();
    const loan = db.loans.find(l => l.id === loanId);
    if (!loan || loan.status !== 'activo') {
        alert('❌ Préstamo no encontrado o no está activo');
        return;
    }
    openLoanModal(loanId);
}

function renderLoans() {
    const db = getDB();
    const list = document.getElementById('loansList');
    const active = db.loans.filter(l => l.status === 'activo');
    
    if (active.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay préstamos activos</p>';
        return;
    }
    
    list.innerHTML = active.map(loan => {
        const paidAmount = loan.paidAmount || 0;
        const remaining = loan.amount - paidAmount;
        const progressPercent = (paidAmount / loan.amount) * 100;
        
        return `
            <div class="list-item">
                <div style="flex:1;">
                    <strong>${loan.person}</strong><br>
                    <small style="color:#999;">${loan.type} | ${loan.account}</small>
                    ${loan.notes ? `<br><small>${loan.notes}</small>` : ''}
                    <div style="margin-top:10px;">
                        <div style="background:#e2e8f0;border-radius:8px;height:20px;overflow:hidden;">
                            <div style="background:var(--success);height:100%;width:${progressPercent}%;transition:width 0.3s;"></div>
                        </div>
                        <small style="color:#666;">Progreso: ${progressPercent.toFixed(1)}% | Pagado: $${paidAmount.toLocaleString()} | Pendiente: $${remaining.toLocaleString()}</small>
                    </div>
                </div>
                <div style="text-align:right;">
                    <p style="font-size:20px;font-weight:bold;">$${loan.amount.toLocaleString()}</p>
                    <button onclick="addLoanPayment('${loan.id}')" class="btn-success" style="margin-right:5px;">
                        💰 Abono
                    </button>
                    <button onclick="payLoan('${loan.id}')" class="btn-primary">
                        ✅ Pagar
                    </button>
                    <button onclick="cancelLoan('${loan.id}')" class="btn-danger">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}


function payLoan(loanId) {
    if (!confirm('¿Marcar como pagado?')) return;
    
    const db = getDB();
    const loan = db.loans.find(l => l.id === loanId);
    if (!loan || loan.status !== 'activo') return;
    
    loan.status = 'pagado';
    
    const acc = db.accounts.find(a => a.name === loan.account);
    if (acc) {
        if (loan.type === 'presto' || loan.type === 'app') {
            acc.balance += loan.amount;
            acc.movements.push({
                type: 'ingreso',
                amount: loan.amount,
                concepto: `Pago recibido de ${loan.person}`,
                date: new Date().toISOString()
            });
        } else if (loan.type === 'prestan') {
            acc.balance -= loan.amount;
            acc.movements.push({
                type: 'egreso',
                amount: loan.amount,
                concepto: `Pago realizado a ${loan.person}`,
                date: new Date().toISOString()
            });
        }
    }
    
    saveDB(db);
    alert('✅ Préstamo marcado como pagado');
}

function cancelLoan(loanId) {
    if (!confirm('¿Cancelar préstamo?')) return;
    
    const db = getDB();
    const loan = db.loans.find(l => l.id === loanId);
    if (!loan) return;
    
    loan.status = 'cancelado';
    saveDB(db);
    alert('✅ Préstamo cancelado');
}

// ===== PREVENTAS =====
function openPresaleModal() {
    const modal = document.getElementById('presaleModal');
    modal.style.display = 'block';
    document.getElementById('presaleForm').reset();
    
    const db = getDB();
    const productSelect = document.getElementById('presaleProductSelect');
    const customInput = document.getElementById('presaleProductCustom');
    const accountSelect = document.getElementById('presaleAccount');
    
    // Cargar productos
    productSelect.innerHTML = '<option value="">-- Seleccionar Producto del Inventario --</option>' +
        db.products.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`).join('');
    
    // Cargar cuentas
    accountSelect.innerHTML = db.settings.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    
    // UX para deshabilitar campos
    productSelect.onchange = function() {
        if (this.value) {
            customInput.disabled = true;
            customInput.placeholder = 'Deshabilitado: ya seleccionaste un producto';
        } else {
            customInput.disabled = false;
            customInput.placeholder = 'O escribe producto manualmente';
        }
    };
    
    customInput.oninput = function() {
        if (this.value.trim()) {
            productSelect.disabled = true;
        } else {
            productSelect.disabled = false;
        }
    };
}

document.getElementById('presaleForm').onsubmit = function(e) {
    e.preventDefault();
    const db = getDB();
    
    const productId = document.getElementById('presaleProductSelect').value;
    const productCustom = document.getElementById('presaleProductCustom').value.trim();
    
    if (!productId && !productCustom) {
        alert('❌ Debes seleccionar un producto del inventario O escribir uno manualmente');
        return;
    }
    
    const productName = productId ? db.products.find(p => p.id === productId)?.name : productCustom;
    const accountName = document.getElementById('presaleAccount').value;
    
    const presale = {
        id: Date.now().toString(),
        client: document.getElementById('presaleClient').value,
        product: productName,
        productId: productId || null,
        total: parseFloat(document.getElementById('presaleTotal').value) || 0,
        deposit: parseFloat(document.getElementById('presaleDeposit').value) || 0,
        balance: 0,
        deliveryDate: document.getElementById('presaleDeliveryDate').value,
        status: document.getElementById('presaleStatus').value,
        account: accountName,
        date: new Date().toISOString()
    };
    
    presale.balance = presale.total - presale.deposit;
    
    if (!presale.client || !presale.product || presale.total <= 0 || presale.deposit < 0) {
        alert('❌ Completa todos los campos correctamente');
        return;
    }
    
    if (presale.deposit > presale.total) {
        alert('❌ El abono no puede ser mayor al total');
        return;
    }
    
    if (productId) {
        const product = db.products.find(p => p.id === productId);
        if (product) {
            product.status = 'en_transito';
        }
    }
    
    db.presales.push(presale);
    
    // Agregar MOVIMIENTO a la cuenta seleccionada
    const acc = db.accounts.find(a => a.name === accountName);
    if (acc && presale.deposit > 0) {
        acc.balance += presale.deposit;
        acc.movements.push({
            type: 'ingreso',
            amount: presale.deposit,
            concepto: `Abono preventa: ${presale.client} - ${productName}`,
            date: presale.date
        });
    }
    
    saveDB(db);
    closeModal('presaleModal');
    alert('✅ Preventa registrada correctamente');
}

function renderPresales() {
    const db = getDB();
    const list = document.getElementById('presalesList');
    const pending = db.presales.filter(p => p.status !== 'entregada');
    
    if (pending.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay preventas activas</p>';
        return;
    }
    
    list.innerHTML = pending.map(p => `
        <div class="list-item">
            <div style="flex:1;">
                <strong>${p.client}</strong><br>
                <small style="color:#999;">Producto: ${p.product}</small><br>
                <small>Entrega: ${new Date(p.deliveryDate).toLocaleDateString()} | Estado: ${p.status.replace('_', ' ')} | Cuenta: ${p.account || 'No asignada'}</small>
            </div>
            <div style="text-align:right;">
                <p>Total: $${p.total.toLocaleString()}</p>
                <p>Abono: $${p.deposit.toLocaleString()}</p>
                <p style="font-weight:bold;color:var(--warning);">Pendiente: $${p.balance.toLocaleString()}</p>
                <button onclick="completePresale('${p.id}')" class="btn-success">✅ Completar</button>
            </div>
        </div>
    `).join('');
}

function completePresale(presaleId) {
    const db = getDB();
    const presale = db.presales.find(p => p.id === presaleId);
    
    if (!presale) {
        alert('❌ Preventa no encontrada');
        return;
    }
    
    const remaining = presale.total - presale.deposit;
    let paymentAccount = presale.account; // Por defecto la cuenta del abono inicial
    
    // Si hay restante por pagar, pedir cuenta destino
    if (remaining > 0) {
        const accountOptions = db.settings.accounts.map((a, idx) => `${idx + 1}. ${a}`).join('\n');
        const selected = prompt(
            `💰 PAGO DEL RESTANTE\n\n` +
            `Total preventa: $${presale.total.toLocaleString()}\n` +
            `Abono inicial: $${presale.deposit.toLocaleString()}\n` +
            `Restante a pagar: $${remaining.toLocaleString()}\n\n` +
            `Selecciona la cuenta para recibir el pago:\n${accountOptions}\n\n` +
            `Escribe el número de la cuenta:`, 
            '1'
        );
        
        if (!selected) return; // Canceló
        
        const accountIndex = parseInt(selected) - 1;
        if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= db.settings.accounts.length) {
            alert('❌ Opción inválida');
            return;
        }
        
        paymentAccount = db.settings.accounts[accountIndex];
        
        if (!confirm(`¿Confirmar recepción de $${remaining.toLocaleString()} en ${paymentAccount}?`)) {
            return;
        }
    }
    
    // Procesar el pago del restante si existe
    if (remaining > 0) {
        const acc = db.accounts.find(a => a.name === paymentAccount);
        if (acc) {
            acc.balance += remaining;
            acc.movements.push({
                type: 'ingreso',
                amount: remaining,
                concepto: `Pago restante preventa: ${presale.client} - ${presale.product}`,
                date: new Date().toISOString()
            });
        }
    }
    
    // Reducir stock si es producto de inventario
    if (presale.productId) {
        const product = db.products.find(p => p.id === presale.productId);
        if (product) {
            if (product.stock <= 0) {
                alert('❌ No hay stock disponible para entregar este producto');
                return;
            }
            product.stock -= 1;
            product.status = 'disponible';
            product.history.push({
                type: 'venta_preventa',
                quantity: 1,
                date: new Date().toISOString(),
                presaleId: presale.id
            });
        }
    }
    
    // Crear la venta en el historial para que aparezca en reportes
    const saleId = Date.now().toString();
    const sale = {
        id: saleId,
        items: [{
            id: presale.productId || 'custom_' + saleId,
            name: presale.product,
            quantity: 1,
            price: presale.total,
            cost: 0 // No tenemos costo real en preventa
        }],
        discountPercent: 0,
        discountFixed: 0,
        subtotal: presale.total,
        total: presale.total,
        account: paymentAccount,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        presaleId: presale.id,
        notes: `Preventa completada. Abono inicial: $${presale.deposit.toLocaleString()} en ${presale.account}`
    };
    
    db.sales.push(sale);
    presale.status = 'entregada';
    presale.completionDate = new Date().toISOString();
    presale.finalPaymentAccount = paymentAccount;
    presale.finalPaymentAmount = remaining;
    
    saveDB(db);
    
    // Generar recibo automáticamente
    generateReceipt(sale, true);
    
    alert(`✅ Preventa completada exitosamente\n\nTotal: $${presale.total.toLocaleString()}\nAbono: $${presale.deposit.toLocaleString()}\nRestante: $${remaining.toLocaleString()}\nCuenta: ${paymentAccount}`);
    renderPresales();
}


// ===== APARTADOS =====
function openReservationModal() {
    const modal = document.getElementById('reservationModal');
    modal.style.display = 'block';
    document.getElementById('reservationForm').reset();
    
const db = getDB();
const listDiv = document.getElementById('multiProductList');
// Limpiar lista anterior
listDiv.innerHTML = '';
// Rellenar con productos que tengan stock
listDiv.innerHTML = db.products
  .filter(p => p.stock > 0)
  .map(p => `
    <label class="checkbox-label" style="justify-content:space-between;">
      <span>${p.name} (Stock: ${p.stock})</span>
      <span style="display:flex;gap:8px;align-items:center;">
        Cant:
        <input type="number" min="1" max="${p.stock}" value="1"
               class="res-qty" data-pid="${p.id}" style="width:60px;">
      </span>
    </label>`).join('');

document.getElementById('reservationForm').onsubmit = function (e) {
  e.preventDefault();
  const db = getDB();
  const client = document.getElementById('reservationClient').value.trim();
  const days  = parseInt(document.getElementById('reservationDuration').value) || 7;
  const notes = document.getElementById('reservationNotes').value.trim();

  // Leer cantidades que el usuario puso
  const selected = [...document.querySelectorAll('.res-qty')]
    .filter(ip => parseInt(ip.value) > 0)
    .map(ip => ({ id: ip.dataset.pid, qty: parseInt(ip.value) }));

  if (!client || selected.length === 0) {
    alert('❌ Indica cliente y al menos un producto');
    return;
  }

  selected.forEach(({ id, qty }) => {
    const p = db.products.find(pr => pr.id === id);
    if (!p || qty > p.stock) return;
    p.stock -= qty;
    db.reservations.push({
      id: 'res_' + Date.now() + '_' + id,
      client,
      productId: id,
      productName: p.name,
      quantity: qty,
      duration: days,
      notes,
      date: new Date().toISOString(),
      status: 'apartado'
    });
  });

  saveDB(db);
  closeModal('reservationModal');
  alert('✅ Apartados registrados');
};    
    const productId = document.getElementById('reservationProductId').value;
    const product = db.products.find(p => p.id === productId);
    
    if (!product) {
        alert('❌ Producto no encontrado');
        return;
    }
    
    const quantity = parseInt(document.getElementById('reservationQuantity').value) || 0;
    
    if (quantity > product.stock) {
        alert(`❌ Cantidad excede el stock disponible (${product.stock})`);
        return;
    }
    
    const reservation = {
        id: Date.now().toString(),
        client: document.getElementById('reservationClient').value,
        productId: product.id,
        productName: product.name,
        quantity,
        duration: parseInt(document.getElementById('reservationDuration').value) || 7,
        notes: document.getElementById('reservationNotes').value,
        date: new Date().toISOString(),
        status: 'apartado'
    };
    
    if (!reservation.client || quantity <= 0) {
        alert('❌ Completa todos los campos');
        return;
    }
    
    product.stock -= quantity;
    
    db.reservations.push(reservation);
    saveDB(db);
    closeModal('reservationModal');
    alert('✅ Producto apartado correctamente');
}

function renderReservations() {
    const db = getDB();
    const list = document.getElementById('reservationsList');
    const active = db.reservations.filter(r => r.status === 'apartado');
    
    if (active.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay apartados activos</p>';
        return;
    }
    
    list.innerHTML = active.map(r => `
        <div class="list-item">
            <div style="flex:1;">
                <strong>${r.client}</strong><br>
                <small style="color:#999;">Producto: ${r.productName} | Cantidad: ${r.quantity}</small><br>
                <small>Días de apartado: ${r.duration} | Vence: ${new Date(new Date(r.date).getTime() + r.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}</small>
                ${r.notes ? `<br><small>${r.notes}</small>` : ''}
            </div>
            <div>
                <button onclick="cancelReservation('${r.id}')" class="btn-danger">Cancelar</button>
                <button onclick="completeReservation('${r.id}')" class="btn-success">Entregar</button>
            </div>
        </div>
    `).join('');
}

function cancelReservation(reservationId) {
    if (!confirm('¿Cancelar este apartado? Se devolverá el stock')) return;
    
    const db = getDB();
    const reservation = db.reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'apartado') return;
    
    const product = db.products.find(p => p.id === reservation.productId);
    if (product) {
        product.stock += reservation.quantity;
    }
    
    reservation.status = 'cancelado';
    saveDB(db);
    alert('✅ Apartado cancelado, stock devuelto');
}

function completeReservation(reservationId) {
    if (!confirm('¿Marcar este apartado como entregado?')) return;
    
    const db = getDB();
    const reservation = db.reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'apartado') return;
    
    reservation.status = 'entregado';
    saveDB(db);
    alert('✅ Apartado completado');
}

// ===== CONFIGURACIÓN =====
function addLanguage() {
    const lang = document.getElementById('newLanguage').value.toUpperCase().trim();
    if (!lang || lang.length !== 2) {
        alert('❌ Código inválido (ej: FR, DE, PT)');
        return;
    }
    
    const db = getDB();
    if (db.settings.languages.includes(lang)) {
        alert('❌ Este idioma ya existe');
        return;
    }
    
    db.settings.languages.push(lang);
    saveDB(db);
    document.getElementById('newLanguage').value = '';
    alert('✅ Idioma agregado');
}

function addCategory() {
    const cat = document.getElementById('newCategory').value.trim();
    if (!cat) return;
    
    const db = getDB();
    if (db.settings.categories.includes(cat)) {
        alert('❌ Categoría ya existe');
        return;
    }
    
    db.settings.categories.push(cat);
    saveDB(db);
    document.getElementById('newCategory').value = '';
    alert('✅ Categoría agregada');
}

function addProductType() {
    const type = document.getElementById('newProductType').value.trim();
    if (!type) return;
    
    const db = getDB();
    if (db.settings.productTypes.includes(type)) {
        alert('❌ Tipo ya existe');
        return;
    }
    
    db.settings.productTypes.push(type);
    saveDB(db);
    document.getElementById('newProductType').value = '';
    alert('✅ Tipo agregado');
}

function addAccount() {
    const acc = document.getElementById('newAccount').value.trim();
    if (!acc) return;
    
    const db = getDB();
    if (db.settings.accounts.includes(acc)) {
        alert('❌ Cuenta ya existe');
        return;
    }
    
    db.settings.accounts.push(acc);
    db.accounts.push({
        id: acc.toLowerCase().replace(/\s+/g, '_'),
        name: acc,
        balance: 0,
        movements: []
    });
    
    saveDB(db);
    document.getElementById('newAccount').value = '';
    alert('✅ Cuenta agregada');
}

function saveIVA() {
    const db = getDB();
    db.settings.iva = parseFloat(document.getElementById('ivaSetting').value) || 19;
    saveDB(db);
    alert('✅ IVA guardado correctamente');
}

function renderSettings() {
    const db = getDB();
    
    document.getElementById('languagesList').innerHTML = db.settings.languages.map(l => `
        <span class="tag">
            ${l}
            <span style="cursor:pointer;margin-left:8px;" onclick="deleteLanguage('${l}')">❌</span>
        </span>
    `).join('');
    
    document.getElementById('categoriesList').innerHTML = db.settings.categories.map(c => `
        <span class="tag">
            ${c}
            <span style="cursor:pointer;margin-left:8px;" onclick="deleteCategory('${c}')">❌</span>
        </span>
    `).join('');
    
    document.getElementById('productTypesList').innerHTML = db.settings.productTypes.map(t => `
        <span class="tag">
            ${t}
            <span style="cursor:pointer;margin-left:8px;" onclick="deleteProductType('${t}')">❌</span>
        </span>
    `).join('');
    
    document.getElementById('accountsSettingsList').innerHTML = db.settings.accounts.map(a => `
        <span class="tag">
            ${a}
            <span style="cursor:pointer;margin-left:8px;" onclick="deleteAccount('${a}')">❌</span>
        </span>
    `).join('');
    
    document.getElementById('ivaSetting').value = db.settings.iva;
}

function deleteLanguage(lang) {
    const db = getDB();
    const productsUsing = db.products.filter(p => p.language === lang);
    
    if (productsUsing.length > 0) {
        alert(`❌ No se puede eliminar "${lang}" porque ${productsUsing.length} producto(s) lo usan.`);
        return;
    }
    
    if (!confirm(`¿Eliminar el idioma "${lang}"?`)) return;
    
    db.settings.languages = db.settings.languages.filter(l => l !== lang);
    saveDB(db);
    alert('✅ Idioma eliminado');
}

function deleteCategory(category) {
    const db = getDB();
    const productsUsing = db.products.filter(p => p.category === category);
    
    if (productsUsing.length > 0) {
        alert(`❌ No se puede eliminar "${category}" porque ${productsUsing.length} producto(s) la usan.`);
        return;
    }
    
    if (!confirm(`¿Eliminar la categoría "${category}"?`)) return;
    
    db.settings.categories = db.settings.categories.filter(c => c !== category);
    saveDB(db);
    alert('✅ Categoría eliminada');
}

function deleteProductType(type) {
    const db = getDB();
    const productsUsing = db.products.filter(p => p.type === type);
    
    if (productsUsing.length > 0) {
        alert(`❌ No se puede eliminar "${type}" porque ${productsUsing.length} producto(s) lo usan.`);
        return;
    }
    
    if (!confirm(`¿Eliminar el tipo "${type}"?`)) return;
    
    db.settings.productTypes = db.settings.productTypes.filter(t => t !== type);
    saveDB(db);
    alert('✅ Tipo de producto eliminado');
}

function deleteAccount(accountName) {
    const db = getDB();
    
    const movementsUsing = db.transfers.filter(t => t.from === accountName || t.to === accountName)
        .concat(db.purchases.filter(p => p.account === accountName))
        .concat(db.expenses.filter(e => e.account === accountName))
        .concat(db.loans.filter(l => l.account === accountName));
    
    if (movementsUsing.length > 0) {
        alert(`❌ No se puede eliminar "${accountName}" porque ${movementsUsing.length} movimiento(s) la usan.`);
        return;
    }
    
    if (!confirm(`¿Eliminar la cuenta "${accountName}"?`)) return;
    
    db.settings.accounts = db.settings.accounts.filter(a => a !== accountName);
    db.accounts = db.accounts.filter(a => a.name !== accountName);
    saveDB(db);
    alert('✅ Cuenta eliminada');
}

// ===== REPORTES =====

function exportReport(format) {
    const db = getDB();
    const today = new Date().toLocaleDateString();
    
    // Obtener año y mes correctamente
    const year = parseInt(document.getElementById('reportYear').value) || new Date().getFullYear();
    const monthSelect = document.getElementById('reportMonth').value;
    const month = monthSelect === '' ? null : parseInt(monthSelect);

    if (format === 'pdf') {
        // Filtrar datos por período seleccionado
        const salesToday = db.sales.filter(s => new Date(s.date).toLocaleDateString() === today);
        const salesPeriod = db.sales.filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === year && (month === null || d.getMonth() === month);
        });

        const totalToday = salesToday.reduce((sum, s) => sum + s.total, 0);
        const totalPeriod = salesPeriod.reduce((sum, s) => sum + s.total, 0);
        const totalProductsSold = salesPeriod.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);
        
        const expensesPeriod = db.expenses.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && (month === null || d.getMonth() === month);
        }).reduce((sum, e) => sum + e.amount, 0);

        const purchasesPeriod = db.purchases.filter(p => {
            const d = new Date(p.date);
            return d.getFullYear() === year && (month === null || d.getMonth() === month);
        }).reduce((sum, p) => sum + p.total, 0);

        const netProfit = totalPeriod - expensesPeriod;

        // Generar HTML del reporte
        const periodText = month === null ? `Año ${year}` : `${getMonthName(month)} ${year}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reporte OPM - ${periodText}</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', system-ui, sans-serif; 
                        padding: 30px; 
                        background: #f8fafc; 
                        color: #1e293b;
                        line-height: 1.6;
                    }
                    .report-container {
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        max-width: 900px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #1e40af;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #1e40af;
                        font-size: 32px;
                        margin-bottom: 10px;
                    }
                    .date-info {
                        color: #64748b;
                        font-size: 16px;
                    }
                    .section {
                        margin: 30px 0;
                        padding: 25px;
                        background: #f8fafc;
                        border-radius: 12px;
                        border-left: 4px solid #1e40af;
                    }
                    .section h2 {
                        color: #1e40af;
                        margin-bottom: 15px;
                        font-size: 24px;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .stat-card {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        text-align: center;
                        border: 1px solid #e2e8f0;
                    }
                    .stat-card h3 {
                        font-size: 14px;
                        color: #64748b;
                        margin-bottom: 8px;
                    }
                    .stat-card p {
                        font-size: 24px;
                        font-weight: 800;
                        color: #1e40af;
                    }
                    .success { color: #059669 !important; }
                    .warning { color: #d97706 !important; }
                    .danger { color: #dc2626 !important; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    }
                    th {
                        background: #1e40af;
                        color: white;
                        padding: 12px 15px;
                        text-align: left;
                        font-weight: 600;
                    }
                    td {
                        padding: 12px 15px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    tr:hover { background: #f1f5f9; }
                    .print-btn {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        padding: 12px 24px;
                        background: #1e40af;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .print-btn:hover { transform: translateY(-2px); }
                    @media print {
                        body { background: white; }
                        .print-btn { display: none; }
                        .report-container { box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="header">
                        <h1>📈 Reporte General OPM</h1>
                        <div class="date-info">Período: ${periodText} | Generado el ${new Date().toLocaleString()}</div>
                    </div>
                    
                    <div class="section">
                        <h2>💰 Resumen Financiero</h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <h3>Ingresos del ${periodText}</h3>
                                <p class="success">$${totalPeriod.toLocaleString()}</p>
                            </div>
                            <div class="stat-card">
                                <h3>Gastos del ${periodText}</h3>
                                <p class="danger">$${expensesPeriod.toLocaleString()}</p>
                            </div>
                            <div class="stat-card">
                                <h3>Compras del ${periodText}</h3>
                                <p class="warning">$${purchasesPeriod.toLocaleString()}</p>
                            </div>
                            <div class="stat-card">
                                <h3>Beneficio Neto</h3>
                                <p class="${netProfit >= 0 ? 'success' : 'danger'}">$${netProfit.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>📊 Resumen Diario</h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <h3>Ventas Hoy</h3>
                                <p>$${totalToday.toLocaleString()}</p>
                            </div>
                            <div class="stat-card">
                                <h3>Transacciones Hoy</h3>
                                <p>${salesToday.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>📦 Inventario</h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <h3>Total Productos</h3>
                                <p>${db.products.length}</p>
                            </div>
                            <div class="stat-card">
                                <h3>Stock Bajo</h3>
                                <p class="warning">${db.products.filter(p => p.stock <= 2).length}</p>
                            </div>
                            <div class="stat-card">
                                <h3>Total Unidades Vendidas</h3>
                                <p>${totalProductsSold}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>💳 Últimas 5 Ventas</h2>
                        <table>
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Cuenta</th>
                                <th>Total</th>
                            </tr>
                            ${salesPeriod.slice(-5).reverse().map(s => `
                                <tr>
                                    <td>#${s.id}</td>
                                    <td>${new Date(s.date).toLocaleDateString()}</td>
                                    <td>${s.account}</td>
                                    <td>$${s.total.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    
                    <div class="section">
                        <h2>💸 Últimos 5 Gastos</h2>
                        <table>
                            <tr>
                                <th>Concepto</th>
                                <th>Categoría</th>
                                <th>Monto</th>
                            </tr>
                            ${db.expenses.slice(-5).reverse().map(e => `
                                <tr>
                                    <td>${e.concept}</td>
                                    <td>${e.category}</td>
                                    <td>$${e.amount.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                </div>
                <button onclick="window.print()" class="print-btn">🖨️ Imprimir / Guardar PDF</button>
            </body>
            </html>
        `;
        
        // Abrir en nueva ventana
        const reportWindow = window.open('', '_blank', 'width=1000,height=700');
        reportWindow.document.write(htmlContent);
        reportWindow.document.close();
        
    } else if (format === 'csv') {
        const csv = 'ID_Venta,Producto,Cantidad,Precio_Unit,Subtotal,Fecha\n' +
            db.sales.map(s => 
                s.items.map(i => `${s.id},"${i.name}",${i.quantity},${i.price},${i.quantity * i.price},${new Date(s.date).toLocaleString()}`).join('\n')
            ).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-opm-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
    }
}

// Función auxiliar para obtener nombre del mes
function getMonthName(monthIndex) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[monthIndex];
}

// ===== BACKUP =====
function createBackup() {
    const db = getDB();
    const backupStr = JSON.stringify(db, null, 2);
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-opm-${new Date().toISOString().slice(0,10)}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Backup creado y descargado');
}

function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!confirm('⚠️ ESTO REEMPLAZA TODOS LOS DATOS. ¿Estás COMPLETAMENTE seguro?')) return;
            
            saveDB(data);
            alert('✅ Restauración completada. Recargando...');
            location.reload();
        } catch (err) {
            alert('❌ Archivo inválido o corrupto: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ===== EMERGENCIA =====
function emergencyDelete() {
    const c1 = confirm('🚨🚨🚨 ¡ADVERTENCIA FINAL! 🚨🚨🚨\n\nESTO BORRARÁ TODO:\n- Productos\n- Ventas\n- Compras\n- Gastos\n- Cuentas\n- Préstamos\n- Preventas\n- Apartados\n- Configuración\n\n¿Continuar?');
    if (!c1) return;

    const c2 = prompt('Escribe EXACTAMENTE: BORRAR TODO\n\n(O cancela escribiendo otra cosa)');
    if (c2 !== 'BORRAR TODO') {
        alert('❌ Texto incorrecto. Operación CANCELADA.');
        return;
    }

    const newCash = prompt('💰 Ingresa el saldo inicial de EFECTIVO para el nuevo inventario\n\nEjemplo: 250000', '0');
    const cashAmount = parseFloat(newCash) || 0;

    const c3 = confirm(`ÚLTIMA CONFIRMACIÓN:\n\nNuevo saldo en efectivo: $${cashAmount.toLocaleString()}\n\n¿Estás seguro de BORRAR TODA LA INFORMACIÓN PERMANENTEMENTE?`);
    if (!c3) return;

    const newDB = getDefaultDB(cashAmount);
    saveDB(newDB);
    
    alert(`💥 BASE DE DATOS COMPLETAMENTE ELIMINADA\n✅ Nuevo saldo: $${cashAmount.toLocaleString()}\n\nLa app se reiniciará en 3 segundos...`);
    setTimeout(() => location.reload(), 3000);
}

// ===== GRÁFICAS =====
function updateCharts() {
    const db = getDB();
    
    // ✅ CORREGIDO: Toda la lógica está DENTRO de la función
    // Productos más vendidos
    const productSales = {};
    db.sales.forEach(sale => {
        sale.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
    });
    
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const ctx1 = document.getElementById('topProductsChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: topProducts.map(p => p[0]),
                datasets: [{
                    label: 'Unidades vendidas',
                    data: topProducts.map(p => p[1]),
                    backgroundColor: 'rgba(30, 64, 175, 0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    // Ingresos del mes
    const monthlyData = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    db.sales.forEach(sale => {
        const date = new Date(sale.date);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const day = date.getDate();
            monthlyData[day] = (monthlyData[day] || 0) + sale.total;
        }
    });
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const labels = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const data = labels.map(day => monthlyData[day] || 0);
    
    const ctx2 = document.getElementById('monthlyRevenueChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ingresos diarios',
                    data: data,
                    borderColor: 'rgba(5, 150, 105, 1)',
                    backgroundColor: 'rgba(5, 150, 105, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
    
    // ✅ NUEVA GRÁFICA: Distribución por Categoría
    const categoryData = {};
    // Contar productos por categoría
    db.products.forEach(product => {
        categoryData[product.category] = (categoryData[product.category] || 0) + 1;
    });
    
    // Ordenar y preparar datos
    const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    
    const ctx3 = document.getElementById('categoryChart');
    if (ctx3) {
        new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: sortedCategories.map(c => c[0]),
                datasets: [{
                    label: 'Productos por categoría',
                    data: sortedCategories.map(c => c[1]),
                    backgroundColor: [
                        'rgba(30, 64, 175, 0.8)',
                        'rgba(5, 150, 105, 0.8)',
                        'rgba(217, 119, 6, 0.8)',
                        'rgba(220, 38, 38, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(45, 212, 191, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                label += context.parsed + ' producto(s)';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ===== EXPORTAR INVENTARIO =====
function exportInventory() {
    const db = getDB();
    
    const language = document.getElementById('inventoryLanguageFilter').value;
    const category = document.getElementById('inventoryCategoryFilter').value;
    const type = document.getElementById('productFilter').value;
    
    let filtered = db.products;
    if (language) filtered = filtered.filter(p => p.language === language);
    if (category) filtered = filtered.filter(p => p.category === category);
    if (type) filtered = filtered.filter(p => p.type === type);
    
    if (filtered.length === 0) {
        alert('❌ No hay productos para exportar con los filtros actuales');
        return;
    }
    
    const csv = [
        'SKU,Nombre,Idioma,Categoria,Tipo,Stock,Costo,Precio,Ganancia,Margen%',
        ...filtered.map(p => {
            const profit = p.price - p.cost;
            const margin = ((profit / p.cost) * 100).toFixed(2);
            return `"${p.sku}","${p.name}","${p.language}","${p.category}","${p.type}",${p.stock},${p.cost},${p.price},${profit},${margin}`;
        })
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-${new Date().toISOString().slice(0,10)}-(${language || 'All'}-${category || 'All'}-${type || 'All'}).csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Inventario exportado: ${filtered.length} productos`);
}

// ===== FORMATO DE NÚMEROS =====
function formatNumber(num) {
    if (isNaN(num) || !isFinite(num)) return '0';
    if (Number.isInteger(num)) {
        return num.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    }
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ===== CALCULAR IVA =====
function calculatePriceWithIVA() {
    const db = getDB();
    const cost = parseFloat(document.getElementById('productCost').value) || 0;
    const applyIVA = document.getElementById('productIVA').checked;
    const priceInput = document.getElementById('productPrice');
    
    if (applyIVA && cost > 0) {
        const costWithIVA = cost * (1 + db.settings.iva / 100);
        priceInput.value = costWithIVA.toFixed(2);
    }
}

// ===== ACTUALIZAR UI COMPLETA =====

function updateAllUI() {
    const db = getDB();
    
    const totalBalance = db.accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalInvested = db.purchases.reduce((sum, p) => sum + (p.total || 0), 0) + 
                         db.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = db.sales
        .filter(s => new Date(s.date).getMonth() === currentMonth && new Date(s.date).getFullYear() === currentYear)
        .reduce((sum, s) => sum + s.total, 0);
    
    const costOfSales = db.sales
        .filter(s => new Date(s.date).getMonth() === currentMonth && new Date(s.date).getFullYear() === currentYear)
        .reduce((sum, s) => sum + s.items.reduce((itemSum, i) => itemSum + (i.cost * i.quantity), 0), 0);

    const totalExpenses = db.expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, e) => sum + e.amount, 0);

    const netProfit = monthlyRevenue - costOfSales - totalExpenses;
    const projectedProfit = db.products.reduce((sum, p) => {
        const totalCost = p.stock * (p.cost + (p.applyIVA ? p.cost * (db.settings.iva / 100) : 0));
        const totalRevenue = p.stock * p.price;
        return sum + (totalRevenue - totalCost);
    }, 0);

    // ACTUALIZAR ESTADÍSTICAS
    document.getElementById('totalBalance').textContent = '$' + totalBalance.toFixed(2) + ' COP';
    document.getElementById('totalInvested').textContent = '$' + totalInvested.toLocaleString() + ' COP';
    document.getElementById('monthlyRevenue').textContent = '$' + monthlyRevenue.toFixed(2) + ' COP';
    document.getElementById('netProfit').textContent = '$' + netProfit.toFixed(2) + ' COP';
    document.getElementById('lowStockCount').textContent = db.products.filter(p => p.stock <= 2).length;
    document.getElementById('projectedProfit').textContent = '$' + projectedProfit.toFixed(2) + ' COP';
    document.getElementById('activeProducts').textContent = db.products.filter(p => p.stock > 0 && p.status === 'disponible').length;

    // ✅ CORREGIDO: En lugar de renderizar todos los productos, aplicamos los filtros actuales
    filterInventory(); // Esto respetará el estado del checkbox y otros filtros
    
    renderAccounts();
    renderLoans();
    renderPresales();
    renderReservations();
    renderPurchases();
    renderTransfers();
    renderSettings();
    
    setTimeout(() => updateCharts(), 100);
}
// ===== CERRAR MODALES =====
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    
    // Limpiar fecha personalizada al cerrar modal
    document.getElementById('customDateCheckbox').checked = false;
    document.getElementById('customSaleDate').value = '';
    document.getElementById('customDateContainer').style.display = 'none';
}



// ===== TOGGLE TEMA =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// ===== HISTORIAL DE VENTAS =====
function renderSalesHistory() {
    const db = getDB();
    const list = document.getElementById('salesHistoryList');
    const accountFilter = document.getElementById('salesHistoryAccountFilter');
    
    // Cargar cuentas en el filtro
    accountFilter.innerHTML = '<option value="">Todas las cuentas</option>' +
        db.settings.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    
    // Ordenar ventas por fecha (más recientes primero)
    const sortedSales = [...db.sales].sort((a, b) => b.timestamp - a.timestamp);
    
    if (sortedSales.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay ventas registradas</p>';
        return;
    }
    
    list.innerHTML = sortedSales.map(sale => `
        <div class="list-item">
            <div style="flex:1;">
                <strong>Venta #${sale.id}</strong>
                <span style="color:#666;font-size:12px;margin-left:10px;">(${sale.account})</span>
                <br>
                <small>📅 ${new Date(sale.date).toLocaleString()} | 🛒 ${sale.items.length} producto(s)</small>
                <br>
                <small>💳 Cuenta: ${sale.account}</small>
                ${sale.discountPercent > 0 ? `<br><small>🏷️ Descuento: ${sale.discountPercent}%</small>` : ''}
                ${sale.discountFixed > 0 ? `<br><small>💰 Descuento fijo: $${sale.discountFixed.toLocaleString()}</small>` : ''}
            </div>
            <div style="text-align:right;">
                <p style="font-size:20px;font-weight:bold;color:var(--success);">
                    $${sale.total.toLocaleString()}
                </p>
                <button onclick="viewReceipt('${sale.id}')" class="btn-primary" style="margin-right:5px;">
                    🧾 Ver Recibo
                </button>
                <button onclick="reprintReceipt('${sale.id}')" class="btn-warning">
                    🖨️ Reimprimir
                </button>
            </div>
            <div style="margin-top:10px;width:100%;">
                <details style="background:#f8f9fa;padding:10px;border-radius:8px;">
                    <summary style="cursor:pointer;color:var(--primary);font-weight:bold;">
                        📦 Ver productos (${sale.items.reduce((sum,i) => sum + i.quantity, 0)} unidades)
                    </summary>
                    <div style="margin-top:10px;">
                        ${sale.items.map(item => `
                            <div style="padding:5px 0;border-bottom:1px solid #eee;">
                                <span style="font-weight:bold;">${item.name}</span> 
                                <span style="color:#666;">(x${item.quantity})</span>
                                <span style="float:right;">$${(item.price * item.quantity).toLocaleString()}</span>
                                <div style="font-size:12px;color:#999;">Costo: $${item.cost.toLocaleString()} c/u</div>
                            </div>
                        `).join('')}
                    </div>
                </details>
            </div>
        </div>
    `).join('');
}

function filterSalesHistory() {
    const db = getDB();
    const date = document.getElementById('salesHistoryDateFilter').value;
    const account = document.getElementById('salesHistoryAccountFilter').value;
    
    let filtered = [...db.sales];
    
    if (date) {
        const filterDate = new Date(date).toLocaleDateString();
        filtered = filtered.filter(s => new Date(s.date).toLocaleDateString() === filterDate);
    }
    
    if (account) {
        filtered = filtered.filter(s => s.account === account);
    }
    
    // Ordenar por fecha
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    const list = document.getElementById('salesHistoryList');
    if (filtered.length === 0) {
        list.innerHTML = '<p style="padding:20px;text-align:center;color:#999;">No hay ventas con estos filtros</p>';
        return;
    }
    
    list.innerHTML = filtered.map(sale => `
        <div class="list-item">
            <div style="flex:1;">
                <strong>Venta #${sale.id}</strong>
                <span style="color:#666;font-size:12px;margin-left:10px;">(${sale.account})</span>
                <br>
                <small>📅 ${new Date(sale.date).toLocaleString()} | 🛒 ${sale.items.length} producto(s)</small>
            </div>
            <div style="text-align:right;">
                <p style="font-size:20px;font-weight:bold;color:var(--success);">
                    $${sale.total.toLocaleString()}
                </p>
                <button onclick="viewReceipt('${sale.id}')" class="btn-primary">
                    🧾 Ver Recibo
                </button>
            </div>
        </div>
    `).join('');
}

function viewReceipt(saleId) {
    const db = getDB();
    const sale = db.sales.find(s => s.id === saleId);
    
    if (!sale) {
        alert('❌ Venta no encontrada');
        return;
    }
    
    generateReceipt(sale, false);
}

function reprintReceipt(saleId) {
    const db = getDB();
    const sale = db.sales.find(s => s.id === saleId);
    
    if (!sale) {
        alert('❌ Venta no encontrada');
        return;
    }
    
    generateReceipt(sale, true);
}

function exportSalesHistory() {
    const db = getDB();
    const sortedSales = [...db.sales].sort((a, b) => b.timestamp - a.timestamp);
    
    if (sortedSales.length === 0) {
        alert('❌ No hay ventas para exportar');
        return;
    }
    
    const csv = [
        'ID_Venta,Fecha,Cuenta,Subtotal,Descuento_Porc,Descuento_Fijo,Total,Cantidad_Productos',
        ...sortedSales.map(s => [
            s.id,
            new Date(s.date).toLocaleString(),
            s.account,
            s.subtotal,
            s.discountPercent || 0,
            s.discountFixed || 0,
            s.total,
            s.items.reduce((sum,i) => sum + i.quantity, 0)
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-ventas-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Historial exportado: ${sortedSales.length} ventas`);
}

// ===== ANTES DE LA FUNCIÓN showView() =====
// Agrega estas funciones en este orden exacto:

function updateReportMonth() {
    const now = new Date();
    const monthSelect = document.getElementById('reportMonth');
    const yearInput = document.getElementById('reportYear');
    
    // Si no hay mes seleccionado, usa el mes actual
    if (!monthSelect.value) {
        monthSelect.value = now.getMonth();
        yearInput.value = now.getFullYear();
    }
}

// ✅ NUEVA FUNCIÓN - Agregarla AQUÍ
function fillReportYearSelector() {
    const yearSelect = document.getElementById('reportYear');
    const currentYear = new Date().getFullYear();
    
    // Generar opciones de años (5 años atrás y 1 adelante)
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        years.push(i);
    }
    
    yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    yearSelect.value = currentYear; // Seleccionar año actual por defecto
}

// ===== LUEGO MODIFICA LA FUNCIÓN showView() EXISTENTE =====
function showView(viewName) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(viewName).classList.add('active');
    
    // ✅ Actualizar vistas específicas cuando se muestran
    if (viewName === 'salesHistory') {
        renderSalesHistory();
    }
    
    // ✅ INICIALIZAR SELECTOR DE AÑO EN REPORTES
    if (viewName === 'reports') {
        fillReportYearSelector();  // ✅ LLAMAR LA NUEVA FUNCIÓN
        updateReportMonth();
    }
    
    updateAllUI();
}


// Función para mostrar/ocultar selector de fecha personalizada
function toggleCustomDate() {
    const checkbox = document.getElementById('customDateCheckbox');
    const container = document.getElementById('customDateContainer');
    const dateInput = document.getElementById('customSaleDate');
    
    if (checkbox.checked) {
        container.style.display = 'block';
        // Establecer fecha máxima como hoy
        const today = new Date().toISOString().split('T')[0];
        dateInput.max = today;
        // Si no hay valor, establecer fecha de ayer por defecto
        if (!dateInput.value) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            dateInput.value = yesterday.toISOString().split('T')[0];
        }
    } else {
        container.style.display = 'none';
        dateInput.value = '';
    }
}


// ===== SISTEMA DE ABONOS PARA PRÉSTAMOS =====

function addLoanPayment(loanId) {
    const db = getDB();
    const loan = db.loans.find(l => l.id === loanId);
    
    if (!loan || loan.status !== 'activo') {
        alert('❌ Préstamo no encontrado o no está activo');
        return;
    }
    
    const remaining = loan.amount - (loan.paidAmount || 0);
    
    if (remaining <= 0) {
        alert('✅ Este préstamo ya está completamente pagado');
        return;
    }
    
    // Pedir monto del abono
    const paymentAmount = parseFloat(prompt(`💰 ABONO A PRÉSTAMO\n\nPersona: ${loan.person}\nMonto total: $${loan.amount.toLocaleString()}\nPendiente: $${remaining.toLocaleString()}\n\n¿Cuánto deseas abonar?`, remaining));
    
    if (!paymentAmount || paymentAmount <= 0) {
        alert('❌ Monto inválido');
        return;
    }
    
    if (paymentAmount > remaining) {
        alert('❌ El abono no puede ser mayor al pendiente');
        return;
    }
    
    // Seleccionar cuenta
    const accountName = prompt(`Selecciona la cuenta para el abono:\n${db.settings.accounts.map(a => `- ${a}`).join('\n')}\n\nEscribe el nombre de la cuenta:`, loan.account);
    
    if (!accountName || !db.settings.accounts.includes(accountName)) {
        alert('❌ Cuenta no válida');
        return;
    }
    
    const acc = db.accounts.find(a => a.name === accountName);
    if (!acc || acc.balance < paymentAmount) {
        alert(`❌ SALDO INSUFICIENTE EN ${accountName}\n\nNecesitas: $${paymentAmount.toLocaleString()}\nDisponible: $${acc?.balance.toLocaleString() || 0}`);
        return;
    }
    
    if (!confirm(`¿Confirmar abono de $${paymentAmount.toLocaleString()} al préstamo de ${loan.person}?`)) return;
    
    // Procesar el abono
    acc.balance -= paymentAmount;
    acc.movements.push({
        type: 'egreso',
        amount: paymentAmount,
        concepto: `Abono préstamo: ${loan.person}`,
        date: new Date().toISOString()
    });
    
    // Actualizar préstamo
    loan.paidAmount = (loan.paidAmount || 0) + paymentAmount;
    loan.lastPaymentDate = new Date().toISOString();
    
    // Si se pagó completamente
    if (loan.paidAmount >= loan.amount) {
        loan.status = 'pagado';
        loan.paymentDate = new Date().toISOString();
        alert(`✅ ¡PRÉSTAMO COMPLETAMENTE PAGADO!\n\nTotal pagado: $${loan.paidAmount.toLocaleString()}`);
    } else {
        const remainingAfter = loan.amount - loan.paidAmount;
        alert(`✅ Abono registrado exitosamente\n\nAbono: $${paymentAmount.toLocaleString()}\nPagado total: $${loan.paidAmount.toLocaleString()}\nPendiente: $${remainingAfter.toLocaleString()}`);
    }
    
    // Agregar registro de abono
    if (!loan.payments) loan.payments = [];
    loan.payments.push({
        id: Date.now().toString(),
        amount: paymentAmount,
        date: new Date().toISOString(),
        account: accountName
    });
    
    saveDB(db);
    renderLoans();
}

// ===== FUNCIÓN CORREGIDA PARA PAGAR PRÉSTAMO =====
function payLoan(loanId) {
    const db = getDB();
    const loan = db.loans.find(l => l.id === loanId);
    
    if (!loan || loan.status !== 'activo') {
        alert('❌ Préstamo no encontrado o no está activo');
        return;
    }
    
    const remaining = loan.amount - (loan.paidAmount || 0);
    
    if (remaining <= 0) {
        alert('✅ Este préstamo ya está completamente pagado');
        return;
    }
    
    // Opciones para el usuario
    const option = confirm(`¿Cómo deseas pagar el préstamo de ${loan.person}?\n\nMonto total: $${loan.amount.toLocaleString()}\nPendiente: $${remaining.toLocaleString()}\n\n🔸 Aceptar = Pagar completo ahora\n🔸 Cancelar = Solo abono parcial`);
    
    if (option) {
        // PAGO COMPLETO
        const acc = db.accounts.find(a => a.name === loan.account);
        if (!acc || acc.balance < remaining) {
            alert(`❌ SALDO INSUFICIENTE EN ${loan.account}\n\nNecesitas: $${remaining.toLocaleString()}\nDisponible: $${acc?.balance.toLocaleString() || 0}`);
            return;
        }
        
        if (!confirm(`¿Confirmar pago COMPLETO de $${remaining.toLocaleString()}?`)) return;
        
        // Procesar pago completo
        acc.balance -= remaining;
        acc.movements.push({
            type: 'egreso',
            amount: remaining,
            concepto: `Pago completo préstamo: ${loan.person}`,
            date: new Date().toISOString()
        });
        
        loan.paidAmount = loan.amount;
        loan.status = 'pagado';
        loan.paymentDate = new Date().toISOString();
        loan.lastPaymentDate = new Date().toISOString();
        
        // Agregar registro de pago
        if (!loan.payments) loan.payments = [];
        loan.payments.push({
            id: Date.now().toString(),
            amount: remaining,
            date: new Date().toISOString(),
            account: loan.account,
            type: 'pago_completo'
        });
        
        saveDB(db);
        alert(`✅ ¡PRÉSTAMO COMPLETAMENTE PAGADO!\n\nTotal: $${loan.amount.toLocaleString()}`);
        renderLoans();
    } else {
        // ABONO PARCIAL
        addLoanPayment(loanId);
    }
}

function addPurchaseImageFromURL() {
  const url = document.getElementById('purchaseImageURL').value.trim();
  if (!url) return;
  const img = new Image();
  img.onload = () => {
    window.purchaseImages.push(url);
    document.getElementById('purchaseImages').innerHTML +=
      `<div><img src="${url}" width="100" style="border-radius:8px;margin-right:10px;"></div>`;
    document.getElementById('purchaseImageURL').value = '';
  };
  img.onerror = () => alert('❌ URL inválida');
  img.src = url;
}

function addPurchaseImageFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      window.purchaseImages.push(ev.target.result);
      document.getElementById('purchaseImages').innerHTML +=
        `<div><img src="${ev.target.result}" width="100" style="border-radius:8px;margin-right:10px;"></div>`;
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function fillReportDatePickers() {
    const db = getDB();

    // Obtener todas las fechas de ventas, compras y gastos
    const dates = [
        ...db.sales.map(s => new Date(s.date)),
        ...db.purchases.map(p => new Date(p.date)),
        ...db.expenses.map(e => new Date(e.date))
    ];

    // Obtener años únicos con datos
    const years = [...new Set(dates.map(d => d.getFullYear()))].sort((a, b) => b - a);

    // Obtener meses únicos con datos (0 = enero, 11 = diciembre)
    const months = [...new Set(dates.map(d => d.getMonth()))].sort((a, b) => a - b);

    // Llenar selector de años
    const yearInput = document.getElementById('reportYear');
    yearInput.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');

    // Si hay años, seleccionar el actual por defecto
    if (years.length > 0) {
        yearInput.value = new Date().getFullYear();
    }

    // Llenar selector de meses
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    document.getElementById('reportMonth').innerHTML =
        '<option value="">Mes actual</option>' +
        months.map(m => `<option value="${m}">${monthNames[m]}</option>`).join('');
}

// ===== INGRESO OCASIONAL =====
function openOccasionalIncomeModal() {
    const modal = document.getElementById('occasionalIncomeModal');
    modal.style.display = 'block';
    document.getElementById('occasionalIncomeForm').reset();

    const db = getDB();
    const accountSelect = document.getElementById('occasionalAccount');
    
    // Cargar todas las cuentas disponibles
    accountSelect.innerHTML = '<option value="">-- Seleccionar Cuenta --</option>' +
        db.settings.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
    
    console.log('✅ Modal de ingreso ocasional abierto');
    console.log('📊 Cuentas disponibles:', db.settings.accounts);
}

// CORREGIR LA FUNCIÓN DE SUBMIT - estaba mal implementada
document.getElementById('occasionalIncomeForm').onsubmit = function (e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('occasionalAmount').value) || 0;
    const concept = document.getElementById('occasionalConcept').value.trim();
    const accountName = document.getElementById('occasionalAccount').value;
    const notes = document.getElementById('occasionalNotes').value.trim();

    if (!concept || amount <= 0 || !accountName) {
        alert('❌ Completa todos los campos requeridos:\n- Monto debe ser mayor a 0\n- Concepto es obligatorio\n- Debes seleccionar una cuenta');
        return;
    }

    const db = getDB();
    const acc = db.accounts.find(a => a.name === accountName);
    
    if (!acc) {
        alert('❌ Cuenta no encontrada en el sistema');
        return;
    }

    // ✅ PROCESAR EL INGRESO
    acc.balance += amount;
    
    // Agregar movimiento a la cuenta
    const movement = {
        type: 'ingreso',
        amount: amount,
        concepto: `Ingreso ocasional: ${concept}` + (notes ? ` - ${notes}` : ''),
        date: new Date().toISOString()
    };
    
    acc.movements.push(movement);
    
    // Guardar cambios
    saveDB(db);
    
    // Actualizar interfaz
    renderAccounts();
    
    // Cerrar modal
    closeModal('occasionalIncomeModal');
    
    // ✅ CONFIRMACIÓN VISUAL
    alert(`✅ Ingreso registrado exitosamente!\n\n💰 Monto: $${amount.toLocaleString()}\n🏦 Cuenta: ${accountName}\n📊 Nuevo balance: $${acc.balance.toLocaleString()}`);
    
    console.log('✅ Ingreso ocasional procesado:', {
        cuenta: accountName,
        monto: amount,
        concepto: concept,
        nuevo_balance: acc.balance
    });
};
