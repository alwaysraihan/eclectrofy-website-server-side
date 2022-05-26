const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");

const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tllku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

const verifyToken = async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
        return res.status(401).send({ message: "UnAutorized access" });
    }
    const authToken = authorizationHeader.split(" ")[1];
    jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
    });
};

const run = async () => {
    try {
        await client.connect();
        console.log("Database Connected");
        const toolsCoolection = client.db("Menufacturer").collection("Tools");
        const orderCollection = client.db("Menufacturer").collection("Orders");
        const UserCollections = client.db("Menufacturer").collection("Users");
        const ReivewsCollection = client.db("Reivews").collection("Rivew");
        const PaymentCollections = client
            .db("Menufacturer")
            .collection("payment");

        // verifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await UserCollections.findOne({
                email: requester,
            });
            if (requesterAccount.role === "admin") {
                next();
            } else {
                return res.status(403).send({ message: "Forbidden access" });
            }
        };
        /* Admin section
        1. get admin
        2. put admin
        
        */
        // get  admin
        app.get("/admin/:email", async (req, res) => {
            const email = req.params.email;

            const user = await UserCollections.findOne({ email: email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin });
        });
        // put admin
        app.put(
            "/user/admin/:email",
            verifyToken,
            verifyAdmin,
            async (req, res) => {
                const email = req.params.email;

                const filter = { email: email };

                const updateDoc = {
                    $set: { role: "admin" },
                };
                const result = await UserCollections.updateOne(
                    filter,
                    updateDoc
                );

                return res.send({ result });
            }
        );
        // user
        app.get("/user", verifyToken, async (req, res) => {
            const user = await UserCollections.find().toArray();
            res.send(user);
        });

        app.post("/create-payment-intent", verifyToken, async (req, res) => {
            const order = req.body;

            const subTotal = order.subTotal;
            const amount = subTotal * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.status(200).send({ clientSecret: paymentIntent.client_secret });
        });
        app.get("/my-profile", verifyToken, async (req, res) => {
            const email = req.query.email;

            try {
                const qurey = { email: email };
                const orders = await UserCollections.find(qurey).toArray();
                res.send(orders);
            } catch (error) {
                return res.send({ message: "Data not found" });
            }
        });
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await UserCollections.updateOne(
                filter,
                updateDoc,
                options
            );
            const token = jwt.sign(
                { email: email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1d" }
            );
            res.send({ result, token });
        });
        app.put("/user/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const ProfileData = req.body;
            try {
                const filter = { email: email };

                const options = { upsert: true };
                const updateDoc = {
                    $set: {
                        ProfileData,
                    },
                };
                const result = await UserCollections.updateOne(
                    filter,
                    updateDoc,
                    options
                );

                res.send({ success: true, result });
            } catch (error) {
                return res.send({ message: "Data not found" });
            }
        });
        app.get("/rivews", async (req, res) => {
            const qurey = {};
            const cursor = ReivewsCollection.find(qurey);
            const rivew = await cursor.toArray();

            res.send(rivew);
        });
        app.post("/rivews", async (req, res) => {
            const rivew = req.body;
            const result = await ReivewsCollection.insertOne(rivew);
            res.send({ success: true, result });
        });
        app.get("/tools", async (req, res) => {
            const qurey = {};
            const cursor = toolsCoolection.find(qurey);
            const tools = await cursor.toArray();

            res.send(tools);
        });
        app.get("/tools/:id", verifyToken, async (req, res) => {
            const id = req.params.id;

            image.png;
        });
        app.post("/tools", verifyToken, verifyAdmin, async (req, res) => {
            const product = req.body;
            const result = await toolsCoolection.insertOne(product);
            res.send(result);
        });
        app.delete("/tools/:id", verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            try {
                const filter = { _id: ObjectId(id) };
                const result = await toolsCoolection.deleteOne(filter);
                res.send(result);
            } catch (error) {
                res.status(204).send({ error: "something went worng" });
            }
        });
        app.get("/all-orders", async (req, res) => {
            const qurey = {};
            const cursor = orderCollection.find(qurey);
            const alOrders = await cursor.toArray();

            res.send(alOrders);
        });
        app.get("/order", verifyToken, async (req, res) => {
            const email = req.query.email;
            try {
                const qurey = { buyerEmail: email };
                const orders = await orderCollection.find(qurey).toArray();
                res.send(orders);
            } catch (error) {
                return res.send({ message: "Data not found" });
            }
        });
        app.get("/order/:id", verifyToken, async (req, res) => {
            const id = req.params.id;

            try {
                const qurey = { _id: ObjectId(id) };
                const order = await orderCollection.findOne(qurey);
                res.send(order);
            } catch (error) {
                return res.send({ message: "Data not found" });
            }
        });
        app.post("/order", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send({ success: true, result });
        });
        app.patch("/order/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            try {
                const filter = { _id: ObjectId(id) };

                const options = { upsert: true };
                const updateDoc = {
                    $set: {
                        paid: true,
                        transactionId: payment.transactionId,
                    },
                };
                const result = await orderCollection.updateOne(
                    filter,
                    updateDoc
                );
                const updatePayment = await PaymentCollections.insertOne(
                    payment
                );
                res.send(result);
            } catch (error) {
                return res.send({ message: "Data not found" });
            }
        });
        app.delete("/order/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            try {
                const filter = { _id: ObjectId(id) };
                const result = await orderCollection.deleteOne(filter);
                res.send(result);
            } catch (error) {
                res.status(204).send({ error: "something went worng" });
            }
        });
    } finally {
    }
};
run().catch(console.dir);
app.get("/", (reqest, res) => {
    res.status(200).send("Hello I'm set and  listening form Electrofy");
});

app.listen(port, () => {
    console.log("Listening on port", port);
});
