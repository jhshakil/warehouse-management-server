const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express.json());

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    // console.log(authHeader)
    if (!authHeader) {
        return res.status(404).send({ massage: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECURE_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ massage: 'Forbidden access' });
        }
        console.log('decoded:', decoded)
        req.decoded = decoded;
        next()
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.od1ou.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const inventoryItems = client.db('carDealer').collection('inventory');

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.SECURE_TOKEN, { expiresIn: '1d' });
            res.send({ accessToken });
        })

        app.get('/inventory', async (req, res) => {
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

        app.post('/inventory', async (req, res) => {
            const newInventory = req.body;
            const result = await inventoryItems.insertOne(newInventory);
            res.send(result);
        })

        // Delete item 
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryItems.deleteOne(query);
            res.send(result);
        })

        // My items 
        app.get('/myitems', verifyToken, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            console.log(email, decodedEmail)
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = inventoryItems.find(query);
                const myitems = await cursor.toArray();
                res.send(myitems);
            } else {
                return res.status(403).send({ massage: 'Forbiddens access' })
            }
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