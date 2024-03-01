import { Router } from "express";
import productModel from "../dao/models/product.model.js";

const productsRouter = Router();

// Render on front with handlebars with IO
productsRouter.get('/', async (req, res) => {
    try {
        const allProducts = await productModel.find({}, { _id: 0, __v: 0 }).lean();
        res.render('home', {
            style: '/css/styles.css',
            title: "All Products",
            allProducts
        });
    } catch (error) {
        res.status(500).send('Internal server Error', error);
    }
});

// Render products in real time with ws
productsRouter.get('/realtimeproducts', async (req, res) => {
    res.render('realTimeProducts', { style: '/css/styles.css' });
});

// Get all products or with limit
productsRouter.get('/api/products', async (req, res) => {
    const { limit = 3, page = 1, category, availability, sort } = req.query;
    try {
        const options = {
            limit: parseInt(limit),
            page: parseInt(page),
            lean: true
        };
        
        // Construir objeto de filtro basado en la categoría y disponibilidad
        const filter = {};
        if (category) {
            filter.category = category;
        }
        if (availability) {
            filter.stock = availability === 'available' ? { $gt: 0 } : { $eq: 0 };
        }

        // Construir objeto de opciones de ordenamiento
        const sortOptions = {};
        if (sort === '1' || sort === '-1') {
            sortOptions.price = parseInt(sort); // Ordenar por precio ascendente (1) o descendente (-1)
        }

        // Realizar la consulta a la base de datos con las opciones configuradas
        const products = await productModel.paginate(filter, { ...options, sort: sortOptions });
        
        // Generar enlaces de paginación
        const prevLink = products.hasPrevPage ? `/api/products?page=${products.prevPage}` : null;
        const nextLink = products.hasNextPage ? `/api/products?page=${products.nextPage}` : null;
        const response = {
            status: 'success',
            payload: products.docs,
            totalPages: products.totalPages,
            prevPage: products.prevPage,
            nextPage: products.nextPage,
            page: products.page,
            hasPrevPage: products.hasPrevPage,
            hasNextPage: products.hasNextPage,
            prevLink: prevLink,
            nextLink: nextLink
        };

        res.status(200).send(response);
    } catch (error) {
        res.status(400).send({ status: 'error', payload: [], message: error.message });
    }
});



// See product by ID
productsRouter.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await productModel.findById(id);
        if (!product) return res.status(404).send('Product not found');
        res.status(200).send({ result: 'Success', message: product });
    } catch (error) {
        res.status(404).send({ result: 'Error', message: 'Not found' });
    }
});

// Add new product
productsRouter.post('/api/products', async (req, res) => {
    const { title, description, price, thumbnails, code, stock, category } = req.body;
    try {
        const prod = await productModel.create({ title, description, price, thumbnails, code, stock, category });
        res.status(201).send({ result: "Success", message: prod });
    } catch (error) {
        res.status(400).send({ result: 'Error create product', message: error.message });
    }
});

// Update product
productsRouter.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, price, thumbnails, code, stock, status, category } = req.body;
    try {
        const product = await productModel.findByIdAndUpdate(id, { title, description, price, thumbnails, code, stock, status, category });
        if (!product) return res.status(404).send({ result: 'Error', message: 'Product not found' });
        res.status(200).send({ result: 'Success', message: 'Product updated' });
    } catch (error) {
        res.status(400).send({ result: 'Error updating product', message: error });
    }
});

// Delete product
productsRouter.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await productModel.findByIdAndDelete(id);
        if (!product) return res.status(404).send({ result: 'Error', message: 'Product not found' });
        res.status(200).send({ result: 'Success', message: 'Product deleted', product });
    } catch (error) {
        res.status(400).send({ result: 'Error deleting product', message: error });
    }
});

export default productsRouter;
