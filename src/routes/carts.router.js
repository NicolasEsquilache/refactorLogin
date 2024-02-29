import { Router } from 'express';
import { cartModel } from '../dao/models/cart.model.js';
import { productModel } from '../dao/models/product.model.js';

const cartsRouter = Router();

cartsRouter.post('/api/carts', async (req, res) => {
    try {
        const cart = await cartModel.create({ products: [] });
        res.status(201).send({ result: 'Success', message: cart });
    } catch (error) {
        res.status(400).send({ result: 'Error', message: error.message });
    }
});

cartsRouter.get('/api/carts/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
        const cart = await cartModel.findById(cid);
        if (!cart) {
            return res.status(404).send({ result: 'Error', message: 'Cart not found' });
        }
        res.status(200).send({ result: 'Success', message: cart });
    } catch (error) {
        res.status(400).send({ result: 'Error', message: error.message });
    }
});

cartsRouter.post('/api/carts/:cid/product/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body;
    try {
        const cart = await cartModel.findById(cid);
        const product = await productModel.findById(pid);

        if (!cart) return res.status(404).send({ result: 'Error', message: 'Cart not found' });
        if (!product) return res.status(404).send({ result: 'Error', message: 'Product not found' });

        const existingProductIndex = cart.products.findIndex(prod => prod.product.toString() === pid);
        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += quantity;
        } else {
            cart.products.push({ product: pid, quantity });
        }
        await cart.save();
        res.status(200).send({ result: 'Success', message: 'Product added to cart' });
    } catch (error) {
        res.status(400).send({ result: 'Error', message: error.message });
    }
});

export default cartsRouter;
