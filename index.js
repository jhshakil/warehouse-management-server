const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.od1ou.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryItems = client.db('carDealer').collection('inventory');

        app.get('/inventorys', async (req, res) => {
            const query = {};
            const cursor = inventoryItems.find(query);
            const inventory = await cursor.toArray();
            res.send(inventory);
        })

        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const inventory = await inventoryItems.findOne(query);
            res.send(inventory);
        })

        // update quantity 
        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const updateQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: updateQuantity.quantity
                }
            };
            const result = await inventoryItems.updateOne(filter, updateDoc, options);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir)


app.get('', (req, res) => {
    res.send('server is running');
})

app.listen(port, () => {
    console.log('Port number is', port);
})