import express from 'express'
import __dirname from './utils.js'
import handlebars from 'express-handlebars'
import { Server } from 'socket.io'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'
import ProductManager from './class/ProductManager.js'
import chatRouter from './routes/chat.router.js'
import { chatModel } from './dao/models/chat.model.js'
import { productModel } from './dao/models/product.model.js'
import mongoose from 'mongoose'

/* const productManager = new ProductManager('./src/data/products.json') */

const port = 8080
const app = express()
const httpServer = app.listen(port, () => console.log(`Server online - PORT ${port}`))

//Socket server
const io = new Server(httpServer)

//Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Templates
app.engine('handlebars', handlebars.engine())
app.set('views', __dirname + '/views')
app.set('view engine', 'handlebars')
app.use(express.static(__dirname + '/public'))

//Routes
app.use('/', productsRouter)
app.use('/', cartsRouter)
app.use('/', chatRouter)

//Connection DB
mongoose.connect('mongodb+srv://nicolasesquilache:coderhouse@cluster0.f2gsvyw.mongodb.net/ecommerce?retryWrites=true&w=majority')
    .then(() => {
        console.log('Connected to the database')
    })
    .catch(() => {
        console.log('Error connecting to database')
    })

//Connection WS
io.on('connection', (socket) => {
    console.log('User Connected')

    socket.on('message', async (data) => {
        try {
            //Save the message in the database
            await chatModel.create({ email: data.email, message: data.message })
            const messages = await chatModel.find()
            //Broadcast the message to all connecting clients
            io.emit('messageLogs', messages)
        } catch (error) {
            console.error('Error writing database')
        }
    })

    socket.on('updateMessages', async () => {
        //Send the messages that were already there when a new user connects
        const messages = await chatModel.find()
        io.emit('messageLogs', messages)
        //Issue alert to all users except the one being connected
        socket.broadcast.emit('newUserConnected')
    })

    sendUpdatedProducts(socket)

    async function sendUpdatedProducts(socket) {
        try {
            const updatedProducts = await productModel.find().lean()
            socket.emit('updateProducts', updatedProducts)
        } catch (error) {
            console.error("Internal server error", error)
            socket.emit('updateProducts', [])
        }
    }

    //Logic for save
    socket.on('addProduct', async (newProductData) => {
        try {
            const result = await productModel.create(newProductData);
            socket.emit('productAddedState', 'Product Added')
            sendUpdatedProducts(io);
        } catch (error) {
            if (error.code === 11000) {
                socket.emit('productAddedState', 'Error: Duplicate key, product code already exists');
            } else {
                console.error('Internal server error', error);
                socket.emit('productAddedState', 'Internal server error')
            }
        }
    })

    //Delete product
    socket.on('deleteProduct', async (id) => {
        try {
            let productState = await productModel.findByIdAndDelete(id)
            if (productState !== null) {
                socket.emit('deleteProduct', 'Product deleted')
                sendUpdatedProducts(io)
            } else {
                socket.emit('deleteProduct', 'Not found')
            }
        } catch (error) {
            //Verify CastError
            if (error instanceof mongoose.CastError) {
                socket.emit('deleteProduct', 'Error: ID Product not valid');
            } else {
                console.error('Internal server error', error)
                socket.emit('deleteProduct', 'Internal server error')
            }
        }
    })
})