const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wynhew4.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN,function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const allCategoriesCollection = client.db('aarbooks').collection('allCategoties');

        const booksCollection = client.db('aarbooks').collection('books');

        const bookingsCollection = client.db('aarbooks').collection('booking');

        const usersCollection = client.db('aarbooks').collection('users');

        app.get('/allCategoties',async(req, res) =>{
            const query = {};
            const categories = await allCategoriesCollection.find(query).toArray();
            res.send(categories);
        });

        app.get("/category/:id", async (req, res) =>{
            const id = req.params.id;
            const query = {categoryId: id};
            const books = await booksCollection.find(query).toArray();
            res.send(books);
        });

        app.get('/bookings',verifyJWT, async(req, res) =>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = { email:email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });

        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN,{expiresIn:'10h'})
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''})
        })

        app.get('/users',async(req, res) =>{
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.post('/users', async(req, res) =>{
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/buyers', async(req,res) =>{
            const role = req.query.role;
            const query = {role: role};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });

        app.delete("/buyer/:id",verifyJWT,async(req,res) =>{
            const id=req.params.id;
            const filter = {_id: new ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/users/buyer/:email',async(req,res)=>{
            const  email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isBuyer:user?.role === "Buyer"});
        })


         app.get('/products',verifyJWT, async(req,res) =>{
            const query = {};
            const products = await booksCollection.find(query).toArray();
            res.send(products);
        })

        app.post('/products',verifyJWT, async(req,res) =>{
            const product = req.body;
            const result = await booksCollection.insertOne(product);
            res.send(result)
        });

        app.delete('/products/:id', verifyJWT, async(req,res) =>{
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)};
            const result = await booksCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/sellers', async(req,res) =>{
            const role = req.query.role;
            const query = {role: role};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/users/seller/:email',async(req,res)=>{
            const  email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isSeller:user?.role === "Seller"});
        });

        app.delete("/seller/:id",async(req,res) =>{
            const id=req.params.id;
            const filter = {_id: new ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })

        app.put('/users/admin/:id',verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = {email:decodedEmail};
            const user = await usersCollection.findOne(query);

            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter,updatedDoc,options);
            res.send(result)
        })

    }
    finally{

    }
}
run().catch(console.log)


app.get('/', async(req, res) =>{
    res.send('aar books server is running');
})

app.listen(port, () =>console.log(`aar books running on ${port}`))