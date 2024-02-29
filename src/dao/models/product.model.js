import mongoose from "mongoose"

const productsCollection = 'products'

const productsSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    thumbnails: [],
    status: {
        type: Boolean,
        default: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    stock: {
        type: Number,
        required: true

    },
    category: {
        type: String,
        required: true
    }
})

export const productModel = mongoose.model(productsCollection, productsSchema)
