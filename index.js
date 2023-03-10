const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');


// middle were 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jjbnacp.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    console.log('token inside verifyJWT', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split('')[1];
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const categoryCollections = client.db('lightAtticDB').collection('categories');
        const petsCollection = client.db('lightAtticDB').collection('pets');
        const usersCollection = client.db('lightAtticDB').collection('users');
        const bookingCollections = client.db('lightAtticDB').collection('bookings')
        const paymentsCollection = client.db('sweetRepeats').collection('payments');

        app.get('/categories', async (req, res) => {
            const query = {};
            const options = await categoryCollections.find(query).toArray();
            res.send(options);
        })
        app.get('/category', async (req, res) => {
            const query = {};
            const products = await petsCollection.find(query).toArray();
            res.send(products);
        })

        //for all cards based on category id
        app.get('/categories/:category_id', async (req, res) => {
            const id = req.params.category_id;
            const query = { category_id: id };
            console.log(id, query)
            const result = await petsCollection.find(query).toArray();
            res.send(result);
        })
        // add pet 
        app.post('/category', async (req, res) => {
            const product = req.body;
            const result = await petsCollection.insertOne(product);
            res.send(result);
        })

        app.get('/categoriesname', async (req, res) => {
            const query = {};
            const result = await categoryCollections.find(query).project({ category_name: 1 }).toArray();
            res.send(result);
        })
        app.get('/category', async (req, res) => {
            const product = req.body;
            const result = await petsCollection.find(product).toArray();
            res.send(result);
        })

        //users
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // admin 
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {

            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        // admin role 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })
        //check seller
        app.get('/users/Seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })

        //for all buyers
        app.get('/allbuyers', async (req, res) => {
            const query = { role: "Buyer" };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
        })
        //for all buyers

        //  for all sellers
        app.get('/allsellers', async (req, res) => {
            const query = { role: "Seller" };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        })

        app.get('/allsellers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result);

        });

        app.delete('/allbuyers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })
        //  for all sellers
        //orders
        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await categoryCollections.findOne(query)
            res.send(service)
        });

        //advertise
        app.put('/advertiseproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    advertise: true
                }
            }
            const result = await petsCollection.updateOne(query, updateDoc, option);
            res.send(result);

        });
        app.get('/advertiseproduct', async (req, res) => {
            const query = { advertise: true }
            const result = await petsCollection.find(query).toArray();
            res.send(result)
        })
        //report
        app.put('/reportproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const option = { upsert: true };
            const updateDoc = {
                $set: {
                    report: true
                }
            }
            const result = await petsCollection.updateOne(query, updateDoc, option);
            res.send(result);

        });
        app.get('/reportproduct', async (req, res) => {
            const query = { report: true }
            const result = await petsCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/reportproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await petsCollection.deleteOne(query);
            res.send(result);

        });

        //for bookings
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const booking = await bookingCollections.find(query).toArray();
            res.send(booking);
        });
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollections.insertOne(booking);
            res.send(result)
        });
        //payment
        //payment
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await bookingCollections.findOne(query);
            res.send(booking)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollections.updateOne(filter, updatedDoc)
            res.send(result);
        })
        //jwt
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '10hr' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: 'token' })
        });
    }
    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('light attics server is running');
})

app.listen(port, () => console.log(`light attic running ${port}`))