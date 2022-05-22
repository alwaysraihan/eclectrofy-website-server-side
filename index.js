const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");

const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
app.use(cors());
require("dotenv").config();
app.use(express.json());
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tllku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

const run = async () => {
    try {
        await client.connect();
        console.log("Database Connected");
        const toolsCoolection = client.db("Menufacturer").collection("Tools");
        const orderCollection = client.db("Menufacturer").collection("Orders");
        app.get("/tools", async (req, res) => {
            const qurey = {};
            const cursor = toolsCoolection.find(qurey);
            const tools = await cursor.limit(6).toArray();

            res.send(tools);
        });
        app.get("/tools/:id", async (req, res) => {
            const id = req.params.id;

            try {
                const qurey = { _id: ObjectId(id) };
                const tools = await toolsCoolection.findOne(qurey);
                res.send(tools);
            } catch (error) {
                return res.send({ message: "Data not found" });
            }
        });
        app.get("/order", async (req, res) => {
            const email = req.query.email;
            try {
                const qurey = { buyerEmail: email };
                const orders = await orderCollection.find(qurey).toArray();
                res.send(orders);
            } catch (error) {
                return res.send({ message: "Data not found" });
            }
        });
        app.post("/order", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send({ success: true, result });
        });
    } finally {
    }
};
run().catch(console.dir);
app.get("/", (reqest, res) => {
    res.status(200).send("Hello I'm set and listening form doctor portal");
});

app.listen(port, () => {
    console.log("Listening on port", port);
});
